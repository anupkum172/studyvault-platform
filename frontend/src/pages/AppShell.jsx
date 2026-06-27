import { NavLink, Route, Routes } from 'react-router-dom';
import React from 'react';
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Search,
  UploadCloud,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../main';
import Dashboard from './Dashboard';
import Resources from './Resources';
import Upload from './Upload';
import Profile from './Profile';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resources', icon: Search, label: 'Resources' },
  { to: '/upload', icon: UploadCloud, label: 'Upload' },
  { to: '/profile', icon: UserCircle, label: 'Profile' }
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700 text-white">
        <BookOpen size={23} />
      </div>
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-950">StudyVault</h1>
        <p className="text-xs font-medium text-slate-500">Academic resource workspace</p>
      </div>
    </div>
  );
}

function NavItem({ item, compact = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg font-semibold transition',
          compact ? 'justify-center px-3 py-2' : 'px-3.5 py-3',
          isActive
            ? 'bg-slate-950 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        ].join(' ')
      }
      title={compact ? item.label : undefined}
    >
      <Icon size={19} />
      {!compact && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <BrandMark />

        <nav className="mt-8 flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="truncate text-sm font-bold text-slate-950">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <button onClick={logout} className="btn-secondary mt-3 justify-start text-red-700 hover:bg-red-50">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <button
            onClick={logout}
            className="grid h-10 w-10 place-items-center rounded-lg text-red-700 hover:bg-red-50"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
        <nav className="mt-3 grid grid-cols-4 gap-2">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} compact />
          ))}
        </nav>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
