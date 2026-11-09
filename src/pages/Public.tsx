import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Clock3, FileText, Home as HomeIcon, Leaf, MapPin, MessageCircle, PackageCheck, Phone, Recycle, ShieldCheck, Sparkles, Truck, Upload, Wallet } from "lucide-react";
import { COMPANY, SERVICE_AREAS, addRequest, type ServiceRequest } from "@/lib/store";
import { urlFor } from "@/lib/base";
import { CopyButton, Field, SectionHeading } from "@/components/shared";
import type { Navigate } from "@/components/site-shell";
import "@/styles/public.css";

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { node.classList.add("is-visible"); observer.disconnect(); }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="page-hero-glow" />
      <div className="container page-hero-inner">
        <span className="eyebrow eyebrow-light"><span />{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {children}
      </div>
    </section>
  );
}

function ServiceArt({ variant }: { variant: "recycling" | "estate" | "street" }) {
  if (variant === "recycling") return (
    <svg className="service-art" viewBox="0 0 520 360" role="img" aria-label="Illustration of sorted recycling bins and cardboard">
      <defs><linearGradient id="rec-bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eaf5df"/><stop offset="1" stopColor="#cfe8bd"/></linearGradient></defs>
      <rect width="520" height="360" rx="24" fill="url(#rec-bg)"/><circle cx="430" cy="70" r="46" fill="#f7fadf"/><path d="M0 285c120-36 280-36 520 0v75H0z" fill="#b7d6a4"/>
      <g><rect x="80" y="150" width="92" height="130" rx="12" fill="#124d32"/><rect x="72" y="136" width="108" height="24" rx="10" fill="#0c3b26"/><circle cx="100" cy="286" r="12" fill="#0b2e1f"/><circle cx="152" cy="286" r="12" fill="#0b2e1f"/><path d="M104 196h44l-8 14h-28zM112 220h28v26h-28z" fill="#c8f169"/></g>
      <g><rect x="210" y="130" width="100" height="150" rx="12" fill="#c8f169"/><rect x="202" y="114" width="116" height="26" rx="10" fill="#a5d63a"/><circle cx="232" cy="286" r="12" fill="#0b2e1f"/><circle cx="288" cy="286" r="12" fill="#0b2e1f"/><path d="M260 168l18 30h-36zM242 208h36v34h-36z" fill="#124d32"/></g>
      <g><rect x="348" y="160" width="88" height="120" rx="12" fill="#e9a23b"/><rect x="340" y="146" width="104" height="24" rx="10" fill="#c9821f"/><circle cx="368" cy="286" r="12" fill="#0b2e1f"/><circle cx="416" cy="286" r="12" fill="#0b2e1f"/><path d="M370 196h44v30h-44z" fill="#fff3d9"/></g>
      <path d="M166 92c34-30 94-30 128 0" stroke="#1a6a45" strokeWidth="8" strokeLinecap="round" strokeDasharray="18 14"/><path d="M292 82l14 12-18 6" fill="#1a6a45"/>
      <rect x="52" y="236" width="44" height="44" rx="5" fill="#d9b27c"/><path d="M52 252h44M74 236v44" stroke="#b58a52" strokeWidth="4"/>
    </svg>
  );
  if (variant === "estate") return (
    <svg className="service-art" viewBox="0 0 520 360" role="img" aria-label="Illustration of estate gate collection route">
      <defs><linearGradient id="est-bg" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#dff0ff"/><stop offset="1" stopColor="#eef6e6"/></linearGradient></defs>
      <rect width="520" height="360" rx="24" fill="url(#est-bg)"/><circle cx="84" cy="72" r="38" fill="#fff6d8"/>
      <rect x="58" y="112" width="110" height="142" rx="8" fill="#ffffff"/><path d="M58 112l55-42 55 42" fill="#124d32"/><rect x="78" y="140" width="24" height="24" fill="#cfe8f5"/><rect x="124" y="140" width="24" height="24" fill="#cfe8f5"/><rect x="100" y="196" width="28" height="58" fill="#0c3b26"/>
      <rect x="352" y="92" width="120" height="162" rx="8" fill="#f7faf2"/><path d="M352 92l60-38 60 38" fill="#1a6a45"/><rect x="372" y="120" width="26" height="26" fill="#cfe8f5"/><rect x="420" y="120" width="26" height="26" fill="#cfe8f5"/><rect x="372" y="166" width="26" height="26" fill="#cfe8f5"/><rect x="420" y="166" width="26" height="26" fill="#cfe8f5"/>
      <path d="M0 280h520v80H0z" fill="#c9d6c4"/><path d="M0 306h520" stroke="#ffffff" strokeWidth="5" strokeDasharray="28 22"/>
      <rect x="208" y="150" width="16" height="112" fill="#0c3b26"/><rect x="296" y="150" width="16" height="112" fill="#0c3b26"/><path d="M208 156h104" stroke="#0c3b26" strokeWidth="12"/><path d="M224 180h72" stroke="#c8f169" strokeWidth="8"/>
      <g><rect x="228" y="236" width="78" height="42" rx="8" fill="#124d32"/><rect x="306" y="248" width="34" height="30" rx="6" fill="#c8f169"/><rect x="312" y="253" width="20" height="13" rx="3" fill="#dff6ff"/><circle cx="246" cy="282" r="10" fill="#0b2e1f"/><circle cx="322" cy="282" r="10" fill="#0b2e1f"/></g>
      <path d="M176 322c40-16 128-16 168 0" stroke="#1a6a45" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 12"/>
    </svg>
  );
  return (
    <svg className="service-art" viewBox="0 0 520 360" role="img" aria-label="Illustration of a clean landscaped Lekki street">
      <defs><linearGradient id="str-bg" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e8f4ff"/><stop offset="1" stopColor="#f3f8e9"/></linearGradient></defs>
      <rect width="520" height="360" rx="24" fill="url(#str-bg)"/><circle cx="426" cy="66" r="40" fill="#fff4cf"/>
      <path d="M190 360l52-180h36l52 180z" fill="#9fb0a5"/><path d="M258 190v170" stroke="#fff" strokeWidth="5" strokeDasharray="20 18"/>
      <path d="M0 250c80-24 150-30 210-26l-34 136H0z" fill="#b7d6a4"/><path d="M520 250c-80-24-150-30-210-26l34 136h176z" fill="#b7d6a4"/>
      <rect x="54" y="150" width="104" height="80" rx="6" fill="#fff"/><path d="M54 150l52-34 52 34" fill="#124d32"/><rect x="76" y="172" width="22" height="22" fill="#cfe8f5"/><rect x="116" y="172" width="22" height="22" fill="#cfe8f5"/>
      <rect x="364" y="142" width="104" height="88" rx="6" fill="#fff"/><path d="M364 142l52-34 52 34" fill="#1a6a45"/><rect x="386" y="166" width="22" height="22" fill="#cfe8f5"/><rect x="426" y="166" width="22" height="22" fill="#cfe8f5"/>
      <g stroke="#124d32" strokeWidth="7" strokeLinecap="round"><path d="M178 238v-70"/><path d="M342 238v-76"/></g>
      <g fill="#1a6a45"><path d="M178 168c-26-20-48-16-60-2 22 2 40 8 60 10zM178 168c26-20 48-16 60-2-22 2-40 8-60 10zM178 168c-8-28 4-46 18-52-2 22-6 38-18 52z"/><path d="M342 162c-26-20-48-16-60-2 22 2 40 8 60 10zM342 162c26-20 48-16 60-2-22 2-40 8-60 10zM342 162c-8-28 4-46 18-52-2 22-6 38-18 52z"/></g>
      <path d="M206 330h108" stroke="#e7f4e4" strokeWidth="8" strokeLinecap="round"/><circle cx="258" cy="156" r="16" fill="#c8f169"/><path d="M251 156l5 5 10-11" stroke="#124d32" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

const WORK_SLIDES = [
  { tag: "Residential collection", title: "Bins out. Trucks on route. Streets cared for.", body: "Scheduled household collection across our selected Lekki routes, with clear time windows so residents can plan ahead.", art: "photo" as const },
  { tag: "Recycling guidance", title: "Separate what can be used again.", body: "Practical guidance for households and estates on keeping recyclables clean, dry and separated from general waste.", art: "recycling" as const },
  { tag: "Commercial & estates", title: "One coordinated plan for shared spaces.", body: "Collection arrangements for estate gates, commercial premises and shared bins, coordinated with managers and security teams.", art: "estate" as const },
  { tag: "Cleaner neighbourhoods", title: "The result is a street that feels looked after.", body: "Clear drains, tidy collection points and consistent communication — the everyday details that make a neighbourhood work.", art: "street" as const },
];

function WorkSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % WORK_SLIDES.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const slide = WORK_SLIDES[index];
  return (
    <div className="work-slideshow" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} aria-roledescription="carousel" aria-label="JURICHEST service spotlight">
      <div className="work-slide" key={index}>
        <div className="work-copy"><span className="work-tag">{slide.tag}</span><h3>{slide.title}</h3><p>{slide.body}</p><span className="work-count">0{index + 1} / 0{WORK_SLIDES.length}</span></div>
        <div className="work-visual">{slide.art === "photo" ? <><img src={urlFor("/images/collection-hero.png")} alt="Illustrative morning waste collection scene on a leafy Lagos residential street" width="1792" height="1024" loading="lazy" /><span className="image-note">Illustrative service imagery</span></> : <ServiceArt variant={slide.art} />}</div>
      </div>
      <div className="work-controls">
        <div className="work-dots">{WORK_SLIDES.map((item, dot) => <button key={item.tag} className={dot === index ? "active" : ""} aria-label={`Show slide ${dot + 1}: ${item.tag}`} aria-current={dot === index} onClick={() => setIndex(dot)} />)}</div>
        <div className="work-arrows"><button className="btn btn-outline btn-icon" aria-label="Previous slide" onClick={() => setIndex((index - 1 + WORK_SLIDES.length) % WORK_SLIDES.length)}><ChevronLeft size={19} /></button><button className="btn btn-outline btn-icon" aria-label="Next slide" onClick={() => setIndex((index + 1) % WORK_SLIDES.length)}><ChevronRight size={19} /></button></div>
      </div>
      <div className="work-progress"><span key={index} style={{ animationPlayState: paused ? "paused" : "running" }} /></div>
    </div>
  );
}

function BankCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bank-card ${compact ? "bank-compact" : ""}`}>
      <div className="bank-card-top"><span className="bank-logo">P</span><div><strong>{COMPANY.bank}</strong><span>Official collection account</span></div><ShieldCheck size={22} /></div>
      <div className="bank-number"><span>Account number</span><strong>{COMPANY.accountNumber}</strong><CopyButton value={COMPANY.accountNumber} /></div>
      <div className="bank-name"><span>Account name</span><strong>{COMPANY.accountName}</strong></div>
      <p><ClipboardList size={16} />Always use your <b>Customer Account Code</b> as narration / reference.</p>
    </div>
  );
}

export function HomePage({ navigate, onLogin }: { navigate: Navigate; onLogin: () => void }) {
  return (
    <main className="public-main">
      <section className="home-hero">
        <div className="hero-grain" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><span />Lekki's neighbourhood waste partner</span>
            <h1>A cleaner Lekki,<br /><em>one street</em> at a time.</h1>
            <p>Reliable waste collection for parts of Ikate, Kushenla, Folix Club Area and selected Freedom Way streets — with schedules, invoices and receipts in one calm portal.</p>
            <div className="hero-actions"><button className="btn btn-lime" onClick={() => navigate("/portal")}>Open customer portal<ArrowRight size={18} /></button><button className="btn btn-hero-outline" onClick={() => navigate("/contact")}>Request service</button></div>
            <div className="hero-trust"><span><ShieldCheck size={16} />LAWMA Registered PSP</span><span><MapPin size={16} />Local Lekki routes</span><span><Wallet size={16} />Transparent billing</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo"><img src={urlFor("/images/collection-hero.png")} alt="Illustrative JURICHEST service scene: green collection truck and sanitation workers on a leafy Lekki street" width="1792" height="1024" fetchPriority="high" /><span className="image-note">Illustrative service imagery</span></div>
            <div className="hero-chip hero-chip-top"><span className="chip-icon"><CalendarDays size={18} /></span><div><strong>Next collection</strong><span>Kushenla Road · 8:00 AM – 12:00 PM</span></div></div>
            <div className="hero-chip hero-chip-bottom"><span className="chip-icon lime"><Truck size={18} /></span><div><strong>Your street. Our route.</strong><span>Track it in your customer portal</span></div></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true"><div>{["Residential collection", "Estate services", "Commercial waste", "Special collections", "Recycling guidance", "Cleaner streets"].concat(["Residential collection", "Estate services", "Commercial waste", "Special collections", "Recycling guidance", "Cleaner streets"]).map((item, index) => <span key={index}><Leaf size={15} />{item}</span>)}</div></div>
      </section>

      <section className="section portal-strip-section">
        <div className="container">
          <Reveal><div className="portal-strip"><div className="portal-strip-copy"><span className="eyebrow"><span />Customer portal</span><h2>Your collection, without the guesswork.</h2><p>Log in from the home page to see what is due, when the truck is coming, and whether your receipt has been reviewed.</p></div><div className="portal-quick-cards">
            <button onClick={onLogin}><CalendarDays size={22} /><strong>Next collection</strong><span>See your street's time window</span><ArrowUpRight size={17} /></button>
            <button onClick={onLogin}><FileText size={22} /><strong>View invoice</strong><span>Print or save a digital bill</span><ArrowUpRight size={17} /></button>
            <button onClick={onLogin}><Upload size={22} /><strong>Upload receipt</strong><span>Send proof for admin review</span><ArrowUpRight size={17} /></button>
          </div></div></Reveal>
        </div>
      </section>

      <section className="section services-preview">
        <div className="container">
          <Reveal><SectionHeading eyebrow="What we do" title="Collection that fits your street, home or estate." body="Focused local services, clear communication, and a team that understands the neighbourhoods we serve." /></Reveal>
          <div className="service-preview-grid">
            {[{ icon: HomeIcon, title: "Residential", body: "Scheduled household waste collection with street-level time windows and simple digital billing.", points: ["Regular collection routes", "Missed-collection reporting", "Household invoices"] }, { icon: Building2, title: "Commercial & Estates", body: "Coordinated collection for shared bins, estate gates and commercial premises around our coverage area.", points: ["Estate manager coordination", "Shared collection points", "Account-based billing"] }, { icon: PackageCheck, title: "Special Collections", body: "Bulk, event and one-off collections arranged by request, scoped before the truck is dispatched.", points: ["Request-based scheduling", "Clear scope confirmation", "Flexible local support"] }].map((service, index) => <Reveal key={service.title} delay={index * 90}><article className="service-preview-card"><span className="service-icon"><service.icon size={25} strokeWidth={1.8} /></span><h3>{service.title}</h3><p>{service.body}</p><ul>{service.points.map((point) => <li key={point}><Check size={15} />{point}</li>)}</ul><a href="/services" onClick={(event) => { event.preventDefault(); navigate("/services"); }}>Explore service<ArrowRight size={16} /></a></article></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section work-section">
        <div className="container">
          <Reveal><SectionHeading eyebrow="Our work in focus" title="The everyday work behind a cleaner neighbourhood." body="A look at the services we provide — from household bins to coordinated estate routes." /></Reveal>
          <Reveal><WorkSlideshow /></Reveal>
        </div>
      </section>

      <section className="section coverage-preview">
        <div className="container coverage-grid">
          <Reveal><div><SectionHeading eyebrow="Where we collect" title="Local to Lekki. Specific about our streets." body="We serve most parts of Ikate, Kushenla / Kusenla Extension, Folix Club Area, selected streets around Freedom Way and surrounding estates. We do not claim the whole of Lekki or all of Ikate." /><div className="area-chips">{SERVICE_AREAS.map((area) => <span key={area}><MapPin size={14} />{area}</span>)}</div><button className="btn btn-primary" onClick={() => navigate("/areas")}>Check service areas<ArrowRight size={17} /></button></div></Reveal>
          <Reveal delay={100}><div className="coverage-map-card"><ServiceArt variant="street" /><div className="coverage-map-note"><ShieldCheck size={17} /><span>Coverage is confirmed street by street. Ask us before scheduling.</span></div></div></Reveal>
        </div>
      </section>

      <section className="section how-section">
        <div className="container">
          <Reveal><SectionHeading align="center" eyebrow="How it works" title="Four simple steps. One reliable routine." /></Reveal>
          <div className="steps-grid">{[{ icon: MessageCircle, title: "Request service", body: "Tell us your street, estate and collection needs." }, { icon: CalendarDays, title: "Get your schedule", body: "See the next truck date and time window in your portal." }, { icon: Wallet, title: "Pay & upload receipt", body: "Transfer to Providus Bank and send proof for review." }, { icon: Truck, title: "Track & report", body: "Follow collection status and report a missed pickup." }].map((step, index) => <Reveal key={step.title} delay={index * 90}><article className="step-card"><span className="step-number">0{index + 1}</span><span className="step-icon"><step.icon size={23} /></span><h3>{step.title}</h3><p>{step.body}</p></article></Reveal>)}</div>
        </div>
      </section>

      <section className="section billing-section">
        <div className="container billing-grid">
          <Reveal><div className="billing-copy"><SectionHeading eyebrow="Transparent billing" title="Know what you owe. Know where to pay." body="Every customer account has a clear invoice and a dedicated reference. Upload your receipt after payment and track approval from your dashboard." /><ul className="billing-points"><li><FileText size={19} /><div><strong>Digital invoices</strong><span>View, print or save your bill on mobile.</span></div></li><li><Upload size={19} /><div><strong>Receipt review</strong><span>Admin approval updates your balance to Paid.</span></div></li><li><Clock3 size={19} /><div><strong>Payment history</strong><span>See paid and pending items in one table.</span></div></li></ul><button className="btn btn-primary" onClick={onLogin}>Login to view your invoice<ArrowRight size={17} /></button></div></Reveal>
          <Reveal delay={100}><BankCard /></Reveal>
        </div>
      </section>

      <section className="cta-section"><div className="container cta-inner"><div><span className="eyebrow eyebrow-light"><span />Let's keep it clean</span><h2>Ready for a cleaner street?</h2><p>Talk to the JURICHEST team about your home, estate or commercial collection.</p></div><div className="cta-actions"><button className="btn btn-lime" onClick={() => navigate("/contact")}>Request service<ArrowRight size={18} /></button><a className="btn btn-hero-outline" href={COMPANY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} />Chat on WhatsApp</a></div></div></section>
    </main>
  );
}

export function ServicesPage({ navigate }: { navigate: Navigate }) {
  const services = [
    { icon: HomeIcon, title: "Residential collection", body: "Routine household waste collection for residents on our confirmed streets and estates.", points: ["Street-level collection schedules", "Clear time windows for bins out", "Digital invoices and payment history", "Missed-collection reporting from your portal", "Guidance on separating recyclables"] },
    { icon: Building2, title: "Commercial & estates", body: "Coordinated waste collection for estate managers, shared facilities and commercial premises within our coverage.", points: ["Collection plans for shared bins and gates", "Coordination with estate security", "Account codes for each billed customer", "Receipt upload and admin review", "Schedule updates visible to residents"] },
    { icon: PackageCheck, title: "Special collections", body: "One-off, bulk, event or post-project collections arranged by request and confirmed before dispatch.", points: ["Scope and access confirmed first", "Request-based date and time window", "Suitable for clean-up days and events", "Clear communication before the truck arrives", "Quoted directly by the team"] },
  ];
  return (
    <main className="public-main">
      <PageHero eyebrow="Our services" title="Waste collection, organised around your street." body="From household bins to estate routes and special clean-ups, JURICHEST keeps the process clear before, during and after collection." />
      <section className="section"><div className="container service-detail-grid">{services.map((service, index) => <Reveal key={service.title} delay={index * 80}><article className="service-detail-card"><span className="service-icon large"><service.icon size={29} strokeWidth={1.7} /></span><h2>{service.title}</h2><p>{service.body}</p><ul>{service.points.map((point) => <li key={point}><Check size={16} />{point}</li>)}</ul><button className="btn btn-outline" onClick={() => navigate("/contact")}>Request this service<ArrowRight size={16} /></button></article></Reveal>)}</div></section>
      <section className="section service-process"><div className="container"><Reveal><SectionHeading align="center" eyebrow="Before the truck arrives" title="A clear process, every time." /></Reveal><div className="steps-grid">{[{ icon: ClipboardList, title: "Confirm coverage", body: "We check your street or estate against our active routes." }, { icon: CalendarDays, title: "Publish schedule", body: "Admin posts the date and time window for your area." }, { icon: Truck, title: "Collect & close the loop", body: "Residents track the route and report anything missed." }].map((step, index) => <Reveal key={step.title} delay={index * 80}><article className="step-card"><span className="step-number">0{index + 1}</span><span className="step-icon"><step.icon size={23} /></span><h3>{step.title}</h3><p>{step.body}</p></article></Reveal>)}</div></div></section>
      <section className="cta-section"><div className="container cta-inner"><div><h2>Not sure which service fits?</h2><p>Send your street and collection needs — the team will confirm the right arrangement.</p></div><div className="cta-actions"><button className="btn btn-lime" onClick={() => navigate("/contact")}>Talk to our team<ArrowRight size={18} /></button></div></div></section>
    </main>
  );
}

export function AboutPage({ navigate }: { navigate: Navigate }) {
  return (
    <main className="public-main">
      <PageHero eyebrow="About JURICHEST" title="A local company, accountable to its neighbourhood." body="JURICHEST NIG. LTD is a LAWMA Registered Private Sector Participant providing waste collection in selected parts of Lekki, Lagos." />
      <section className="section"><div className="container about-grid"><Reveal><div className="about-story"><SectionHeading eyebrow="Who we are" title="Built for the streets we actually serve." body="We focus on clear routes, transparent billing and direct communication with residents and estate managers. Our coverage is intentionally specific: most parts of Ikate, Kushenla / Kusenla Extension, Folix Club Area, selected Freedom Way streets and surrounding estates." /><div className="about-facts"><div><span>Company</span><strong>{COMPANY.name}</strong></div><div><span>RC number</span><strong>{COMPANY.rc}</strong></div><div><span>Registration</span><strong>LAWMA Registered PSP</strong></div><div><span>Office address</span><strong>{COMPANY.address}</strong></div></div></div></Reveal><Reveal delay={100}><div className="about-photo"><img src={urlFor("/images/collection-hero.png")} alt="Illustrative waste collection service scene in a Lagos neighbourhood" width="1792" height="1024" loading="lazy" /><span className="image-note">Illustrative service imagery</span></div></Reveal></div></section>
      <section className="section values-section"><div className="container"><Reveal><SectionHeading align="center" eyebrow="What guides us" title="Reliable. Transparent. Local." /></Reveal><div className="service-preview-grid">{[{ icon: Truck, title: "Reliable routes", body: "Published collection windows and a direct way to report a missed pickup." }, { icon: FileText, title: "Transparent billing", body: "Account codes, digital invoices, official bank details and receipt review." }, { icon: MapPin, title: "Local focus", body: "Specific Lekki coverage, confirmed street by street rather than broad claims." }].map((value, index) => <Reveal key={value.title} delay={index * 80}><article className="service-preview-card"><span className="service-icon"><value.icon size={25} /></span><h3>{value.title}</h3><p>{value.body}</p></article></Reveal>)}</div></div></section>
      <section className="section roadmap-section"><div className="container"><Reveal><SectionHeading eyebrow="Product vision" title="Where the portal is heading." body="The current release is a working local demo. These are the next capabilities planned for a production backend." /></Reveal><div className="roadmap-grid">{[{ title: "Estate first-login provisioning", body: "Special first-login credentials for cohorts, for example KUSH / JURICHEST for Kushenla clients, followed by a personal password change." }, { title: "Automatic monthly billing", body: "Add each customer's monthly bill on the 1st of every month, with clear invoice history." }, { title: "Direct admin messaging", body: "Production notifications and messages from the admin team to any customer account." }, { title: "Stronger backend", body: "Real authentication, a shared database, secure receipt storage and audited payment review." }].map((item, index) => <Reveal key={item.title} delay={index * 70}><article className="roadmap-card"><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p><small>Planned</small></article></Reveal>)}</div></div></section>
      <section className="cta-section"><div className="container cta-inner"><div><h2>Meet the team behind your route.</h2><p>Call, email or message us about coverage, billing or collection.</p></div><div className="cta-actions"><button className="btn btn-lime" onClick={() => navigate("/contact")}>Contact JURICHEST<ArrowRight size={18} /></button></div></div></section>
    </main>
  );
}

export function AreasPage({ navigate }: { navigate: Navigate }) {
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [result, setResult] = useState("");
  function check(event: FormEvent) {
    event.preventDefault();
    if (!street.trim() || !area) { setResult("Enter your street and choose the closest area to check."); return; }
    setResult(area === "Not sure" ? "We may still be able to help. Send your exact street to the team for confirmation before scheduling." : `We operate in ${area}. Confirm that ${street.trim()} is on an active route before scheduling — coverage is street by street.`);
  }
  const areas = [
    { name: "Most parts of Ikate", body: "Selected residential streets and closes around Ikate, including routes near Ikate Elegushi Road. Not the whole of Ikate." },
    { name: "Kushenla / Kusenla Extension", body: "Kushenla Road and the Kusenla Extension routes, with published collection windows for enrolled streets." },
    { name: "Folix Club Area", body: "Streets and closes around the Folix Club Area, coordinated with local access points." },
    { name: "Selected Freedom Way streets", body: "Only selected streets and links around Freedom Way. Confirm your exact street before requesting service." },
    { name: "Surrounding estates", body: "Nearby estates may be covered by arrangement. Estate managers should confirm access and collection points." },
  ];
  return (
    <main className="public-main">
      <PageHero eyebrow="Service areas" title="We know our streets. We keep our coverage honest." body="JURICHEST serves selected communities in Lekki — not the whole of Lekki and not the entire Ikate area." />
      <section className="section"><div className="container areas-grid"><div className="area-list">{areas.map((item, index) => <Reveal key={item.name} delay={index * 60}><article className="area-card"><span className="area-index">0{index + 1}</span><div><h2>{item.name}</h2><p>{item.body}</p></div><MapPin size={21} /></article></Reveal>)}</div><Reveal delay={100}><aside className="coverage-checker card card-pad"><span className="service-icon"><MapPin size={25} /></span><h2>Check your street</h2><p>This gives a coverage indication, not a guaranteed schedule. Our team confirms the active route.</p><form onSubmit={check}><Field label="Street / close / estate" htmlFor="coverage-street"><input id="coverage-street" className="input" placeholder="e.g. Kushenla Road" value={street} onChange={(event) => setStreet(event.target.value)} /></Field><Field label="Closest area" htmlFor="coverage-area"><select id="coverage-area" className="select" value={area} onChange={(event) => setArea(event.target.value)}><option value="">Choose an area</option>{SERVICE_AREAS.map((item) => <option key={item}>{item}</option>)}<option>Not sure</option></select></Field><button className="btn btn-primary btn-block">Check coverage<ArrowRight size={17} /></button></form>{result && <p className="coverage-result" role="status"><ShieldCheck size={18} />{result}</p>}<a className="btn btn-outline btn-block" href={COMPANY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} />Confirm on WhatsApp</a></aside></Reveal></div></section>
      <section className="section coverage-map-section"><div className="container"><Reveal><div className="coverage-map-wide"><ServiceArt variant="estate" /><div><span className="eyebrow"><span />Schematic guide</span><h2>Coverage is confirmed street by street.</h2><p>This illustration explains our route-based approach; it is not a survey map. Always confirm your exact address with JURICHEST before paying or scheduling.</p><button className="btn btn-primary" onClick={() => navigate("/contact")}>Request coverage confirmation<ArrowRight size={17} /></button></div></div></Reveal></div></section>
    </main>
  );
}

const FAQS = [
  { q: "How do I know when the truck is coming?", a: "Log in to the customer portal. Your dashboard shows the next collection date and time window for your street or area, based on the schedule published by the admin team." },
  { q: "How do I pay my waste bill?", a: `Transfer to ${COMPANY.bank}, account number ${COMPANY.accountNumber}, account name ${COMPANY.accountName}. Always use your Customer Account Code as the narration/reference, then upload your receipt in the portal.` },
  { q: "How do I view or download my invoice?", a: "Open the customer portal and choose View invoice. You can print it or use your browser's share/print menu to save it as a PDF on mobile." },
  { q: "What should I do if collection is missed?", a: "Use Report missed collection in your portal with the date, street and a short note. You can also call or WhatsApp the team so the route can be checked." },
  { q: "Which areas do you cover?", a: "Most parts of Ikate, Kushenla / Kusenla Extension, Folix Club Area, selected streets around Freedom Way and surrounding estates by confirmation. We do not cover the whole of Lekki or the entire Ikate area." },
  { q: "How do I update my details?", a: "In the customer portal, open My account to update your name, phone, email or password. If you lose access, contact the admin team to update your account records." },
  { q: "What happens after I upload a receipt?", a: "The receipt appears for admin review. When approved, your outstanding balance becomes ₦0 and your status changes to Paid in the portal. If declined, the reason is shown for follow-up." },
  { q: "Is this demo connected to a real payment backend?", a: "No. This release is a local product demo: customer login accepts any email and password, admin uses admin / jurichest2026, and records persist in this browser. No real payments are processed." },
];

export function FaqPage({ navigate, onLogin }: { navigate: Navigate; onLogin: () => void }) {
  return (
    <main className="public-main">
      <PageHero eyebrow="Questions, answered" title="Clear answers for residents and estate managers." body="Everything you need to know about schedules, payments, invoices, missed collections and coverage." />
      <section className="section"><div className="container faq-layout"><div className="faq-list">{FAQS.map((item, index) => <Reveal key={item.q} delay={index * 35}><details className="faq-item"><summary>{item.q}<span className="faq-plus">+</span></summary><p>{item.a}</p></details></Reveal>)}</div><Reveal delay={100}><aside className="faq-aside card card-pad"><span className="service-icon"><MessageCircle size={25} /></span><h2>Still need help?</h2><p>Talk to the team directly, or open the portal to manage your account.</p><a className="btn btn-primary btn-block" href={COMPANY.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} />Chat on WhatsApp</a><a className="btn btn-outline btn-block" href={`tel:${COMPANY.phones[0]}`}><Phone size={17} />{COMPANY.phones[0]}</a><button className="btn btn-ghost btn-block" onClick={onLogin}>Open customer portal</button><button className="btn btn-ghost btn-block" onClick={() => navigate("/contact")}>Send a service request</button></aside></Reveal></div></section>
    </main>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "", service: "Residential collection", message: "" });
  const [submitted, setSubmitted] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState("");
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.area || !form.message.trim()) { setError("Please complete your name, email, phone, area and message."); return; }
    setError("");
    const request = addRequest(form);
    setSubmitted(request);
  }
  const whatsappText = submitted ? encodeURIComponent(`Hello JURICHEST, I am ${submitted.name}. Service: ${submitted.service}. Area: ${submitted.area}. Street/message: ${submitted.message}. Phone: ${submitted.phone}.`) : "";
  return (
    <main className="public-main">
      <PageHero eyebrow="Contact & request service" title="Tell us your street. We'll take it from there." body="Request collection, confirm coverage or ask about billing. The team is reachable by phone, WhatsApp and email." />
      <section className="section"><div className="container contact-grid"><Reveal><div className="contact-form-card card card-pad">{submitted ? <div className="contact-success"><span className="success-icon"><Check size={30} /></span><h2>Request saved in this demo</h2><p>Your request is now visible in the admin workspace on this browser. For a real response, send it directly to the team via WhatsApp or call.</p><div className="contact-success-actions"><a className="btn btn-lime" href={`${COMPANY.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer"><MessageCircle size={18} />Send via WhatsApp</a><button className="btn btn-outline" onClick={() => { setSubmitted(null); setForm({ name: "", email: "", phone: "", area: "", service: "Residential collection", message: "" }); }}>New request</button></div></div> : <><div className="card-title"><div><h2>Request service</h2><p>We will confirm coverage and the right collection arrangement.</p></div><Sparkles size={22} /></div><form onSubmit={submit}><div className="form-grid"><Field label="Full name" htmlFor="contact-name"><input id="contact-name" className="input" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" /></Field><Field label="Phone number" htmlFor="contact-phone"><input id="contact-phone" className="input" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="080..." /></Field><Field label="Email" htmlFor="contact-email" className="full"><input id="contact-email" className="input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></Field><Field label="Area" htmlFor="contact-area"><select id="contact-area" className="select" value={form.area} onChange={(event) => update("area", event.target.value)}><option value="">Choose area</option>{SERVICE_AREAS.map((area) => <option key={area}>{area}</option>)}<option>Not sure</option></select></Field><Field label="Service" htmlFor="contact-service"><select id="contact-service" className="select" value={form.service} onChange={(event) => update("service", event.target.value)}><option>Residential collection</option><option>Commercial & estates</option><option>Special collection</option><option>Billing / account help</option></select></Field><Field label="Street / estate and message" htmlFor="contact-message" className="full"><textarea id="contact-message" className="textarea" value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Tell us your exact street, estate gate or collection need..." /></Field></div>{error && <p className="form-error" role="alert">{error}</p>}<p className="field-hint demo-form-note">Demo form: saved locally and visible to the admin workspace in this browser. Use WhatsApp or phone for a real request.</p><button className="btn btn-primary">Submit request<ArrowRight size={17} /></button></form></>}</div></Reveal><Reveal delay={100}><aside className="contact-details"><div className="contact-detail-card"><Phone size={22} /><div><h3>Call us</h3><a href={`tel:${COMPANY.phones[0]}`}>{COMPANY.phones[0]}</a><a href={`tel:${COMPANY.phones[1]}`}>{COMPANY.phones[1]}</a></div></div><div className="contact-detail-card"><MessageCircle size={22} /><div><h3>WhatsApp</h3><a href={COMPANY.whatsapp} target="_blank" rel="noreferrer">Chat with the team</a><span>Fastest way to confirm your street</span></div></div><div className="contact-detail-card"><MailIcon /><div><h3>Email</h3><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div></div><div className="contact-detail-card"><MapPin size={22} /><div><h3>Office address</h3><span>{COMPANY.address}</span><small>Service routes are in selected Lekki communities.</small></div></div><BankCard compact /></aside></Reveal></div></section>
    </main>
  );
}

function MailIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>; }

export function NotFoundPage({ navigate }: { navigate: Navigate }) {
  return <main className="public-main not-found container page-enter"><span className="eyebrow"><span />404</span><h1>This street isn't on our map.</h1><p>The page you are looking for does not exist. Head back home or contact the team.</p><div className="hero-actions"><button className="btn btn-primary" onClick={() => navigate("/")}>Back to home</button><button className="btn btn-outline" onClick={() => navigate("/contact")}>Contact us</button></div></main>;
}