const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enables cross-origin requests from your frontend

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_safety';
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ==========================================
// 1. DATABASE INTEGRATION & CONNECTION
// ==========================================
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyvault';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Ecosystem Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 2. DATABASE SCHEMAS & MODELS
// ==========================================

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    createdAt: { type: Date, default: Date.now }
});

// Resource Schema
const ResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    courseCode: { type: String, required: true, index: true },
    resourceType: {
        type: String,
        enum: ['notes', 'assignments', 'papers', 'guides'],
        required: true
    },
    professor: { type: String, default: '' },
    description: { type: String, default: '' },

    fileUrl: { type: String, default: '' },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploaderName: { type: String, required: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Compound Text Index for fast Keyword Searching across Title, Description, and Course Codes
ResourceSchema.index({ title: 'text', description: 'text', courseCode: 'text' });

const User = mongoose.model('User', UserSchema);
const Resource = mongoose.model('Resource', ResourceSchema);

// ==========================================
// 3. AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extracts token from "Bearer <TOKEN>"

    if (!token) return res.status(401).json({ message: 'Access Denied: Token Missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Session Expired or Invalid Token' });
        req.user = user; // Attach decrypted user data to request context
        next();
    });
};

// ==========================================
// 4. USER AUTHENTICATION APIs
// ==========================================

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        // Hash Password safely before writing to database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        // Sign and return a JWT Token automatically
        const token = jwt.sign({ id: newUser._id, name: newUser.name }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User does not exist' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current User Profile (Protected)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('bookmarks');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. RESOURCE MANAGEMENT, SEARCH & FILTER APIs
// ==========================================

// Create/Upload New Academic Resource (Protected)
// Create/Upload New Academic Resource (Protected)
app.post(
    '/api/resources',
    authenticateToken,
    upload.single('file'),
    async (req, res) => {
        try {
            const {
                title,
                courseCode,
                resourceType,
                professor,
                description
            } = req.body;

            const newResource = new Resource({
                title,
                courseCode,
                resourceType,
                professor,
                description,
                uploadedBy: req.user.id,
                uploaderName: req.user.name,
                fileUrl: req.file ? req.file.path : ''
            });

            await newResource.save();

            res.status(201).json({
                message: 'Resource uploaded successfully',
                resource: newResource
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Advanced Dynamic Search & Filter Resource Database
app.get('/api/resources', async (req, res) => {
    try {
        const { search, type, department, sort } = req.query;
        let queryConditions = {};

        // Keyword lookup via the MongoDB Text Index
        if (search) {
            queryConditions.$text = { $search: search };
        }

        // Exact match filter for document type
        if (type) {
            queryConditions.resourceType = type;
        }

        // Department extraction based on Course Code prefix pattern (e.g. "CS" matches "CS101", "CS202")
        if (department) {
            queryConditions.courseCode = { $regex: `^${department}`, $options: 'i' };
        }

        // Setup Sorting
        let sortOption = { createdAt: -1 }; // Default: Latest uploads first
        if (sort === 'popular') sortOption = { views: -1 };

        const resources = await Resource.find(queryConditions).sort(sortOption);
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Track file interaction metrics (Increment Views when downloaded/read)
app.post('/api/resources/:id/view', async (req, res) => {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ message: 'Interaction registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. BOOKMARK MANAGEMENT APIs
// ==========================================

// Toggle Bookmark state (Add or Remove item) (Protected)
app.post('/api/bookmarks/toggle', authenticateToken, async (req, res) => {
    try {
        const { resourceId } = req.body;
        const user = await User.findById(req.user.id);

        const bookmarkIndex = user.bookmarks.indexOf(resourceId);
        let action = "";

        if (bookmarkIndex > -1) {
            // Document already bookmarked -> Remove it
            user.bookmarks.splice(bookmarkIndex, 1);
            action = "removed";
        } else {
            // Document not bookmarked -> Push it to array
            user.bookmarks.push(resourceId);
            action = "added";
        }

        await user.save();
        res.json({ message: `Bookmark ${action} successfully`, bookmarks: user.bookmarks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// START THE SERVER ENGINE
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 StudyVault Backend running smoothly on http://localhost:${PORT}`);
});
