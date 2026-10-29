import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowRight, Bell, Building2, CalendarDays, Camera, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, Clock3, FileCheck2, FilePlus2, FileSpreadsheet, FileText, FolderOpen, Home, Info, MapPin, Plus, RotateCcw, Search, ShieldCheck, Sparkles, Truck, Upload, X } from 'lucide-react';
import { initialDocuments, moduleLabels, statusOptions, works, type DemoDocument, type Module } from './domain';
import { getAttachment, loadDocuments, resetDemo, saveAttachment, saveDocuments } from './storage';

type Page = 'home' | Module;
type Preview = { url: string; name: string; type: string };
const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', icon: Home }, { id: 'hse', label: 'Permisos HSE', icon: ShieldCheck },
  { id: 'vehicles', label: 'Vehículos', icon: Truck }, { id: 'quality', label: 'Calidad y firmas', icon: FileCheck2 },
];
const today = () => new Date().toLocaleDateString('sv-SE');
const readableDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : value;
const workName = (id: string) => works.find(w => w.id === id)?.name || 'Sin obra';
const moduleIcon = (module: Module) => module === 'hse' ? ShieldCheck : module === 'vehicles' ? Truck : FileCheck2;
const pending = (d: DemoDocument) => !['Aprobado', 'Firmado', 'Enviado'].includes(d.status);
function badgeColor(status: string) {
  if (['Aprobado', 'Firmado', 'Enviado'].includes(status)) return 'green';
  if (status === 'Borrador') return 'gray';
  if (status === 'Listo para enviar') return 'blue';
  return 'amber';
}
function Badge({ status }: { status: string }) { return <span className={`badge ${badgeColor(status)}`}>{status}</span>; }

function PlantArt() {
  return <svg viewBox="0 0 590 250" role="img" aria-label="Ilustración de una instalación industrial" className="hero-art">
    <defs><linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b5d8dc" /><stop offset=".45" stopColor="#467a88" /><stop offset=".8" stopColor="#173b4d" /><stop offset="1" stopColor="#7eafba" /></linearGradient><linearGradient id="glass"><stop stopColor="#1d5a69" /><stop offset="1" stopColor="#34727a" /></linearGradient></defs>
    <path d="M30 219H580M0 238H590" stroke="#69929c" strokeOpacity=".35" />
    <g fill="none" stroke="#6ca5ae" strokeWidth="2" opacity=".5"><path d="M74 209V82h98v127M110 83v126M74 115h98M74 148h98M74 181h98M225 210V66h146v144M225 105h146M225 147h146M225 185h146M261 66v144M333 66v144" /><path d="m225 66 36 39 36-39 36 39 38-39M225 105l36 42 36-42 36 42 38-42" /></g>
    <g fill="url(#glass)" stroke="#75b3ba" strokeWidth="1.5"><path d="M387 208V99c0-24 86-24 86 0v109Z"/><ellipse cx="430" cy="99" rx="43" ry="14"/><rect x="490" y="139" width="58" height="69" rx="6"/></g>
    <g fill="none" stroke="url(#pipe)" strokeWidth="22" strokeLinejoin="round"><path d="M22 202h240c29 0 29-22 29-45V43c0-19 14-23 31-23h95c25 0 25 16 25 35v26"/><path d="M42 232h440c28 0 28-20 28-39v-34"/></g>
    <g stroke="#a9cdd1" strokeWidth="3" opacity=".7"><path d="M179 190v24m9-24v24M278 105h25m-25 8h25M357 9v23m9-23v23M383 220v24m9-24v24"/></g>
    <g fill="#12bd9c" stroke="#9ce6d3" strokeWidth="2"><circle cx="291" cy="144" r="9"/><circle cx="442" cy="59" r="7"/><circle cx="510" cy="186" r="8"/></g>
    <g stroke="#b0d1d5" fill="none" strokeWidth="2"><path d="M291 133v-22m-15 0h30M510 177v-16m-12 0h24M399 118v65m-8-48h18m-18 18h18m-18 18h18"/></g>
    <circle cx="108" cy="52" r="4" fill="#16c5a5"/><path d="M106 52h83" stroke="#16c5a5" strokeDasharray="3 6" opacity=".5"/>
  </svg>;
}

function Modal({ title, children, footer, onClose, wide = false }: { title: string; children: ReactNode; footer?: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !ref.current) return;
      const nodes = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', handle); returnFocus.current?.focus(); };
  }, []);
  return <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`modal ${wide ? 'modal-wide' : ''}`}><header className="modal-header"><h2 className="modal-title">{title}</h2><button className="modal-close icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header><div className="modal-body">{children}</div>{footer && <footer className="modal-footer">{footer}</footer>}</div></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [documents, setDocuments] = useState<DemoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [selectedWork, setSelectedWork] = useState('w-campo');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [showNew, setShowNew] = useState<Module | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState('Microtrack');
  const [formFile, setFormFile] = useState<File | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', workId: 'w-campo', period: today(), owner: 'Alexis', notes: '', vehicle: '' });
  const selectedDoc = documents.find(d => d.id === selectedId);
  const currentWork = works.find(w => w.id === selectedWork);

  useEffect(() => { loadDocuments().then(setDocuments).catch(() => { setDocuments(initialDocuments); setStorageError(true); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 6000); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    let alive = true;
    let url: string | undefined;
    setPreview(null);
    if (selectedDoc?.attachmentId) getAttachment(selectedDoc.attachmentId).then(file => {
      if (!alive || !file) return;
      url = URL.createObjectURL(file.blob);
      setPreview({ url, name: file.name, type: file.type });
    }).catch(() => setToast('No se pudo abrir el adjunto. Podés volver a intentarlo.'));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [selectedDoc?.attachmentId]);

  const scopedDocs = useMemo(() => documents.filter(d => selectedWork === 'all' || d.workId === selectedWork), [documents, selectedWork]);
  const filteredDocs = useMemo(() => scopedDocs.filter(d => (page === 'home' || d.module === page) && (statusFilter === 'all' || d.status === statusFilter) && `${d.title} ${d.owner} ${d.vehicle || ''} ${d.period} ${d.provider || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [scopedDocs, page, statusFilter, search]);
  const pendingDocs = scopedDocs.filter(pending);
  const qualityDocs = scopedDocs.filter(d => d.module === 'quality');
  const completedQuality = qualityDocs.filter(d => ['Firmado', 'Enviado'].includes(d.status)).length;
  const completePercent = qualityDocs.length ? Math.round(completedQuality / qualityDocs.length * 100) : 0;
  const hseCount = scopedDocs.filter(d => d.module === 'hse' && pending(d)).length;
  const gpsCount = scopedDocs.filter(d => d.module === 'vehicles' && d.status !== 'Enviado').length;
  const qualityPending = qualityDocs.filter(pending).length;

  function navigate(next: Page) { setPage(next); setStatusFilter('all'); setSearch(''); window.scrollTo({ top: 0, behavior: 'instant' }); }
  async function persist(next: DemoDocument[]) { if (storageError) throw new Error('El navegador no permite guardar datos. Abrí la demo en una ventana normal con almacenamiento habilitado.'); await saveDocuments(next); setDocuments(next); }
  async function action(callback: () => Promise<void>) { setBusy(true); try { await callback(); } catch (error) { setToast(error instanceof Error ? error.message : 'No se pudo completar la acción. Intentá nuevamente.'); } finally { setBusy(false); } }
  function openNew(module: Module) { setForm({ title: '', workId: selectedWork === 'all' ? 'w-campo' : selectedWork, period: today(), owner: 'Alexis', notes: '', vehicle: '' }); setFormFile(null); setShowNew(module); }
  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!showNew || !form.title.trim() || !form.owner.trim()) return;
    await action(async () => {
      const attachmentId = formFile ? await saveAttachment(formFile) : undefined;
      const doc: DemoDocument = { id: crypto.randomUUID(), title: form.title.trim(), module: showNew, workId: form.workId, period: form.period, status: showNew === 'vehicles' ? 'Pendiente de revisión' : 'Borrador', owner: form.owner.trim(), updatedAt: today(), notes: form.notes.trim(), attachmentId, ...(showNew === 'vehicles' ? { vehicle: form.vehicle.trim().toUpperCase(), provider } : {}), ...(showNew === 'quality' ? { signatureInternal: false, signatureExternal: false } : {}) };
      await persist([doc, ...documents]); setShowNew(null); setSelectedId(doc.id); setToast('Documento guardado en este navegador.');
    });
  }
  async function updateSelected(patch: Partial<DemoDocument>) { if (!selectedDoc) return; await action(async () => { await persist(documents.map(d => d.id === selectedDoc.id ? { ...d, ...patch, updatedAt: today() } : d)); setToast('Cambios guardados.'); }); }
  async function importGps(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    await action(async () => {
      const { importGpsFile } = await import('./files');
      const imported = await importGpsFile(file, selectedWork === 'all' ? 'w-campo' : selectedWork);
      const attachmentId = await saveAttachment(file);
      const next = imported.map(d => ({ ...d, provider, attachmentId }));
      await persist([...next, ...documents]); setToast(`${next.length} reporte${next.length === 1 ? '' : 's'} organizado${next.length === 1 ? '' : 's'} por vehículo y período.`);
    });
  }
  async function download(doc: DemoDocument) { await action(async () => { const { downloadDocument } = await import('./files'); await downloadDocument(doc, workName(doc.workId)); setToast(doc.attachmentId ? 'Descarga del archivo original preparada.' : 'Resumen PDF de demostración preparado.'); }); }
  async function attachToSelected(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || !selectedDoc) return; await action(async () => { const attachmentId = await saveAttachment(file); await persist(documents.map(d => d.id === selectedDoc.id ? { ...d, attachmentId, updatedAt: today() } : d)); setToast('Adjunto guardado en este navegador.'); }); }
  const docRow = (doc: DemoDocument) => { const Icon = moduleIcon(doc.module); return <button type="button" className="document-row" key={doc.id} onClick={() => setSelectedId(doc.id)}><span className={`document-icon ${doc.module}`}><Icon size={20} /></span><span className="document-main"><span className="document-title">{doc.title}</span><span className="document-meta">{moduleLabels[doc.module]} <span>·</span> {doc.owner} <span>·</span> {readableDate(doc.updatedAt)}</span></span><span className="document-trailing"><Badge status={doc.status} /><ChevronRight size={16} /></span></button>; };

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#inicio" className="brand" onClick={e => { e.preventDefault(); navigate('home'); }}><span className="brand-icon"><ShieldCheck size={25} /></span><span><strong className="brand-name">METALFAST<span> Campo</span></strong><span className="brand-subtitle">DOCUMENTACIÓN DE OBRA</span></span></a>
      <div className="workspace-card"><span className="workspace-avatar">M</span><div className="workspace-text"><strong>Metalfast Oil Services</strong><span>Espacio de demostración</span></div><ChevronDown size={14} /></div>
      <div className="nav-label">TU ESPACIO DE TRABAJO</div>
      <nav className="nav-list" aria-label="Navegación principal">{navItems.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon className="nav-icon" size={19} /><span>{item.label}</span>{item.id !== 'home' && <span className="nav-count">{scopedDocs.filter(d => d.module === item.id).length}</span>}</button>)}</nav>
      <div className="sidebar-note"><span className="chip"><Sparkles size={12} /> HECHA PARA EL CAMPO</span><strong>La información que necesitás. A mano.</strong><p>Permisos, reportes y calidad en la carpeta de cada obra.</p><button className="text-button" onClick={() => setShowGuide(true)}>Recorrer la demo <ArrowRight size={15} /></button></div>
      <div className="sidebar-footer"><button className="nav-item" onClick={() => setShowGuide(true)}><CircleHelp size={18} />Guía de la demo</button><button className="nav-item" onClick={() => setShowReset(true)}><RotateCcw size={18} />Restablecer datos</button><span className="footer-note">METALFAST Campo · Demo v0.1</span></div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="breadcrumbs"><Building2 size={16} /><span>Metalfast</span><ChevronRight size={13} /><strong>{navItems.find(n => n.id === page)?.label}</strong></div><div className="mobile-brand"><ShieldCheck size={21} /><strong>METALFAST<span> Campo</span></strong></div><div className="topbar-actions"><span className="chip"><span style={{ width: 6, height: 6, borderRadius: 6, background: '#0ca892' }} /> Datos de ejemplo</span><button className="icon-button" aria-label="Ver pendientes" onClick={() => { navigate('home'); document.getElementById('prioridades')?.scrollIntoView({ behavior: 'smooth' }); }}><Bell size={20} /></button><span className="profile-avatar" aria-label="Perfil de demostración de Alexis">A</span></div></header>
      <main className="content">
        <div className="page-heading"><div><div className="eyebrow">{page === 'home' ? 'DOCUMENTACIÓN EN CAMPO' : 'CARPETA DE OBRA'}</div><h1 className="page-title">{page === 'home' ? 'Hola, Alexis' : moduleLabels[page]}{page === 'home' && <span style={{ color: '#0ca892' }}>.</span>}</h1><p className="page-subtitle">{page === 'home' ? 'Todo lo importante de tu obra, en un solo lugar.' : page === 'hse' ? 'Prepará tus permisos y acompañá cada revisión.' : page === 'vehicles' ? 'Encontrá cada reporte por vehículo, proveedor y período.' : 'Documentos ordenados, versiones a mano y firmas bajo seguimiento.'}</p></div><div className="heading-actions"><label className="work-select"><MapPin size={16} /><select aria-label="Seleccionar obra" value={selectedWork} onChange={e => setSelectedWork(e.target.value)}>{works.map(w => <option key={w.id} value={w.id}>{w.name}{w.id !== 'w-campo' ? ' (archivo)' : ''}</option>)}<option value="all">Todas las obras</option></select></label>{page !== 'home' && <button className="button primary" onClick={() => openNew(page)}><Plus size={17} />{page === 'hse' ? 'Nuevo permiso' : page === 'quality' ? 'Nuevo documento' : 'Nuevo reporte'}</button>}</div></div>

        {storageError && <div className="warning-banner"><Info size={18} /> El almacenamiento no está disponible. Los ejemplos se pueden consultar, pero no guardar cambios en este navegador.</div>}
        {loading ? <div className="loading-state"><span className="spinner" />Preparando tu espacio de trabajo…</div> : page === 'home' ? <>
          <section className="hero"><div className="hero-content"><div className="hero-kicker"><span style={{ width: 6, height: 6, borderRadius: 6, background: '#5bdfbd' }} /> TU CARPETA DE OBRA, CONECTADA</div><h2 className="hero-title">Cada documento.<br />En su lugar.</h2><p className="hero-description">Menos tiempo buscando. Más claridad para preparar, revisar y compartir la documentación.</p><div className="hero-actions"><button className="button primary" onClick={() => navigate('quality')}><FolderOpen size={17} /> Abrir carpeta de calidad <ArrowRight size={16} /></button><span className="hero-pill"><MapPin size={13} />{currentWork?.location || 'Todas las obras'}</span></div></div><PlantArt /></section>
          <div className="stats-grid">
            {[{ module: 'hse' as Module, count: hseCount, title: 'Permisos por resolver', detail: 'Borradores y revisiones', icon: ShieldCheck, color: 'teal' }, { module: 'vehicles' as Module, count: gpsCount, title: 'Reportes por preparar', detail: 'Vehículos y períodos', icon: Truck, color: 'blue' }, { module: 'quality' as Module, count: qualityPending, title: 'Documentos pendientes', detail: 'Revisión y firmas de calidad', icon: FileCheck2, color: 'amber' }].map(stat => <button className="stat-card" key={stat.module} onClick={() => navigate(stat.module)}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span className={`stat-icon ${stat.color}`}><stat.icon size={20} /></span><ArrowRight size={15} style={{ color: '#8ba1ac' }} /></div><div className="stat-value">{String(stat.count).padStart(2, '0')}</div><div className="stat-label">{stat.title}</div><div className="stat-bottom">{stat.detail}</div></button>)}
          </div>
          <div className="dashboard-grid"><section className="section-card"><div className="section-header"><div><h2 className="section-title">Tu documentación reciente</h2><p className="section-caption">La versión que necesitás, sin vueltas.</p></div><span className="chip">{scopedDocs.length} documentos</span></div><div className="toolbar"><div className="search-box"><Search size={17} /><input aria-label="Buscar documentos" className="search-input" placeholder="Buscar por título, vehículo o período…" value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="icon-button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={15} /></button>}</div></div><div className="document-list">{filteredDocs.length ? filteredDocs.slice(0, 6).map(docRow) : <div className="empty-state"><Search size={28} /><strong>No encontramos documentos</strong><span>Probá otro título o seleccioná otra obra.</span></div>}</div><div style={{ padding: '14px 22px', borderTop: '1px solid #edf1f4' }}><button className="text-button" onClick={() => navigate('quality')}>Ver carpeta de calidad <ArrowRight size={15} /></button></div></section>
          <div><section className="section-card" id="prioridades"><div className="section-header"><div><h2 className="section-title">Requiere tu atención</h2><p className="section-caption">Un siguiente paso para cada pendiente.</p></div><span className="badge amber">{pendingDocs.length}</span></div>{pendingDocs.slice(0, 3).map(doc => <button className="priority-card" key={doc.id} onClick={() => setSelectedId(doc.id)}><span className="priority-icon"><Clock3 size={18} /></span><span className="priority-copy"><strong className="priority-title">{doc.title}</strong><span className="priority-description">{doc.status} · {doc.owner}</span></span><ChevronRight size={15} /></button>)}{!pendingDocs.length && <div className="empty-state"><CheckCheck size={26} /><strong>Sin pendientes en esta obra</strong><span>Los estados corresponden a la demo.</span></div>}</section><section className="section-card" style={{ marginTop: 18 }}><div className="section-header"><h2 className="section-title">Seguimiento de calidad</h2><FileCheck2 size={19} color="#0ca892" /></div><div style={{ padding: '0 22px 22px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}><span className="muted">Documentos con firmas completas</span><strong style={{ fontSize: 23 }}>{completedQuality}<span className="muted" style={{ fontSize: 15 }}> / {qualityDocs.length}</span></strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${completePercent}%` }} /></div><p className="section-caption" style={{ marginTop: 12 }}>Seguimiento de ejemplo. Firmas simuladas.</p></div></section></div></div>
          <section className="section-card" style={{ marginTop: 22 }}><div className="section-header"><div><h2 className="section-title">¿Qué necesitás hacer?</h2><p className="section-caption">Tres procesos, una misma carpeta de obra.</p></div></div><div className="quick-actions"><button className="quick-action" onClick={() => openNew('hse')}><span className="quick-icon"><ShieldCheck size={23} /></span><span><strong>Preparar un permiso</strong><span>Crear borrador HSE</span></span><ArrowRight size={17} /></button><button className="quick-action" onClick={() => { navigate('vehicles'); importInput.current?.click(); }}><span className="quick-icon"><FileSpreadsheet size={23} /></span><span><strong>Organizar un reporte GPS</strong><span>Importar Excel o CSV</span></span><ArrowRight size={17} /></button><button className="quick-action" onClick={() => openNew('quality')}><span className="quick-icon"><Camera size={23} /></span><span><strong>Digitalizar un documento</strong><span>Fotografiar o adjuntar</span></span><ArrowRight size={17} /></button></div></section>
        </> : <>
          <div className="info-banner"><Info size={18} /><span>{page === 'hse' ? 'Circuito de ejemplo: las revisiones y aprobaciones de esta demo no autorizan trabajos reales.' : page === 'vehicles' ? 'Importá la plantilla de ejemplo o un archivo con sus mismas columnas. La descarga desde los proveedores GPS se evaluará por separado.' : 'Encontrá originales y seguí las dos firmas. Los cambios de firma son una simulación para conversar sobre el proceso.'}</span></div>
          {page === 'vehicles' && <section className="section-card" style={{ marginBottom: 20 }}><div className="section-header"><div><h2 className="section-title">De la planilla a tu carpeta de obra</h2><p className="section-caption">Guardá el original y organizá los recorridos por patente y mes.</p></div><FileSpreadsheet size={27} color="#0ca892" /></div><div className="toolbar" style={{ flexWrap: 'wrap' }}><label className="field-label" htmlFor="provider">Proveedor de referencia</label><select id="provider" className="filter-select provider-select" value={provider} onChange={e => setProvider(e.target.value)}>{['Microtrack', 'RSV', 'Full Control', 'Otro proveedor'].map(p => <option key={p}>{p}</option>)}</select><button className="button secondary" disabled={busy} onClick={() => action(async () => { const { downloadGpsTemplate } = await import('./files'); await downloadGpsTemplate(); setToast('Plantilla Excel preparada. Contiene recorridos ficticios.'); })}><ArrowDownToLine size={16} />Plantilla de ejemplo</button><button className="button primary" disabled={busy} onClick={() => importInput.current?.click()}><Upload size={16} />Importar Excel / CSV</button></div><p className="footer-note" style={{ padding: '0 22px 18px' }}>Columnas: Patente · Fecha · Origen · Destino · Km. Los formatos propios de cada proveedor requieren adaptación.</p></section>}
          <section className="table-card"><div className="toolbar"><div className="search-box"><Search size={17} /><input className="search-input" aria-label="Buscar en documentos" placeholder="Buscar documento, responsable o período…" value={search} onChange={e => setSearch(e.target.value)} /></div><select className="filter-select" aria-label="Filtrar por estado" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Todos los estados</option>{statusOptions[page].map(s => <option key={s}>{s}</option>)}</select><span className="results-count">{filteredDocs.length} registro{filteredDocs.length === 1 ? '' : 's'}</span></div>
          {filteredDocs.length ? <><div className="table-wrap"><table className="data-table"><thead><tr><th>Documento</th><th>Período</th><th>{page === 'vehicles' ? 'Proveedor' : 'Responsable'}</th><th>Estado</th><th><span className="muted">Acciones</span></th></tr></thead><tbody>{filteredDocs.map(doc => { const Icon = moduleIcon(doc.module); return <tr key={doc.id}><td><button className="table-name" onClick={() => setSelectedId(doc.id)}><span className={`document-icon ${doc.module}`}><Icon size={19} /></span><span><strong>{doc.title}</strong><span className="table-subtitle">{workName(doc.workId)}{page === 'quality' ? ` · ${Number(!!doc.signatureInternal) + Number(!!doc.signatureExternal)}/2 firmas (demo)` : doc.vehicle ? ` · ${doc.vehicle}` : ''}</span></span></button></td><td>{doc.period}</td><td>{page === 'vehicles' ? doc.provider : doc.owner}</td><td><Badge status={doc.status} /></td><td><div className="row-actions"><button className="icon-button" title="Abrir documento" aria-label={`Abrir ${doc.title}`} onClick={() => setSelectedId(doc.id)}><FolderOpen size={18} /></button><button className="icon-button" disabled={busy} title="Descargar original o resumen" aria-label={`Descargar ${doc.title}`} onClick={() => download(doc)}><ArrowDownToLine size={18} /></button></div></td></tr>; })}</tbody></table></div><div className="mobile-cards">{filteredDocs.map(doc => <button className="mobile-document-card" key={doc.id} onClick={() => setSelectedId(doc.id)}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span className={`document-icon ${doc.module}`}>{page === 'hse' ? <ShieldCheck size={20} /> : page === 'vehicles' ? <Truck size={20} /> : <FileCheck2 size={20} />}</span><Badge status={doc.status} /></div><strong>{doc.title}</strong><span className="document-meta">{doc.period} · {doc.owner}</span><span className="table-subtitle">{workName(doc.workId)} <ChevronRight size={14} /></span></button>)}</div></> : <div className="empty-state"><FolderOpen size={33} /><strong>{search || statusFilter !== 'all' ? 'Sin resultados para estos filtros' : 'Esta carpeta está lista para empezar'}</strong><span>Creá un documento o elegí otra obra.</span><button className="button secondary" onClick={() => openNew(page)}><Plus size={16} />Crear documento</button></div>}</section>
        </>}
        <div className="demo-notice"><ShieldCheck size={15} /><span>Demo con datos simulados · Guardado local en este navegador · Sin conexión con proveedores ni envíos externos.</span><button className="text-button" onClick={() => setShowGuide(true)}>Cómo funciona <ArrowRight size={14} /></button></div>
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Navegación móvil">{navItems.map(item => <button key={item.id} className={`bottom-nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={21} /><span>{item.id === 'hse' ? 'HSE' : item.id === 'quality' ? 'Calidad' : item.label}</span></button>)}</nav>
    <input ref={importInput} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={importGps} aria-label="Importar archivo GPS" />
    {toast && <div className="toast" role="status"><Info size={18} /><span>{toast}</span><button className="icon-button" aria-label="Cerrar aviso" onClick={() => setToast('')}><X size={16} /></button></div>}
    {busy && <div className="loading-state" role="status" style={{ position: 'fixed', bottom: 88, right: 24, zIndex: 80, padding: '12px 18px', background: 'white', boxShadow: '0 4px 24px #17394b22', borderRadius: 14 }}><span className="spinner" />Procesando…</div>}

    {showNew && <Modal title={showNew === 'hse' ? 'Nuevo permiso HSE' : showNew === 'quality' ? 'Nuevo documento de calidad' : 'Nuevo reporte de vehículo'} onClose={() => { if (!busy) setShowNew(null); }} footer={<><button className="button secondary" disabled={busy} onClick={() => setShowNew(null)}>Cancelar</button><button className="button primary" type="submit" form="new-document" disabled={busy}><Check size={17} />Guardar borrador</button></>}><form id="new-document" onSubmit={submitDocument} className="form-grid"><label className="field full"><span className="field-label">Nombre del documento *</span><input className="input" required maxLength={130} autoComplete="off" placeholder={showNew === 'hse' ? 'Ej. Permiso de trabajo en caliente' : showNew === 'quality' ? 'Ej. Control de calidad — semana 44' : 'Ej. Recorridos de octubre'} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label className="field"><span className="field-label">Obra *</span><select className="input" required value={form.workId} onChange={e => setForm({ ...form, workId: e.target.value })}>{works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label className="field"><span className="field-label">Responsable *</span><input className="input" required maxLength={80} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></label><label className="field"><span className="field-label">Fecha o período *</span><input className="input" required maxLength={40} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="Ej. 2026-10 o semana 44" /></label>{showNew === 'vehicles' && <label className="field"><span className="field-label">Patente *</span><input className="input" required maxLength={20} value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} placeholder="AB 123 CD" /></label>}<label className="field full"><span className="field-label">Notas y observaciones</span><textarea className="textarea" rows={3} maxLength={2000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Qué incluye, qué falta o qué debe revisar el responsable…" /></label><label className="file-drop field full"><Camera size={25} /><strong>{formFile ? formFile.name : 'Fotografiar o adjuntar documento'}</strong><span>PDF o imagen · Hasta 15 MB · Archivo de ejemplo</span><input type="file" accept="image/*,application/pdf" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 15 * 1024 * 1024) { setToast('Elegí un archivo de hasta 15 MB.'); e.target.value = ''; return; } setFormFile(f || null); }} /></label><div className="info-banner" style={{ gridColumn: '1 / -1' }}><Info size={17} />Los datos se guardan solo en este navegador. Usá archivos de ejemplo sin información sensible.</div></form></Modal>}

    {selectedDoc && <Modal wide title="Detalle del documento" onClose={() => { if (!busy) setSelectedId(null); }} footer={<><button className="button secondary" disabled={busy} onClick={() => setSelectedId(null)}>Cerrar</button><button className="button primary" disabled={busy} onClick={() => download(selectedDoc)}><ArrowDownToLine size={17} />{selectedDoc.attachmentId ? 'Descargar original' : 'Descargar resumen PDF'}</button></>}><div className="detail-summary"><span className={`document-icon ${selectedDoc.module}`}>{selectedDoc.module === 'hse' ? <ShieldCheck size={25} /> : selectedDoc.module === 'vehicles' ? <Truck size={25} /> : <FileCheck2 size={25} />}</span><div><div className="eyebrow">{moduleLabels[selectedDoc.module]}</div><h3 style={{ margin: '6px 0 10px', fontSize: 22 }}>{selectedDoc.title}</h3><Badge status={selectedDoc.status} /></div></div><div className="detail-grid"><div className="detail-item"><span className="detail-label">Obra</span><strong className="detail-value">{workName(selectedDoc.workId)}</strong></div><div className="detail-item"><span className="detail-label">Período</span><strong className="detail-value">{selectedDoc.period}</strong></div><div className="detail-item"><span className="detail-label">Responsable</span><strong className="detail-value">{selectedDoc.owner}</strong></div><div className="detail-item"><span className="detail-label">Último registro</span><strong className="detail-value">{readableDate(selectedDoc.updatedAt)}</strong></div>{selectedDoc.vehicle && <div className="detail-item"><span className="detail-label">Vehículo</span><strong className="detail-value">{selectedDoc.vehicle}</strong></div>}{selectedDoc.provider && <div className="detail-item"><span className="detail-label">Proveedor de referencia</span><strong className="detail-value">{selectedDoc.provider}</strong></div>}</div>
      {selectedDoc.notes && <div className="info-banner" style={{ whiteSpace: 'pre-line', alignItems: 'flex-start' }}><FileText size={18} /><span>{selectedDoc.notes}</span></div>}
      <label className="field" style={{ margin: '20px 0' }}><span className="field-label">Estado del proceso · simulación</span><select className="input" disabled={busy} value={selectedDoc.status} onChange={e => {
        const status = e.target.value;
        if (selectedDoc.module === 'quality' && ['Firmado', 'Enviado'].includes(status) && (!selectedDoc.signatureInternal || !selectedDoc.signatureExternal)) { setToast('Completá las dos firmas de demostración antes de marcarlo como firmado o enviado.'); return; }
        updateSelected({ status });
      }}>{statusOptions[selectedDoc.module].map(s => <option key={s}>{s}</option>)}</select></label>
      {selectedDoc.module === 'quality' && <><h3 className="section-title" style={{ marginBottom: 12 }}>Seguimiento de las dos firmas</h3><div className="signature-grid">{([{ key: 'signatureInternal' as const, title: 'Revisión interna', label: 'Metalfast · responsable de ejemplo' }, { key: 'signatureExternal' as const, title: 'Contraparte de obra', label: 'Firmante externo por confirmar' }]).map(signature => <div className={`signature-card ${selectedDoc[signature.key] ? 'signed' : ''}`} key={signature.key}><span className="signature-icon">{selectedDoc[signature.key] ? <CheckCheck size={24} /> : <Clock3 size={24} />}</span><strong>{signature.title}</strong><span className="signature-state">{signature.label}</span><button className="button secondary small signature-button" disabled={busy} onClick={() => {
        const next = !selectedDoc[signature.key]; const other = signature.key === 'signatureInternal' ? selectedDoc.signatureExternal : selectedDoc.signatureInternal;
        updateSelected({ [signature.key]: next, status: next && other ? 'Firmado' : 'Pendiente de firma' });
      }}>{selectedDoc[signature.key] ? 'Quitar marca de demo' : 'Marcar firma simulada'}</button></div>)}</div><p className="footer-note" style={{ margin: '12px 0 20px' }}>Estas marcas solo muestran el recorrido. No generan firmas electrónicas ni envían documentos a la contraparte.</p></>}
      {preview ? <div className="attachment-preview"><div className="section-header"><strong>{preview.name}</strong><span className="chip">Archivo local</span></div>{preview.type.startsWith('image/') ? <img src={preview.url} alt={`Adjunto: ${preview.name}`} className="image-preview" /> : preview.type === 'application/pdf' ? <iframe src={preview.url} title={preview.name} className="pdf-preview" /> : <div className="empty-state"><FileSpreadsheet size={30} /><strong>Archivo original disponible</strong><span>Usá “Descargar original” para abrirlo en tu aplicación.</span></div>}</div> : <div className="empty-state" style={{ minHeight: 110, border: '1px dashed #d8e3e8', borderRadius: 12 }}><FileText size={25} /><strong>Registro de demostración</strong><span>Podés descargar su resumen PDF o adjuntar un archivo de ejemplo.</span></div>}
      <label className="file-drop" style={{ marginTop: 18 }}><Upload size={22} /><strong>{preview ? 'Reemplazar adjunto de ejemplo' : 'Agregar archivo o foto'}</strong><span>PDF o imagen · Hasta 15 MB</span><input type="file" disabled={busy} accept="image/*,application/pdf" capture="environment" onChange={e => { if (e.target.files?.[0] && e.target.files[0].size > 15 * 1024 * 1024) { setToast('Elegí un archivo de hasta 15 MB.'); e.target.value = ''; return; } attachToSelected(e); }} /></label>
    </Modal>}

    {showGuide && <Modal title="Tres recorridos para descubrir la demo" onClose={() => setShowGuide(false)} footer={<button className="button primary" onClick={() => setShowGuide(false)}>Empezar a recorrer <ArrowRight size={17} /></button>}><div className="guide-grid">{[{ title: 'Encontrar y digitalizar calidad', text: 'Abrí Calidad, buscá un documento y revisá sus dos firmas simuladas. También podés crear uno y adjuntar una foto desde el celular.' }, { title: 'Organizar reportes de vehículos', text: 'Descargá la plantilla Excel, completá sus filas e importala. Los recorridos se organizan por patente y mes, conservando el archivo original.' }, { title: 'Preparar un permiso HSE', text: 'Creá un permiso de ejemplo, asignale una obra y seguí su revisión. El encargado HSE deberá definir el proceso real.' }].map((step, index) => <div className="guide-step" key={step.title}><span className="guide-number">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="info-banner"><Info size={18} /><span>Solo se guardan datos en este navegador. Las firmas, aprobaciones y envíos son de demostración. No hay acceso a portales GPS ni comunicación con terceros.</span></div></Modal>}
    {showReset && <Modal title="Restablecer esta demo" onClose={() => setShowReset(false)} footer={<><button className="button secondary" disabled={busy} onClick={() => setShowReset(false)}>Conservar mis cambios</button><button className="button danger" disabled={busy} onClick={() => action(async () => { const docs = await resetDemo(); setDocuments(docs); setSelectedId(null); setShowReset(false); setToast('Demo restablecida con sus datos de ejemplo.'); })}><RotateCcw size={16} />Restablecer demo</button></>}><p>Se borrarán los documentos y adjuntos que agregaste en este navegador y volverán los ejemplos iniciales.</p><p className="muted">Esta acción solo afecta a tu copia local de la demo.</p></Modal>}
  </div>;
}
