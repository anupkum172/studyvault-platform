import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, FileCheck2, X } from 'lucide-react';
import api from '../lib/api';

export default function Upload() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    semester: '4',
    branch: 'Computer Science',
    type: 'notes',
    description: '',
    tags: ''
  });
  const [file, setFile] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append('file', file);
      await api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/resources');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Upload timed out. Try a smaller file, or check Cloudinary and Vercel function logs.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 413) {
        setError('File is too large for the deployment. Try a smaller file.');
      } else if (!err.response) {
        setError('Could not reach the upload API. Check that the backend service deployed successfully.');
      } else {
        setError(`Upload failed with status ${err.response.status}.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Upload Academic Material</h1>
        <p className="page-subtitle">Share notes, papers, assignments, and guides with searchable metadata.</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card space-y-5 p-5 md:p-6">
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          <div>
            <p className="muted-label mb-3">Resource Details</p>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="input"
                required
                placeholder="Document title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
              <input
                className="input"
                required
                placeholder="Subject, e.g. DBMS"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <select className="input" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                <option key={semester}>{semester}</option>
              ))}
            </select>
            <input
              className="input"
              required
              placeholder="Branch"
              value={form.branch}
              onChange={(event) => setForm({ ...form, branch: event.target.value })}
            />
            <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="notes">Notes</option>
              <option value="assignment">Assignment</option>
              <option value="paper">Question Paper</option>
              <option value="guide">Study Guide</option>
            </select>
          </div>

          <textarea
            className="input min-h-32"
            placeholder="Add a short description so classmates know what this covers."
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <input
            className="input"
            placeholder="Tags, e.g. exam, important, unit-1"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
        </section>

        <aside className="card h-fit p-5">
          <p className="muted-label mb-3">File Upload</p>
          <label className="grid min-h-56 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-teal-500 hover:bg-teal-50/50">
            <input type="file" required className="hidden" onChange={(event) => setFile(event.target.files[0])} />
            <div>
              {file ? (
                <FileCheck2 className="mx-auto mb-3 text-teal-700" size={42} />
              ) : (
                <CloudUpload className="mx-auto mb-3 text-slate-500" size={42} />
              )}
              <p className="break-all font-bold text-slate-950">{file ? file.name : 'Choose a file'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">PDF, DOC, PPT, TXT, JPG, or PNG up to 20 MB.</p>
            </div>
          </label>

          {file && (
            <button type="button" className="btn-secondary mt-3 w-full py-2.5" onClick={() => setFile(null)}>
              <X size={17} />
              Remove File
            </button>
          )}

          <button className="btn-primary mt-4 w-full" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Resource'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary mt-3 w-full">
            Cancel
          </button>
        </aside>
      </form>
    </div>
  );
}
