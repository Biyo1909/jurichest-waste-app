import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, Loader2, LockKeyhole, Mail, MapPin, Menu, MessageCircle, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { COMPANY, loginAdmin, loginCustomer, useSession } from "@/lib/store";
import { Field, Modal } from "@/components/shared";

export type Navigate = (path: string) => void;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark"><Leaf size={21} strokeWidth={2.2} /></span>
      <span className="brand-type"><strong>JURICHEST</strong><span>NIG. LTD</span></span>
    </span>
  );
}

const NAV = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/about", label: "About" },
  { path: "/areas", label: "Service areas" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "Contact" },
];

export function SiteHeader({ path, navigate, onLogin }: { path: string; navigate: Navigate; onLogin: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const session = useSession();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  function go(event: MouseEvent, target: string) {
    event.preventDefault();
    navigate(target);
  }
  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="utility-bar"><div className="container utility-inner"><span><ShieldCheck size={14} /> LAWMA Registered Private Sector Participant</span><a href={`tel:${COMPANY.phones[0]}`}><Phone size={13} /> {COMPANY.phones[0]}</a></div></div>
      <div className="container header-inner">
        <a href="/" onClick={(event) => go(event, "/")} aria-label="JURICHEST home"><Logo /></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {NAV.map((item) => <a key={item.path} href={item.path} className={path === item.path ? "active" : ""} onClick={(event) => go(event, item.path)}>{item.label}</a>)}
        </nav>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm header-login" onClick={session ? () => navigate(session.role === "admin" ? "/admin" : "/portal") : onLogin}>
            {session ? <><UserRound size={16} />{session.role === "admin" ? "Admin workspace" : "My portal"}</> : <><LockKeyhole size={15} /> Login</>}
          </button>
          <button className="btn btn-outline btn-icon menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && <div className="mobile-nav"><nav aria-label="Mobile navigation">{NAV.map((item) => <a key={item.path} href={item.path} className={path === item.path ? "active" : ""} onClick={(event) => go(event, item.path)}>{item.label}<ArrowRight size={16} /></a>)}</nav><a className="mobile-nav-call" href={`tel:${COMPANY.phones[0]}`}><Phone size={16} /> Call {COMPANY.phones[0]}</a></div>}
    </header>
  );
}

export function LoginModal({ open, onOpenChange, navigate }: { open: boolean; onOpenChange: (open: boolean) => void; navigate: Navigate }) {
  const [mode, setMode] = useState<"choose" | "customer" | "admin">("choose");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) { setMode("choose"); setError(""); setBusy(false); setShowPassword(false); }
  }, [open]);
  function submitCustomer(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!identifier.trim() || !password) { setError("Enter an email/account code and any password to continue in demo mode."); return; }
    setBusy(true);
    window.setTimeout(() => {
      const session = loginCustomer(identifier, password);
      setBusy(false);
      if (session) { onOpenChange(false); navigate("/portal"); }
      else setError("We could not open that demo account. Try again.");
    }, 450);
  }
  function submitAdmin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    window.setTimeout(() => {
      const ok = loginAdmin(username, adminPassword);
      setBusy(false);
      if (ok) { onOpenChange(false); navigate("/admin"); }
      else setError("Invalid admin credentials. Use admin / jurichest2026 for this demo.");
    }, 450);
  }
  const title = mode === "choose" ? "Welcome to JURICHEST" : mode === "customer" ? "Customer login" : "Admin login";
  const description = mode === "choose" ? "Choose how you want to sign in." : mode === "customer" ? "Demo mode: any email or account code with any password works." : "Restricted demo workspace for JURICHEST staff.";
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      {mode === "choose" && <div className="login-choices">
        <button className="login-choice" onClick={() => setMode("customer")}><span className="login-choice-icon"><UserRound size={24} /></span><span><strong>Login as Customer</strong><small>Track collections, invoices and payments</small></span><ArrowRight size={19} /></button>
        <button className="login-choice" onClick={() => setMode("admin")}><span className="login-choice-icon admin"><ShieldCheck size={24} /></span><span><strong>Login as Admin</strong><small>Manage customers, receipts and schedules</small></span><ArrowRight size={19} /></button>
        <p className="login-demo-note">This is a local product demo. Records stay in this browser; no real payments are processed.</p>
      </div>}
      {mode === "customer" && <form onSubmit={submitCustomer} className="login-form">
        <Field label="Email or customer account code" htmlFor="customer-identifier"><input id="customer-identifier" className="input" autoComplete="username" placeholder="you@example.com or JRC-KUS-024" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></Field>
        <Field label="Password" htmlFor="customer-password"><span className="password-wrap"><input id="customer-password" className="input" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Any password in demo mode" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}Open my dashboard</button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => { setIdentifier("demo@jurichest.ng"); setPassword("demo123"); }}>Use the sample resident account</button>
        <button type="button" className="login-back" onClick={() => setMode("choose")}>Back to login options</button>
      </form>}
      {mode === "admin" && <form onSubmit={submitAdmin} className="login-form">
        <Field label="Username" htmlFor="admin-username"><input id="admin-username" className="input" autoComplete="username" placeholder="admin" value={username} onChange={(event) => setUsername(event.target.value)} /></Field>
        <Field label="Password" htmlFor="admin-password"><span className="password-wrap"><input id="admin-password" className="input" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter admin password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></Field>
        <p className="form-note">Demo credentials: <b>admin</b> / <b>jurichest2026</b></p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}Open admin workspace</button>
        <button type="button" className="login-back" onClick={() => setMode("choose")}>Back to login options</button>
      </form>}
    </Modal>
  );
}

export function WhatsAppFloat() {
  return (
    <a className="whatsapp-float" href={COMPANY.whatsapp} target="_blank" rel="noreferrer" aria-label="Chat with JURICHEST on WhatsApp">
      <svg viewBox="0 0 32 32" width="27" height="27" fill="currentColor" aria-hidden="true"><path d="M16.04 3.2c-7.1 0-12.86 5.76-12.86 12.86 0 2.27.6 4.48 1.73 6.43L3.1 28.8l6.48-1.7a12.8 12.8 0 0 0 6.46 1.74h.01c7.09 0 12.85-5.76 12.85-12.86S23.13 3.2 16.04 3.2Zm0 23.48h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.84 1 1.03-3.74-.25-.4a10.6 10.6 0 0 1-1.63-5.67c0-5.86 4.77-10.62 10.63-10.62 2.84 0 5.5 1.1 7.51 3.11a10.56 10.56 0 0 1 3.11 7.52c0 5.86-4.77 10.61-10.62 10.61Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.29-.1-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.55-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.64s1.13 3.06 1.29 3.27c.16.21 2.23 3.4 5.4 4.77.75.33 1.34.52 1.8.67.76.24 1.45.2 2 .12.61-.09 1.89-.77 2.15-1.52.26-.75.26-1.38.18-1.52-.08-.13-.29-.21-.61-.37Z"/></svg>
      <span className="whatsapp-tooltip">Chat with us</span>
    </a>
  );
}

export function SiteFooter({ navigate }: { navigate: Navigate }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand"><Logo light /><p>Reliable waste collection for selected streets and estates in Lekki, Lagos. Cleaner neighbourhoods, clearer communication.</p><span className="footer-badge"><ShieldCheck size={15} /> LAWMA Registered PSP · RC {COMPANY.rc}</span></div>
        <div><h3>Explore</h3>{NAV.map((item) => <a key={item.path} href={item.path} onClick={(event) => { event.preventDefault(); navigate(item.path); }}>{item.label}</a>)}</div>
        <div><h3>Services</h3><a href="/services" onClick={(event) => { event.preventDefault(); navigate("/services"); }}>Residential collection</a><a href="/services" onClick={(event) => { event.preventDefault(); navigate("/services"); }}>Commercial & estates</a><a href="/services" onClick={(event) => { event.preventDefault(); navigate("/services"); }}>Special collections</a><a href="/portal" onClick={(event) => { event.preventDefault(); navigate("/portal"); }}>Customer portal</a></div>
        <div className="footer-contact"><h3>Talk to us</h3><a href={`tel:${COMPANY.phones[0]}`}><Phone size={15} />{COMPANY.phones[0]}</a><a href={`tel:${COMPANY.phones[1]}`}><Phone size={15} />{COMPANY.phones[1]}</a><a href={`mailto:${COMPANY.email}`}><Mail size={15} />{COMPANY.email}</a><a href={COMPANY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a><span><MapPin size={15} />{COMPANY.address}</span></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} JURICHEST NIG. LTD. All rights reserved.</span><span>Local demo · no real payments or backend authentication</span></div>
    </footer>
  );
}

export function AccessGate({ kind, onLogin, navigate }: { kind: "customer" | "admin"; onLogin: () => void; navigate: Navigate }) {
  return (
    <main className="access-gate container page-enter">
      <span className="access-icon">{kind === "admin" ? <ShieldCheck size={30} /> : <UserRound size={30} />}</span>
      <h1>{kind === "admin" ? "Admin workspace" : "Your customer portal"}</h1>
      <p>{kind === "admin" ? "Sign in with the demo admin account to manage customers, receipts and collection schedules." : "Sign in to see your next collection, invoice, payment history and receipt status."}</p>
      <div className="access-actions"><button className="btn btn-primary" onClick={onLogin}><LockKeyhole size={17} />Login to continue</button><button className="btn btn-outline" onClick={() => navigate("/")}>Back to home</button></div>
    </main>
  );
}