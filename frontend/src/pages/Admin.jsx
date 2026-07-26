import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
  XCircle
} from 'lucide-react';
import api from '../lib/api';

const typeLabels = {
  notes: 'Notes',
  assignment: 'Assignment',
  paper: 'Question Paper',
  guide: 'Study Guide'
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-100',
  approved: 'bg-teal-50 text-teal-800 ring-teal-100',
  rejected: 'bg-red-50 text-red-800 ring-red-100'
};

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSize(bytes = 0) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Admin() {
  const [data, setData] = useState({ stats: {}, users: [], resources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/overview');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resourceRows = useMemo(() => data.resources || [], [data.resources]);
  const pendingRows = useMemo(() => resourceRows.filter((resource) => resource.status === 'pending'), [resourceRows]);

  const removeResource = async (resource) => {
    if (!confirm(`Delete "${resource.title}" from StudyVault?`)) return;
    await api.delete(`/admin/resources/${resource.id}`);
    load();
  };

  const saveResource = async (event) => {
    event.preventDefault();
    await api.put(`/admin/resources/${editing.id}`, editing);
    setEditing(null);
    load();
  };

  const downloadResource = async (resource) => {
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

  const reviewResource = async (resource, status) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!confirm(`${action[0].toUpperCase()}${action.slice(1)} "${resource.title}"?`)) return;
    await api.patch(`/admin/resources/${resource.id}/review`, { status });
    load();
  };

  const cards = [
    ['Total Users', data.stats.users || 0, UsersRound, 'bg-indigo-50 text-indigo-700 ring-indigo-100'],
    ['Pending Approval', data.stats.pending || 0, Clock3, 'bg-amber-50 text-amber-700 ring-amber-100'],
    ['Approved Files', data.stats.approved || 0, ShieldCheck, 'bg-teal-50 text-teal-700 ring-teal-100'],
    ['Downloads', data.stats.downloads || 0, Download, 'bg-emerald-50 text-emerald-700 ring-emerald-100']
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="muted-label text-teal-700">Admin Section</p>
          <h1 className="page-title">Manage StudyVault uploads</h1>
          <p className="page-subtitle">
            Review what students upload, monitor users, correct resource details, and remove files when needed.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-secondary w-fit">
          Refresh
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, style]) => (
          <div key={label} className="card p-5">
            <div className={`mb-5 grid h-11 w-11 place-items-center rounded-lg ring-1 ${style}`}>
              <Icon size={21} />
            </div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{loading ? '-' : value}</h3>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-950">All Uploaded Resources</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pendingRows.length} pending approval | newest uploads appear first.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Uploaded By</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Storage</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resourceRows.map((resource) => (
                  <tr key={resource.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                          <FileText size={19} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-950">{resource.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{resource.originalName}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatSize(resource.fileSize)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{resource.ownerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(resource.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{resource.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Sem {resource.semester} | {resource.branch} | {typeLabels[resource.type] || resource.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{resource.downloads} downloads</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge capitalize ${statusStyles[resource.status] || statusStyles.approved}`}>
                        {resource.status || 'approved'}
                      </span>
                      {resource.reviewedBy && (
                        <p className="mt-2 text-xs text-slate-500">by {resource.reviewedBy}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge capitalize">{resource.storageProvider || 'local'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {resource.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => reviewResource(resource, 'approved')}
                            className="btn-secondary px-3 py-2 text-teal-700 hover:bg-teal-50"
                            aria-label="Approve resource"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {resource.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => reviewResource(resource, 'rejected')}
                            className="btn-secondary px-3 py-2 text-red-700 hover:bg-red-50"
                            aria-label="Reject resource"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadResource(resource)}
                          className="btn-secondary px-3 py-2"
                          aria-label="Download resource"
                        >
                          <Download size={16} />
                        </button>
                        <button type="button" onClick={() => setEditing(resource)} className="btn-secondary px-3 py-2" aria-label="Edit resource">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => removeResource(resource)} className="btn-danger px-3 py-2" aria-label="Delete resource">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !resourceRows.length && (
            <div className="p-10 text-center">
              <FileText className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-semibold text-slate-700">No uploads yet</p>
              <p className="mt-1 text-sm text-slate-500">Uploaded documents will appear here for admin review.</p>
            </div>
          )}
        </div>

        <aside className="card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
              <UserRound size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Registered Users</h2>
              <p className="text-sm text-slate-500">{data.users.length} account{data.users.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {data.users.map((user) => (
              <div key={user.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className={user.role === 'admin' ? 'badge bg-teal-50 text-teal-800 ring-teal-100' : 'badge'}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {user.branch || 'Branch not set'} | Semester {user.semester || '-'}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={saveResource} className="card w-full max-w-xl space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Admin Edit Resource</h2>
                <p className="text-sm text-slate-500">Uploaded by {editing.ownerName}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <input className="input" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <input className="input" value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input" value={editing.semester} onChange={(event) => setEditing({ ...editing, semester: event.target.value })} />
              <input className="input" value={editing.branch} onChange={(event) => setEditing({ ...editing, branch: event.target.value })} />
              <select className="input" value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value })}>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              className="input min-h-28"
              value={editing.description || ''}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />
            <input className="input" value={editing.tags || ''} onChange={(event) => setEditing({ ...editing, tags: event.target.value })} />
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
