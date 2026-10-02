import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Briefcase, CheckCircle2, DollarSign, LogOut, Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
import { api, token, CATEGORIES } from './api';

const STATUS = { new: 'New', in_contact: 'In Contact', approved: 'Approved', archived: 'Archived' };
const COLOR = {
  new: 'bg-blue-500/20 text-blue-300',
  in_contact: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  archived: 'bg-zinc-500/20 text-zinc-300',
};
const blankItem = { title: '', category: CATEGORIES[0], client_name: '', tag: '', description: '', image_url: '', featured: false };
// SQLite CURRENT_TIMESTAMP is UTC "YYYY-MM-DD HH:MM:SS"
const fmt = (d) => (d ? new Date(`${d.replace(' ', 'T')}Z`).toLocaleDateString() : '');

const Badge = ({ s }) => <span className={`rounded-full px-2.5 py-0.5 text-xs ${COLOR[s]}`}>{STATUS[s]}</span>;

export default function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [inq, setInq] = useState([]);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('desc');
  const [view, setView] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, i, p] = await Promise.all([
        api('/stats', { auth: true }),
        api(`/inquiries?status=${filter}&sort=${sort}`, { auth: true }),
        api('/portfolio'),
      ]);
      setStats(s); setInq(i); setItems(p); setErr('');
    } catch (e) { setErr(e.message); }
  }, [filter, sort]);

  useEffect(() => {
    if (!token()) nav('/admin/login');
    else load();
  }, [load, nav]);

  const logout = () => { localStorage.removeItem('ps_token'); nav('/admin/login'); };

  async function setStatus(id, status) {
    try {
      await api(`/inquiries/${id}/status`, { method: 'PATCH', auth: true, body: { status } });
      setView((v) => (v && v.id === id ? { ...v, status } : v));
      load();
    } catch (e) { setErr(e.message); }
  }

  async function saveItem(e) {
    e.preventDefault();
    try {
      const { id, ...body } = form;
      await api(id ? `/portfolio/${id}` : '/portfolio', { method: id ? 'PUT' : 'POST', auth: true, body });
      setForm(null);
      load();
    } catch (x) { setErr(x.message); }
  }

  async function removeItem(it) {
    if (!window.confirm(`Delete "${it.title}"? This cannot be undone.`)) return;
    try { await api(`/portfolio/${it.id}`, { method: 'DELETE', auth: true }); load(); } catch (x) { setErr(x.message); }
  }

  const cards = stats && [
    { label: 'Total inquiries', value: stats.total, Icon: Inbox },
    { label: 'Active projects', value: stats.active, Icon: Briefcase },
    { label: 'Completed projects', value: stats.completed, Icon: CheckCircle2 },
    { label: 'Estimated revenue', value: `$${stats.revenue.toLocaleString()}`, Icon: DollarSign },
  ];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-8">
        <h1 className="text-lg font-bold">prism <span className="grad-text">shift</span> admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-zinc-400 hover:text-white">View site</a>
          <button onClick={logout} className="flex items-center gap-1 text-zinc-400 hover:text-white"><LogOut size={16} />Log out</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex gap-2" role="tablist">
          {[['overview', 'Overview'], ['inquiries', 'Inquiries'], ['portfolio', 'Portfolio']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm ${tab === k ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-zinc-400 hover:bg-white/5'}`}>{l}</button>
          ))}
        </div>
        {err && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{err}</p>}

        {tab === 'overview' && stats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(({ label, value, Icon }) => (
                <div key={label} className="card p-5">
                  <Icon className="text-purple-400" size={22} />
                  <p className="mt-3 text-3xl font-bold">{value}</p>
                  <p className="text-sm text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">Active = approved. Completed = archived. Revenue = estimate from budget ranges of approved and archived inquiries.</p>
            <h2 className="mb-3 mt-10 text-lg font-semibold">Recent inquiry activity</h2>
            <ul className="card divide-y divide-white/5">
              {stats.recent.length === 0 && <li className="p-5 text-zinc-500">No inquiries yet.</li>}
              {stats.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                  <div><p className="font-medium">{r.client_name}</p><p className="text-sm text-zinc-500">{r.service_type} - {fmt(r.created_at)}</p></div>
                  <Badge s={r.status} />
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'inquiries' && (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <select aria-label="Filter by status" className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <select aria-label="Sort by date" className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr><th className="p-4">Client</th><th className="p-4">Service</th><th className="p-4">Budget</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4"><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inq.length === 0 && <tr><td colSpan="6" className="p-6 text-zinc-500">No inquiries match this filter.</td></tr>}
                  {inq.map((r) => (
                    <tr key={r.id}>
                      <td className="p-4"><p className="font-medium">{r.client_name}</p><p className="text-zinc-500">{r.client_email}</p></td>
                      <td className="p-4">{r.service_type}</td>
                      <td className="p-4">{r.budget_range}</td>
                      <td className="p-4">{fmt(r.created_at)}</td>
                      <td className="p-4"><Badge s={r.status} /></td>
                      <td className="p-4"><button className="btn-ghost !px-3 !py-1.5" onClick={() => setView(r)}><Eye size={14} />View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'portfolio' && (
          <>
            <button className="btn-primary mb-6" onClick={() => setForm({ ...blankItem })}><Plus size={16} />Add project</button>
            <div className="grid gap-4 md:grid-cols-2">
              {items.length === 0 && <p className="text-zinc-500">No portfolio items yet. Add your first project.</p>}
              {items.map((it) => (
                <div key={it.id} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{it.title}{it.featured && <span className="ml-2 text-xs text-purple-300">Featured</span>}</p>
                    <p className="text-sm text-zinc-500">{it.category}{it.client_name ? ` - ${it.client_name}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button aria-label={`Edit ${it.title}`} className="rounded-lg p-2 hover:bg-white/10" onClick={() => setForm({ ...blankItem, ...it })}><Pencil size={16} /></button>
                    <button aria-label={`Delete ${it.title}`} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" onClick={() => removeItem(it)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={() => setView(null)}>
          <div role="dialog" aria-modal="true" aria-label="Inquiry details" className="card relative w-full max-w-lg bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" className="absolute right-4 top-4 text-zinc-400 hover:text-white" onClick={() => setView(null)}><X size={20} /></button>
            <h2 className="text-xl font-bold">{view.client_name}</h2>
            <a className="text-sm text-blue-400" href={`mailto:${view.client_email}`}>{view.client_email}</a>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-zinc-500">Service</dt><dd>{view.service_type}</dd></div>
              <div><dt className="text-zinc-500">Budget</dt><dd>{view.budget_range || '-'}</dd></div>
              <div><dt className="text-zinc-500">Deadline</dt><dd>{view.deadline || '-'}</dd></div>
              <div><dt className="text-zinc-500">Received</dt><dd>{fmt(view.created_at)}</dd></div>
            </dl>
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-sm text-zinc-300">{view.project_brief}</p>
            <p className="mb-2 mt-5 text-sm text-zinc-500">Update status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS).map(([k, l]) => (
                <button key={k} onClick={() => setStatus(view.id, k)} aria-pressed={view.status === k} className={`rounded-full border px-4 py-1.5 text-sm ${view.status === k ? 'border-transparent bg-gradient-to-r from-blue-500 to-purple-600' : 'border-white/15 hover:bg-white/5'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" onClick={() => setForm(null)}>
          <form onSubmit={saveItem} role="dialog" aria-modal="true" aria-label="Portfolio item" className="card relative my-auto w-full max-w-lg space-y-3 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">{form.id ? 'Edit project' : 'Add project'}</h2>
            <label className="block text-sm">Title<input className="input mt-1" required value={form.title} onChange={set('title')} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Category<select className="input mt-1" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="block text-sm">Tag<input className="input mt-1" value={form.tag || ''} onChange={set('tag')} /></label>
            </div>
            <label className="block text-sm">Client name<input className="input mt-1" value={form.client_name || ''} onChange={set('client_name')} /></label>
            <label className="block text-sm">Image URL<input className="input mt-1" type="url" placeholder="https://..." value={form.image_url || ''} onChange={set('image_url')} /></label>
            <label className="block text-sm">Description<textarea className="input mt-1 min-h-24" value={form.description || ''} onChange={set('description')} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Featured (shown first)</label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary">Save project</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
