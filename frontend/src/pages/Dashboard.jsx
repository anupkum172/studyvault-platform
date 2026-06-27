import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, BookCopy, FolderOpen, GraduationCap, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const statStyles = [
  'bg-teal-50 text-teal-700 ring-teal-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-rose-50 text-rose-700 ring-rose-100'
];

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/resources/meta/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    ['Total Resources', data.stats.totalResources || 0, FolderOpen],
    ['My Uploads', data.stats.myUploads || 0, BookCopy],
    ['My Downloads', data.stats.myDownloads || 0, ArrowDownToLine],
    ['Subjects', data.stats.subjects || 0, GraduationCap]
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="muted-label text-teal-200">StudyVault Pro</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
              Organize course material without losing the thread.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Upload notes, previous papers, assignments, and guides into a searchable workspace built for fast revision.
            </p>
          </div>
          <Link to="/upload" className="btn-primary bg-teal-600 hover:bg-teal-500">
            <Plus size={18} />
            Upload Resource
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon], index) => (
          <div className="card p-5" key={label}>
            <div className={`mb-5 grid h-11 w-11 place-items-center rounded-lg ring-1 ${statStyles[index]}`}>
              <Icon size={21} />
            </div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{loading ? '-' : value}</h3>
          </div>
        ))}
      </section>

      <section className="card p-5 md:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Recent Uploads</h2>
            <p className="text-sm text-slate-500">Newest resources shared across your repository.</p>
          </div>
          <Link to="/resources" className="btn-secondary py-2">
            View Repository
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recent.length ? (
            data.recent.map((resource) => (
              <div key={resource.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="font-semibold text-slate-950">{resource.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {resource.subject} | Semester {resource.semester} | by {resource.ownerName}
                  </p>
                </div>
                <span className="badge w-fit capitalize">{resource.type}</span>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">No resources yet</p>
              <p className="mt-1 text-sm text-slate-500">Upload the first file to start building your vault.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
