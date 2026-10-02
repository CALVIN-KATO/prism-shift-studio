import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Mail, Phone, MapPin, Clock, MessageCircle, Quote } from 'lucide-react';
import { api, CATEGORIES, BUDGETS } from './api';

const WORDS = ['3D Graphics', 'Branding Assets', 'Visual Effects', 'Creative Direction'];

// NOTE: prices and testimonials are sample content - edit them to match the real business.
const PLANS = [
  { name: 'Brand Identity', price: 'From $450', features: ['Logo development', 'Visual guidelines', 'Colour palettes', 'Business cards & stationery'] },
  { name: '3D & Visual Assets', price: 'From $900', popular: true, features: ['3D graphics & renders', 'Print & packaging mockups', 'Social media content kit', 'Short motion intro'] },
  { name: 'Complete Agency Package', price: 'From $2,400', features: ['Full brand identity', 'Website & UI/UX design', 'Motion graphics & video', 'Dedicated creative direction'] },
];
const SERVICE_OPTIONS = [...PLANS.map((p) => p.name), 'Print & Packaging', 'Digital Design', 'Motion Graphics', 'Other'];

const REVIEWS = [
  { name: 'Amina N.', role: 'Bakery owner', text: 'They turned a rough idea into a brand we are proud of. Fast, clear and creative.' },
  { name: 'Daniel O.', role: 'Startup founder', text: 'The explainer video and website design lifted our launch. Communication was excellent.' },
  { name: 'Grace M.', role: 'Skincare brand', text: 'The 3D product renders looked better than a real photoshoot and cost far less.' },
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function Img({ src, alt, className }) {
  const [bad, setBad] = useState(!src);
  if (bad) return <div className={`${className} bg-gradient-to-br from-blue-600/40 via-indigo-600/30 to-purple-600/40`} />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`${className} object-cover`} />;
}

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} className="card relative my-auto w-full max-w-xl bg-zinc-900 p-6 sm:p-8" initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuoteForm({ service }) {
  const blank = { client_name: '', client_email: '', service_type: service || SERVICE_OPTIONS[0], budget_range: BUDGETS[1], project_brief: '', deadline: '' };
  const [f, setF] = useState(blank);
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  useEffect(() => { if (service) setF((p) => ({ ...p, service_type: service })); }, [service]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    setErr('');
    try {
      await api('/inquiries', { method: 'POST', body: f });
      setState('done');
      setF({ ...blank, service_type: f.service_type });
    } catch (x) {
      setErr(x.message);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="py-8 text-center" role="status">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={28} /></div>
        <h3 className="text-xl font-semibold">Quote request sent</h3>
        <p className="mt-2 text-sm text-zinc-400">Thanks! We will reply by email soon.</p>
        <button className="btn-ghost mt-6" onClick={() => setState('idle')}>Send another request</button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Name<input className="input mt-1" required value={f.client_name} onChange={set('client_name')} autoComplete="name" /></label>
      <label className="text-sm">Email<input className="input mt-1" type="email" required value={f.client_email} onChange={set('client_email')} autoComplete="email" /></label>
      <label className="text-sm">Service<select className="input mt-1" value={f.service_type} onChange={set('service_type')}>{SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="text-sm">Budget range<select className="input mt-1" value={f.budget_range} onChange={set('budget_range')}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></label>
      <label className="text-sm sm:col-span-2">Deadline<input className="input mt-1" type="date" value={f.deadline} onChange={set('deadline')} /></label>
      <label className="text-sm sm:col-span-2">Project brief<textarea className="input mt-1 min-h-28" required value={f.project_brief} onChange={set('project_brief')} placeholder="Tell us about your project, goals and style." /></label>
      {err && <p role="alert" className="text-sm text-red-400 sm:col-span-2">{err}</p>}
      <button className="btn-primary sm:col-span-2" disabled={state === 'sending'}>{state === 'sending' ? 'Sending...' : 'Request a quote'}</button>
    </form>
  );
}

export default function Landing() {
  const [wordIdx, setWordIdx] = useState(0);
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('All');
  const [project, setProject] = useState(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [service, setService] = useState('');
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { api('/portfolio').then(setItems).catch(() => setLoadErr('Could not load projects. Try refreshing.')); }, []);

  const shown = cat === 'All' ? items : items.filter((i) => i.category === cat);
  const selectPlan = (name) => { setService(name); scrollTo('quote'); };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="text-lg font-extrabold tracking-tight">prism <span className="grad-text">shift</span> studio</a>
          <div className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <button onClick={() => scrollTo('work')} className="hover:text-white">Work</button>
            <button onClick={() => scrollTo('services')} className="hover:text-white">Services</button>
            <button onClick={() => scrollTo('reviews')} className="hover:text-white">Reviews</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-white">Contact</button>
          </div>
          <button className="btn-primary !py-2" onClick={() => { setService(''); setQuoteOpen(true); }}>Request a Quote</button>
        </nav>
      </header>

      <section id="top" className="relative flex min-h-screen items-center justify-center px-4 pt-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.28),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,.28),transparent_45%)]" />
        <div className="relative max-w-4xl">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-sm text-zinc-400">Elevate your vision with shapeshifting creativity</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
            Shifting Visuals, <span className="grad-text">Elevating Brands</span>
          </motion.h1>
          <div className="mt-6 h-9 text-xl text-zinc-300 sm:text-2xl" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.span key={wordIdx} className="inline-block" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                {WORDS[wordIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">Branding, print, digital design and motion graphics from a creative studio at Nkozi campus, Uganda.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button className="btn-primary" onClick={() => { setService(''); setQuoteOpen(true); }}>Request a Quote</button>
            <button className="btn-ghost" onClick={() => scrollTo('work')}>Explore Work</button>
          </div>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">Selected <span className="grad-text">work</span></h2>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by category">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c ? 'border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{c}</button>
          ))}
        </div>
        {loadErr && <p className="mt-8 text-red-400">{loadErr}</p>}
        {!loadErr && shown.length === 0 && <p className="mt-8 text-zinc-500">No projects in this category yet.</p>}
        <motion.div layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {shown.map((p) => (
              <motion.button layout key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setProject(p)} className="card group overflow-hidden text-left transition hover:border-purple-500/50 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,.6)]">
                <Img src={p.image_url} alt={p.title} className="h-48 w-full transition duration-500 group-hover:scale-105" />
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-blue-300">{p.category}</span>
                    {p.tag && <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-purple-300">{p.tag}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                  {p.client_name && <p className="text-sm text-zinc-500">{p.client_name}</p>}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">Services &amp; <span className="grad-text">pricing</span></h2>
        <p className="mt-3 max-w-xl text-zinc-400">Logo and identity, print and packaging, website and app design, and motion graphics. Pick a package and we will pre-fill your quote.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`card flex flex-col p-7 ${p.popular ? 'border-purple-500/60 shadow-[0_0_50px_-15px_rgba(168,85,247,.7)]' : ''}`}>
              {p.popular && <span className="mb-3 w-fit rounded-full bg-purple-500/20 px-3 py-0.5 text-xs text-purple-300">Most popular</span>}
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p className="mt-2 text-3xl font-extrabold grad-text">{p.price}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-300">
                {p.features.map((x) => <li key={x} className="flex gap-2"><Check size={18} className="shrink-0 text-blue-400" />{x}</li>)}
              </ul>
              <button className={`${p.popular ? 'btn-primary' : 'btn-ghost'} mt-8`} onClick={() => selectPlan(p.name)}>Select Plan</button>
            </div>
          ))}
        </div>
      </section>

      <section id="quote" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-24">
        <div className="card p-6 sm:p-10">
          <h2 className="mb-6 text-3xl font-bold">Request a <span className="grad-text">quote</span></h2>
          <QuoteForm service={service} />
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="text-3xl font-bold sm:text-4xl">What clients <span className="grad-text">say</span></h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="card p-6">
              <Quote className="text-purple-400" size={24} />
              <blockquote className="mt-3 text-zinc-300">{r.text}</blockquote>
              <figcaption className="mt-4 text-sm"><span className="font-semibold">{r.name}</span> <span className="text-zinc-500">- {r.role}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          <div>
            <p className="text-lg font-extrabold">prism <span className="grad-text">shift</span> studio</p>
            <p className="mt-2 text-sm text-zinc-400">Elevate your vision with shapeshifting creativity.</p>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3"><MapPin size={18} className="shrink-0 text-blue-400" />Nkozi campus, Uganda</li>
            <li className="flex gap-3"><Phone size={18} className="shrink-0 text-blue-400" /><span><a className="hover:text-white" href="tel:+256702162541">+256 702 162 541</a> / <a className="hover:text-white" href="tel:+256788158626">+256 788 158 626</a></span></li>
            <li className="flex gap-3"><Mail size={18} className="shrink-0 text-blue-400" /><a className="hover:text-white" href="mailto:calvinkato13@gmail.com">calvinkato13@gmail.com</a></li>
            <li className="flex gap-3"><MessageCircle size={18} className="shrink-0 text-blue-400" /><a className="hover:text-white" href="https://wa.me/256702162541" target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>
          </ul>
          <div className="text-sm text-zinc-300">
            <p className="flex gap-3"><Clock size={18} className="shrink-0 text-blue-400" />Working hours (edit to match)</p>
            <p className="ml-9 mt-2 text-zinc-400">Mon - Fri: 8:00 - 18:00<br />Sat: 9:00 - 14:00<br />Sun: Closed</p>
          </div>
        </div>
        <p className="border-t border-white/5 py-5 text-center text-xs text-zinc-600">&copy; {new Date().getFullYear()} Prism Shift Studio. <a href="/admin/login" className="hover:text-zinc-400">Admin</a></p>
      </footer>

      <Modal open={!!project} onClose={() => setProject(null)} title={project?.title}>
        {project && (
          <>
            <Img src={project.image_url} alt={project.title} className="mb-5 h-64 w-full rounded-xl" />
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-blue-300">{project.category}</span>
              {project.tag && <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-purple-300">{project.tag}</span>}
            </div>
            <h3 className="mt-3 text-2xl font-bold">{project.title}</h3>
            {project.client_name && <p className="text-sm text-zinc-500">Client: {project.client_name}</p>}
            <p className="mt-4 text-zinc-300">{project.description}</p>
            <button className="btn-primary mt-6" onClick={() => { setProject(null); setService(''); setQuoteOpen(true); }}>Start a similar project</button>
          </>
        )}
      </Modal>
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Request a quote">
        <h2 className="mb-6 text-2xl font-bold">Request a <span className="grad-text">quote</span></h2>
        <QuoteForm service={service} />
      </Modal>
    </div>
  );
}
