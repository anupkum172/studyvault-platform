import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, FileSearch, Lock, Mail, UploadCloud, User } from 'lucide-react';
import { useAuth } from '../main';

const highlights = [
  ['Curate', 'Upload trusted class material with useful metadata.', UploadCloud],
  ['Find', 'Search by title, subject, semester, branch, and type.', FileSearch],
  ['Protect', 'Keep uploads tied to secure student accounts.', Lock]
];

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: 'Computer Science',
    semester: '4'
  });

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="flex items-center bg-slate-950 px-6 py-12 text-white md:px-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-600">
                <BookOpen size={25} />
              </div>
              <div>
                <p className="text-lg font-bold">StudyVault</p>
                <p className="text-sm text-slate-400">Academic resource repository</p>
              </div>
            </div>

            <h1 className="mt-12 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
              A cleaner way to store and find study material.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Build a shared library for notes, question papers, assignments, and guides with an interface that stays fast and focused.
            </p>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {highlights.map(([title, text, Icon]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <Icon className="text-teal-300" size={21} />
                  <p className="mt-4 font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-10">
          <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Access your academic vault.</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-md py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              >
                Register
              </button>
            </div>

            {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

            <div className="space-y-4">
              {mode === 'register' && (
                <label className="relative block">
                  <User className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    className="input-icon"
                    required
                    placeholder="Full name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </label>
              )}
              <label className="relative block">
                <Mail className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  className="input-icon"
                  type="email"
                  required
                  placeholder="Email address"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>
              <label className="relative block">
                <Lock className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  className="input-icon"
                  type="password"
                  required
                  placeholder="Password, minimum 6 characters"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              </label>
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Branch"
                    value={form.branch}
                    onChange={(event) => setForm({ ...form, branch: event.target.value })}
                  />
                  <select className="input" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn-primary w-full">{mode === 'login' ? 'Sign In' : 'Create Account'}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
