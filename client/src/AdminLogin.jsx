import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

export default function AdminLogin() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: f });
      localStorage.setItem('ps_token', token);
      nav('/admin/dashboard');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,.25),transparent_60%)] p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">Admin <span className="grad-text">sign in</span></h1>
        <label className="block text-sm">Username
          <input className="input mt-1" autoComplete="username" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        </label>
        <label className="block text-sm">Password
          <input className="input mt-1" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </label>
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <a href="/" className="block text-center text-xs text-zinc-500 hover:text-zinc-300">Back to website</a>
      </form>
    </main>
  );
}
