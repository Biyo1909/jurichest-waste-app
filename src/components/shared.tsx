import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Inbox, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMPANY, formatDate, money, todayISO, type Customer, type Receipt } from "@/lib/store";

export function Modal({ open, onOpenChange, title, description, children, wide = false, className = "" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`modal-shell ${wide ? "modal-wide" : ""} ${className}`}>
        <DialogHeader className="modal-heading">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="modal-body">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, htmlFor, hint, children, className = "" }: { label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function StatusBadge({ status, children }: { status: string; children?: ReactNode }) {
  const tone = ["Paid", "Approved", "Resolved", "Contacted"].includes(status) ? "success"
    : ["Pending", "Open", "New"].includes(status) ? "warning"
      : ["Declined"].includes(status) ? "danger" : "info";
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{children ?? status}</span>;
}

export function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={26} strokeWidth={1.7} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function CopyButton({ value, label = "Copy", className = "" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy is unavailable. Select and copy the text manually.");
    }
  }
  return <button type="button" className={`copy-button ${className}`} onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : label}</button>;
}

export function SectionHeading({ eyebrow, title, body, align = "left" }: { eyebrow: string; title: string; body?: string; align?: "left" | "center" }) {
  return (
    <div className={`section-heading ${align === "center" ? "centered" : ""}`}>
      <span className="eyebrow"><span />{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, detail, tone = "green" }: { icon: LucideIcon; label: string; value: string; detail: string; tone?: "green" | "lime" | "amber" | "blue" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top"><span className="stat-icon"><Icon size={20} strokeWidth={1.8} /></span><span className="stat-detail">{detail}</span></div>
      <strong>{value}</strong>
      <span className="stat-label">{label}</span>
    </article>
  );
}

export function CollectionTruck({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`truck-road ${compact ? "truck-compact" : ""}`} role="img" aria-label="Animated JURICHEST collection truck driving along a route">
      <div className="truck-scenery"><span /><span /><span /></div>
      <svg className="truck-svg" viewBox="0 0 620 150" fill="none" aria-hidden="true">
        <path className="road-line" d="M0 122H620" stroke="currentColor" strokeWidth="3" strokeDasharray="18 14" />
        <g className="truck-moving">
          <ellipse cx="285" cy="120" rx="118" ry="8" fill="#0b2e1f" opacity=".12" />
          <path d="M188 48h142a10 10 0 0 1 10 10v48H178V58a10 10 0 0 1 10-10Z" fill="#176b45" />
          <path d="M196 56h126v14H196z" fill="#2c8a5c" />
          <path d="M340 66h48l27 28v12h-75V66Z" fill="#c6f24e" />
          <path d="M350 72h32l18 20h-50V72Z" fill="#dff6ff" />
          <path d="M340 96h75v10h-75z" fill="#a5d63a" />
          <rect x="176" y="100" width="242" height="12" rx="4" fill="#0d3b28" />
          <path d="M198 78h84" stroke="#dff5d8" strokeWidth="5" strokeLinecap="round" opacity=".8" />
          <path d="M198 90h56" stroke="#dff5d8" strokeWidth="5" strokeLinecap="round" opacity=".5" />
          <circle className="truck-wheel" cx="222" cy="112" r="17" fill="#12251c" /><circle cx="222" cy="112" r="8" fill="#d9e5dc" /><path className="wheel-spoke" d="M222 104v16M214 112h16" stroke="#6b7f72" strokeWidth="3" />
          <circle className="truck-wheel" cx="372" cy="112" r="17" fill="#12251c" /><circle cx="372" cy="112" r="8" fill="#d9e5dc" /><path className="wheel-spoke" d="M372 104v16M364 112h16" stroke="#6b7f72" strokeWidth="3" />
          <rect x="407" y="98" width="8" height="6" rx="2" fill="#fff7cf" />
          <path d="M168 88h10v18h-18" stroke="#0d3b28" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
      <div className="truck-route-labels"><span>Your street</span><span>Next collection</span></div>
    </div>
  );
}

export function SampleReceipt({ receipt, customer }: { receipt: Receipt; customer?: Customer }) {
  return (
    <div className="sample-receipt">
      <div className="sample-receipt-brand"><span className="bank-mark">P</span><div><strong>Providus Bank</strong><span>Electronic transfer receipt</span></div><span className="receipt-success">Successful</span></div>
      <div className="sample-amount"><span>Amount transferred</span><strong>{money(receipt.amount)}</strong></div>
      <dl className="receipt-details">
        <div><dt>Beneficiary</dt><dd>{COMPANY.accountName}</dd></div>
        <div><dt>Beneficiary account</dt><dd>{COMPANY.accountNumber} · {COMPANY.bank}</dd></div>
        <div><dt>Sender</dt><dd>{customer?.name ?? "JURICHEST customer"}</dd></div>
        <div><dt>Narration / reference</dt><dd>{receipt.reference}</dd></div>
        <div><dt>Transaction date</dt><dd>{formatDate(receipt.uploadedAt)}</dd></div>
        <div><dt>Reference</dt><dd>PVD-{receipt.id.slice(-8).toUpperCase()}</dd></div>
      </dl>
      <p className="demo-watermark">Illustrative demo receipt · not a bank document</p>
    </div>
  );
}

export function InvoiceDocument({ customer }: { customer: Customer }) {
  const amountDue = customer.balance;
  const invoiceNumber = `JRC/${customer.accountCode.replace(/JRC-/, "")}/${todayISO().slice(0, 7).replace("-", "")}`;
  return (
    <div className="invoice-paper" id="jurichest-invoice">
      <div className="invoice-orange-band">
        <div><strong>JURICHEST NIG. LTD</strong><span>LAWMA Registered Private Sector Participant (PSP)</span></div>
        <div className="invoice-rc">RC {COMPANY.rc}</div>
      </div>
      <div className="invoice-company-row">
        <div><span>{COMPANY.address}</span><span>{COMPANY.phones.join(", ")} · {COMPANY.email}</span></div>
        <div className="invoice-title"><strong>WASTE COLLECTION INVOICE</strong><span>{invoiceNumber}</span><span>Issued {formatDate(todayISO())}</span></div>
      </div>
      <div className="invoice-customer-grid">
        <div><span>Customer account code</span><strong>{customer.accountCode}</strong></div>
        <div><span>Billed to</span><strong>{customer.name}</strong><span>{customer.street}, {customer.estate}</span></div>
        <div><span>Payment status</span><strong className={amountDue === 0 ? "invoice-paid-text" : "invoice-due-text"}>{amountDue === 0 ? "PAID" : "PAYMENT DUE"}</strong></div>
      </div>
      <table className="invoice-table">
        <thead><tr><th>Description</th><th>Period</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody><tr><td>Residential / estate waste collection service</td><td>{formatDate(todayISO(), { month: "long", year: "numeric" })}</td><td>1</td><td>{money(customer.billAmount || customer.balance)}</td></tr></tbody>
      </table>
      <div className="invoice-totals"><span>Amount due</span><strong>{money(amountDue)}</strong></div>
      {amountDue === 0 && <div className="invoice-paid-stamp">PAID</div>}
      <div className="invoice-bank">
        <strong>Payment details</strong>
        <div><span>Bank</span><b>{COMPANY.bank}</b></div>
        <div><span>Account number</span><b>{COMPANY.accountNumber}</b></div>
        <div><span>Account name</span><b>{COMPANY.accountName}</b></div>
        <p>Always use your Customer Account Code <b>{customer.accountCode}</b> as the narration / reference when paying.</p>
      </div>
      <div className="invoice-footer"><span>Thank you for keeping Lekki clean.</span><span>This is a digital demo invoice for portal review.</span></div>
    </div>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · JURICHEST NIG. LTD`;
  }, [title]);
}