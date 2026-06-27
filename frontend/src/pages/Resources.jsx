import React, { useEffect, useState } from 'react';
import { Download, FileText, Pencil, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import api from '../lib/api';

const typeOptions = [
  ['notes', 'Notes'],
  ['assignment', 'Assignment'],
  ['paper', 'Question Paper'],
  ['guide', 'Study Guide']
];

export default function Resources() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: '', semester: '', subject: '', type: '', branch: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (nextFilters = filters) => {
    setLoading(true);
    const response = await api.get('/resources', { params: nextFilters });
    setItems(response.data.resources);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const search = (event) => {
    event.preventDefault();
    load();
  };

  const clearFilters = () => {
    const emptyFilters = { q: '', semester: '', subject: '', type: '', branch: '' };
    setFilters(emptyFilters);
    load(emptyFilters);
  };

  const del = async (id) => {
    if (confirm('Delete this resource?')) {
      await api.delete(`/resources/${id}`);
      load();
    }
  };

  const download = async (resource) => {
    setError('');
    try {
      const response = await api.get(`/resources/${resource.id}/download`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = resource.originalName || resource.title || 'studyvault-resource';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      load();
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          setError(JSON.parse(text).message || 'Download failed.');
        } catch {
          setError(text || 'Download failed.');
        }
      } else {
        setError(err.response?.data?.message || 'Download failed.');
      }
    }
  };

  const save = async (event) => {
    event.preventDefault();
    await api.put(`/resources/${editing.id}`, editing);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="page-title">Resource Repository</h1>
          <p className="page-subtitle">Search, filter, download, and manage shared academic material.</p>
        </div>
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
          {loading ? 'Loading...' : `${items.length} result${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <form onSubmit={search} className="card grid gap-3 p-4 lg:grid-cols-[1.5fr_120px_150px_150px_150px_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            className="input-icon"
            placeholder="Search title, subject, or tags"
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />
        </label>
        <select
          className="input"
          value={filters.semester}
          onChange={(event) => setFilters({ ...filters, semester: event.target.value })}
        >
          <option value="">All Sem</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
            <option key={semester}>{semester}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Subject"
          value={filters.subject}
          onChange={(event) => setFilters({ ...filters, subject: event.target.value })}
        />
        <input
          className="input"
          placeholder="Branch"
          value={filters.branch}
          onChange={(event) => setFilters({ ...filters, branch: event.target.value })}
        />
        <select className="input" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
          <option value="">All Types</option>
          {typeOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn-primary">
          <SlidersHorizontal size={17} />
          Filter
        </button>
        <button type="button" onClick={clearFilters} className="btn-secondary">
          Clear
        </button>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((resource) => (
          <article key={resource.id} className="card flex min-h-[310px] flex-col p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <FileText size={21} />
              </div>
              <span className="badge capitalize">{resource.type}</span>
            </div>

            <h2 className="text-lg font-bold leading-6 text-slate-950">{resource.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {resource.subject} | Semester {resource.semester}
            </p>
            <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
              {resource.description || 'No description added.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-md bg-slate-100 px-2.5 py-1">{resource.branch}</span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1">{resource.downloads} downloads</span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1">by {resource.ownerName}</span>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-primary flex-1 py-2.5" onClick={() => download(resource)}>
                <Download size={17} />
                Download
              </button>
              {resource.isOwner && (
                <>
                  <button onClick={() => setEditing(resource)} className="btn-secondary px-3 py-2.5" aria-label="Edit resource">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => del(resource.id)} className="btn-danger" aria-label="Delete resource">
                    <Trash2 size={17} />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && !items.length && (
        <div className="card p-10 text-center">
          <FileText className="mx-auto text-slate-400" size={34} />
          <p className="mt-3 font-semibold text-slate-700">No resources found</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing filters or upload a new resource.</p>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={save} className="card w-full max-w-xl space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-950">Edit Resource</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <input className="input" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <input className="input" value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} />
            <textarea
              className="input min-h-28"
              value={editing.description}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
