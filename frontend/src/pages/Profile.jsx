import React, { useState } from 'react';
import { Mail, Save, UserRound } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../main';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    branch: user.branch,
    semester: user.semester,
    bio: user.bio || ''
  });
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const response = await api.put('/auth/profile', form);
    updateUser(response.data.user);
    setMessage('Profile updated successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Student Profile</h1>
        <p className="page-subtitle">Manage your academic identity and account information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-5">
          <div className="grid h-20 w-20 place-items-center rounded-lg bg-slate-950 text-white">
            <UserRound size={36} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-950">{user.name}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Mail size={16} />
            {user.email}
          </p>
          <div className="mt-5 grid gap-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="muted-label">Branch</p>
              <p className="mt-1 font-semibold text-slate-800">{user.branch}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="muted-label">Semester</p>
              <p className="mt-1 font-semibold text-slate-800">{user.semester}</p>
            </div>
          </div>
        </aside>

        <form onSubmit={submit} className="card grid gap-4 p-5 md:grid-cols-2 md:p-6">
          {message && <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 md:col-span-2">{message}</p>}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
            <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Branch</label>
            <input className="input" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Semester</label>
            <select className="input" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                <option key={semester}>{semester}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input className="input" value={user.email} disabled />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Bio</label>
            <textarea
              className="input min-h-32"
              placeholder="Add a short academic bio."
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </div>
          <button className="btn-primary w-fit">
            <Save size={18} />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
