# StudyVault Pro - Full Stack Academic Resource Repository

A polished full-stack StudyVault project with a modern React frontend and Express backend. It uses a local JSON database, so it runs without MongoDB.

## Features

- User registration and login
- Forgot password flow with email verification code
- JWT authentication
- Upload academic resources with files
- Preview selected PDF/image files before submitting upload
- New uploads wait for admin approval before other students can see them
- Download uploaded files
- Search resources by keyword
- Filter by semester, subject, type, and branch
- Edit and delete your own uploads
- Admin section to approve, reject, edit, and delete uploaded resources
- Admin user overview with upload and download statistics
- Dashboard with stats
- User profile update
- Professional responsive UI

## Tech Stack

Frontend: React, Vite, Tailwind CSS, Lucide React, Axios, React Router
Backend: Node.js, Express.js, JWT, bcryptjs, multer, local JSON database

## Folder Structure

```
studyvault-pro/
  backend/
  frontend/
  package.json
  README.md
```

## How to Run

### 1. Install Node.js
Install Node.js LTS from nodejs.org. Restart VS Code after installation.

### 2. Open Project
Open VS Code, then open the `studyvault-pro` folder.

### 3. Install Dependencies
Open a terminal in the main `studyvault-pro` folder:

```bash
npm install
npm run install-all
```

### 4. Start the Website

```bash
npm run dev
```

This starts both apps:

```txt
Frontend: http://localhost:5273
Backend:  http://localhost:5000
```

### Alternative: Run in Two Terminals

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```txt
http://localhost:5273
```

## Demo Flow

1. Register a new account.
2. Login.
3. Use forgot password if you need to reset access.
4. Upload a PDF/image/document resource.
5. Admin approves the pending upload.
6. Search and filter approved resources.
7. Download files.
8. Edit/delete your own uploads.
9. Update profile.

## Environment Variables

Backend already includes `.env.example`. Create `.env` in backend if needed:

```env
PORT=5000
JWT_SECRET=studyvault_super_secret_key_change_later
CLIENT_URL=http://localhost:5273
ADMIN_EMAILS=admin@example.com
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=StudyVault Pro <onboarding@resend.dev>
```

No MongoDB required for local development. To make yourself an admin, add your registered email to `ADMIN_EMAILS`. Multiple admins can be comma-separated, for example `ADMIN_EMAILS=first@example.com,second@example.com`.

For production password reset emails, create a Resend account and add `RESEND_API_KEY` plus `EMAIL_FROM`. In local development, if email is not configured, the reset page can still show a development verification code for testing.

## Deploy on Vercel

This repository includes `vercel.json` for Vercel Services. It deploys:

- `frontend` as the Vite web app at `/`
- `backend` as the Express API at `/_/backend`

The frontend automatically calls the backend route in production. Set `VITE_API_URL` only if you deploy the backend somewhere else.

## Production Storage

For production deployment, set these environment variables in Vercel:

```env
JWT_SECRET=use_a_long_random_secret
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/studyvault
MONGODB_DB=studyvault
ADMIN_EMAILS=your-email@example.com
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=StudyVault Pro <onboarding@resend.dev>
```

For persistent file uploads, also add Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Without `MONGODB_URI`, the backend falls back to local JSON storage for development. On Vercel, that fallback is temporary and should only be used for quick testing.

Cloudinary is required for uploads on Vercel. If Cloudinary is not configured, uploads are blocked because Vercel local file storage is temporary and downloads can break.
