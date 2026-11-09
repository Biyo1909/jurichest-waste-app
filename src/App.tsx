import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AccessGate, LoginModal, SiteFooter, SiteHeader, WhatsAppFloat, type Navigate } from "@/components/site-shell";
import { useDocumentTitle } from "@/components/shared";
import { useSession } from "@/lib/store";
import { normalize, pathFromLocation, urlFor } from "@/lib/base";
import { AboutPage, AreasPage, ContactPage, FaqPage, HomePage, NotFoundPage, ServicesPage } from "@/pages/Public";
import Portal from "@/pages/Portal";
import Admin from "@/pages/Admin";

const LETTERS = "JURICHEST".split("");
const TITLES: Record<string, string> = {
  "/": "Cleaner streets, clearer schedules",
  "/services": "Services",
  "/about": "About us",
  "/areas": "Service areas",
  "/faq": "FAQ",
  "/contact": "Contact & request service",
  "/portal": "Customer portal",
  "/admin": "Admin workspace",
};

export default function App() {
  const [path, setPath] = useState(pathFromLocation);
  const [loading, setLoading] = useState(true);
  const [loaderKey, setLoaderKey] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const session = useSession();
  useDocumentTitle(TITLES[path] ?? "Page not found");

  const navigate = useCallback<Navigate>((target) => {
    const next = normalize(target);
    if (next === pathFromLocation()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.history.pushState({}, "", urlFor(next));
    setPath(next);
    window.scrollTo(0, 0);
    setLoaderKey((key) => key + 1);
    setLoading(true);
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPath(pathFromLocation());
      window.scrollTo(0, 0);
      setLoaderKey((key) => key + 1);
      setLoading(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLoading(false), reduced ? 180 : 1680);
    document.body.style.overflow = "hidden";
    return () => { window.clearTimeout(timer); document.body.style.overflow = ""; };
  }, [loading, loaderKey]);

  const isPublic = !["/portal", "/admin"].includes(path);
  let content;
  if (path === "/") content = <HomePage navigate={navigate} onLogin={() => setLoginOpen(true)} />;
  else if (path === "/services") content = <ServicesPage navigate={navigate} />;
  else if (path === "/about") content = <AboutPage navigate={navigate} />;
  else if (path === "/areas") content = <AreasPage navigate={navigate} />;
  else if (path === "/faq") content = <FaqPage navigate={navigate} onLogin={() => setLoginOpen(true)} />;
  else if (path === "/contact") content = <ContactPage />;
  else if (path === "/portal") content = session?.role === "customer" ? <Portal navigate={navigate} /> : <AccessGate kind="customer" onLogin={() => setLoginOpen(true)} navigate={navigate} />;
  else if (path === "/admin") content = session?.role === "admin" ? <Admin navigate={navigate} /> : <AccessGate kind="admin" onLogin={() => setLoginOpen(true)} navigate={navigate} />;
  else content = <NotFoundPage navigate={navigate} />;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {isPublic && <SiteHeader path={path} navigate={navigate} onLogin={() => setLoginOpen(true)} />}
      <div id="main-content" tabIndex={-1} key={path} className="page-enter">{content}</div>
      {isPublic && <SiteFooter navigate={navigate} />}
      <WhatsAppFloat />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} navigate={navigate} />
      <Toaster position="top-center" richColors closeButton />
      {loading && <div className="app-loader" key={loaderKey} role="status" aria-label="Loading JURICHEST">
        <div className="loader-inner">
          <div className="loader-word" aria-hidden="true">{LETTERS.map((letter, index) => <span key={`${letter}-${index}`} style={{ "--letter-index": index } as CSSProperties}>{letter}</span>)}</div>
          <div className="loader-progress" aria-hidden="true"><span /></div>
          <span className="loader-caption">Cleaner streets. Clearer schedules.</span>
        </div>
      </div>}
    </>
  );
}