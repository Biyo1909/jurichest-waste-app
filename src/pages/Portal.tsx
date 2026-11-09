import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight, ArrowUpRight, Banknote, Bell, CalendarClock, CalendarDays, Check, ChevronRight,
  CircleAlert, CircleCheck, Clock, Download, Eye, EyeOff, FileImage, FileText, FileUp,
  FlaskConical, Inbox, Info, KeyRound, Landmark, Leaf, LoaderCircle, LogOut, Mail, MapPin,
  MessageSquare, Phone, Printer, ReceiptText, Recycle, Search, Send, ShieldCheck, Smartphone,
  Trash2, TriangleAlert, Truck, Upload, UserRound, Wallet, X, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  CollectionTruck, CopyButton, EmptyState, Field, InvoiceDocument, Modal, SampleReceipt,
  StatCard, StatusBadge, useDocumentTitle,
} from "@/components/shared";
import {
  COMPANY, SERVICE_AREAS, activeSchedules, addReport, changePassword, formatDate, formatDateTime,
  getReceiptFile, initials, markMessageRead, money, nextScheduleFor, todayISO, updateCustomer,
  uploadReceipt, useAppData, useSession, logout, type Customer, type CustomerMessage, type MissedReport, type Receipt,
} from "@/lib/store";
import "@/styles/portal.css";

type TabId = "overview" | "payments" | "schedule" | "missed" | "messages" | "account";

const TABS: { id: TabId; label: string; short: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", short: "Home", icon: Leaf },
  { id: "payments", label: "Payments & invoices", short: "Payments", icon: Wallet },
  { id: "schedule", label: "Collection schedule", short: "Schedule", icon: CalendarDays },
  { id: "missed", label: "Missed collections", short: "Missed", icon: Truck },
  { id: "messages", label: "Messages", short: "Messages", icon: MessageSquare },
  { id: "account", label: "My account", short: "Account", icon: UserRound },
];

const TAB_TITLES: Record<TabId, string> = {
  overview: "Overview",
  payments: "Payments & invoices",
  schedule: "Collection schedule",
  missed: "Missed collections",
  messages: "Messages",
  account: "My account",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

function receiptStatusLabel(receipt: Receipt): "Paid" | "Pending" | "Declined" {
  if (receipt.status === "Approved") return "Paid";
  if (receipt.status === "Declined") return "Declined";
  return "Pending";
}

function fileSizeLabel(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntil(dateISO: string) {
  const target = new Date(`${dateISO}T12:00:00`).getTime();
  const now = new Date(`${todayISO()}T12:00:00`).getTime();
  return Math.round((target - now) / 86400000);
}

function relativeDay(dateISO: string) {
  const days = daysUntil(dateISO);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function validateReceiptFile(file: File): string | null {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const typeOk = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
  if (!typeOk) return "Only PDF, JPG, PNG or WebP files are accepted.";
  if (file.size > MAX_FILE_BYTES) return `That file is ${fileSizeLabel(file.size)} — the limit is 5 MB.`;
  if (file.size === 0) return "That file is empty. Choose the actual receipt export.";
  return null;
}

function PortalToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    if (!document.querySelector("[data-sonner-toaster]")) setNeeded(true);
  }, []);
  return needed ? <Toaster position="top-right" closeButton /> : null;
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`portal-brand-mark ${small ? "is-small" : ""}`} aria-hidden="true">
      <Recycle size={small ? 16 : 20} strokeWidth={2.1} />
    </span>
  );
}

function DemoNotice() {
  return (
    <div className="portal-demo-notice" role="note">
      <FlaskConical size={14} strokeWidth={2.2} aria-hidden="true" />
      <strong>Local demo</strong>
      <span className="portal-demo-long">Records live in this browser only — no real bank transfer, collection or SMS is processed.</span>
      <span className="portal-demo-short">Browser-only records · no real payments.</span>
    </div>
  );
}

function HowToPayCard({ customer }: { customer: Customer }) {
  return (
    <section className="card how-to-pay" aria-labelledby="how-to-pay-title">
      <div className="how-to-pay-glow" aria-hidden="true" />
      <header className="how-to-pay-head">
        <span className="how-to-pay-bankmark" aria-hidden="true">P</span>
        <div>
          <h2 id="how-to-pay-title">How to Pay</h2>
          <p>Bank transfer to the JURICHEST collection account</p>
        </div>
        <Landmark className="how-to-pay-landmark" size={26} strokeWidth={1.6} aria-hidden="true" />
      </header>
      <dl className="how-to-pay-details">
        <div>
          <dt>Bank</dt>
          <dd>{COMPANY.bank}</dd>
        </div>
        <div>
          <dt>Account number</dt>
          <dd className="how-to-pay-account mono">
            {COMPANY.accountNumber}
            <CopyButton value={COMPANY.accountNumber} label="Copy" />
          </dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>{COMPANY.accountName}</dd>
        </div>
        <div>
          <dt>Narration / reference</dt>
          <dd className="how-to-pay-account mono">
            {customer.accountCode}
            <CopyButton value={customer.accountCode} label="Copy code" />
          </dd>
        </div>
      </dl>
      <p className="how-to-pay-warning">
        <TriangleAlert size={15} strokeWidth={2.2} aria-hidden="true" />
        Always use your Customer Account Code <b className="mono">{customer.accountCode}</b> as the
        narration / reference so we can match your payment to your street.
      </p>
      <ol className="how-to-pay-steps">
        <li><span>1</span>Transfer {money(customer.balance > 0 ? customer.balance : customer.billAmount)} from your bank app to the account above.</li>
        <li><span>2</span>Enter your account code as the narration before you confirm.</li>
        <li><span>3</span>Upload the receipt below — the team reviews it in the admin portal.</li>
      </ol>
    </section>
  );
}

function UploadReceiptForm({ customer, onUploaded }: { customer: Customer; onUploaded: (receipt: Receipt) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(String(customer.balance > 0 ? customer.balance : customer.billAmount));
  const [reference, setReference] = useState(customer.accountCode);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(candidate: File | undefined | null) {
    if (!candidate) return;
    const problem = validateReceiptFile(candidate);
    if (problem) {
      setError(problem);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.error(problem);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (uploading) return;
    if (!file) {
      setError("Attach the bank receipt first — PDF, JPG, PNG or WebP, max 5 MB.");
      toast.error("Attach your receipt before submitting.");
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter the exact amount you transferred, in naira.");
      return;
    }
    if (!reference.trim()) {
      setError("Add the narration / reference you used — your account code is best.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const receipt = await uploadReceipt(customer.id, { amount: Math.round(parsedAmount), reference: reference.trim(), note: note.trim() }, file);
      toast.success("Receipt uploaded", { description: `${money(receipt.amount)} is now pending review by the JURICHEST team.` });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setNote("");
      setReference(customer.accountCode);
      setAmount(String(customer.balance > 0 ? customer.balance : customer.billAmount));
      onUploaded(receipt);
    } catch {
      const message = "We could not save that file in this browser. Check that storage is allowed and try again.";
      setError(message);
      toast.error("Upload failed", { description: message });
    } finally {
      setUploading(false);
    }
  }

  const FileIcon = file?.type.startsWith("image/") ? FileImage : FileText;

  return (
    <form className="card card-pad upload-card" id="upload-receipt" onSubmit={handleSubmit} noValidate>
      <div className="card-title">
        <div>
          <h2><FileUp size={18} strokeWidth={2} aria-hidden="true" /> Upload payment receipt</h2>
          <p>After transferring, attach the receipt so the team can review and clear your balance.</p>
        </div>
        <span className="upload-limit-chip">Max 5 MB</span>
      </div>

      <div
        className={`upload-dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pickFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          id="receipt-file"
          type="file"
          className="upload-input"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => pickFile(event.target.files?.[0])}
          disabled={uploading}
        />
        {file ? (
          <div className="upload-selected">
            <span className="upload-file-icon"><FileIcon size={20} strokeWidth={1.8} /></span>
            <span className="upload-file-meta">
              <strong>{file.name}</strong>
              <span>{fileSizeLabel(file.size)} · {file.type || "file"} · ready to upload</span>
            </span>
            <button type="button" className="btn btn-outline btn-sm" onClick={clearFile} disabled={uploading}>
              <Trash2 size={15} /> Remove
            </button>
          </div>
        ) : (
          <button type="button" className="upload-prompt" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <span className="upload-prompt-icon"><Upload size={22} strokeWidth={1.9} /></span>
            <strong>Tap to choose your receipt</strong>
            <span>or drag the file here · PDF, JPG, PNG, WebP · max 5 MB</span>
          </button>
        )}
      </div>

      <div className="form-grid upload-fields">
        <Field label="Amount paid (₦)" htmlFor="receipt-amount" hint="The exact amount on your bank receipt.">
          <input
            id="receipt-amount"
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={uploading}
            required
          />
        </Field>
        <Field label="Narration / reference" htmlFor="receipt-reference" hint="Prefilled with your Customer Account Code — keep it if that is what you used.">
          <input
            id="receipt-reference"
            className="input mono"
            type="text"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            disabled={uploading}
            required
          />
        </Field>
        <Field label="Note (optional)" htmlFor="receipt-note" className="full" hint="Example: November collection for Kushenla Road.">
          <textarea
            id="receipt-note"
            className="textarea"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything the review team should know"
            disabled={uploading}
          />
        </Field>
      </div>

      {error && <p className="form-error upload-error" role="alert"><CircleAlert size={15} /> {error}</p>}

      <div className="form-actions upload-actions">
        <span className="upload-privacy"><ShieldCheck size={14} /> Stored locally in this browser for the demo.</span>
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? <><LoaderCircle size={17} className="spin" /> Uploading…</> : <><Send size={16} /> Submit receipt</>}
        </button>
      </div>
    </form>
  );
}

function ReceiptFileModal({ receipt, customer, open, onOpenChange }: { receipt: Receipt | null; customer: Customer; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !receipt || receipt.sample) return;
    let active = true;
    let objectUrl: string | null = null;
    setLoading(true);
    setFailed(false);
    setUrl(null);
    getReceiptFile(receipt.id)
      .then((blob) => {
        if (!active) return;
        if (!blob) { setFailed(true); return; }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, receipt]);

  if (!receipt) return null;
  const isImage = receipt.fileType.startsWith("image/");

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      wide
      title={receipt.sample ? "Sample bank receipt" : "Uploaded receipt"}
      description={`${receipt.fileName} · ${money(receipt.amount)} · ${receiptStatusLabel(receipt)}`}
      className="receipt-modal"
    >
      {receipt.sample ? (
        <SampleReceipt receipt={receipt} customer={customer} />
      ) : loading ? (
        <div className="receipt-file-loading"><LoaderCircle size={26} className="spin" /><span>Opening file from browser storage…</span></div>
      ) : failed || !url ? (
        <EmptyState
          icon={CircleAlert}
          title="File not available"
          body="The receipt record exists, but the file is no longer in this browser's storage. Re-upload the receipt from Payments & invoices."
        />
      ) : (
        <div className="receipt-file-frame">
          {isImage
            ? <img src={url} alt={`Receipt ${receipt.fileName}`} />
            : <iframe src={url} title={`Receipt ${receipt.fileName}`} />}
        </div>
      )}
      <div className="form-actions">
        {url && !receipt.sample && (
          <a className="btn btn-outline" href={url} download={receipt.fileName}>
            <Download size={16} /> Download file
          </a>
        )}
        <button type="button" className="btn btn-primary" onClick={() => onOpenChange(false)}>
          <Check size={16} /> Done
        </button>
      </div>
    </Modal>
  );
}

function PaymentHistory({ receipts, onOpenReceipt, highlightId }: { receipts: Receipt[]; onOpenReceipt: (receipt: Receipt) => void; highlightId: string | null }) {
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending" | "Declined">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const statusOk = filter === "All" || receiptStatusLabel(receipt) === filter;
      const queryOk = !key || [receipt.fileName, receipt.reference, receipt.note].some((value) => value.toLowerCase().includes(key));
      return statusOk && queryOk;
    });
  }, [receipts, filter, query]);

  const approvedTotal = receipts.filter((receipt) => receipt.status === "Approved").reduce((sum, receipt) => sum + receipt.amount, 0);
  const pendingCount = receipts.filter((receipt) => receipt.status === "Pending").length;

  return (
    <section className="card card-pad history-card" aria-labelledby="history-title">
      <div className="card-title">
        <div>
          <h2 id="history-title"><ReceiptText size={18} strokeWidth={2} aria-hidden="true" /> Payment history</h2>
          <p>{money(approvedTotal)} approved · {pendingCount} awaiting review · {receipts.length} receipt{receipts.length === 1 ? "" : "s"} on record</p>
        </div>
      </div>

      <div className="history-controls">
        <div className="history-filters" role="group" aria-label="Filter payments by status">
          {(["All", "Paid", "Pending", "Declined"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`history-filter ${filter === option ? "is-active" : ""}`}
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
            >
              {option}
              <span>{option === "All" ? receipts.length : receipts.filter((receipt) => receiptStatusLabel(receipt) === option).length}</span>
            </button>
          ))}
        </div>
        <label className="history-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Search file, reference or note"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search payment history"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={receipts.length === 0 ? "No receipts yet" : "Nothing matches that filter"}
          body={receipts.length === 0
            ? "Once you transfer to the Providus account and upload the receipt, it will appear here with its review status."
            : "Try a different status or clear the search to see every receipt on your account."}
          action={receipts.length > 0 ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setFilter("All"); setQuery(""); }}>
              <X size={15} /> Clear filters
            </button>
          ) : undefined}
        />
      ) : (
        <div className="data-table-wrap history-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Uploaded</th>
                <th scope="col">Receipt</th>
                <th scope="col">Reference</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => {
                const label = receiptStatusLabel(receipt);
                return (
                  <tr key={receipt.id} className={highlightId === receipt.id ? "row-highlight" : ""}>
                    <td>
                      <span className="table-primary">{formatDate(receipt.uploadedAt)}</span>
                      <span className="table-secondary">{formatDateTime(receipt.uploadedAt).split(",").pop()?.trim()}</span>
                    </td>
                    <td>
                      <span className="table-primary history-filename">{receipt.fileName}</span>
                      <span className="table-secondary">{receipt.note || (receipt.sample ? "Sample demo receipt" : "Uploaded from this portal")}</span>
                      {receipt.reviewNote && <span className="table-secondary history-review-note">Review: {receipt.reviewNote}</span>}
                    </td>
                    <td><span className="mono history-reference">{receipt.reference}</span></td>
                    <td className="num table-primary">{money(receipt.amount)}</td>
                    <td><StatusBadge status={label} /></td>
                    <td>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenReceipt(receipt)}>
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="history-footnote"><Info size={13} /> Paid = receipt approved by the team · Pending = uploaded, awaiting review · Declined = receipt rejected, check the review note.</p>
    </section>
  );
}

function ReportForm({ customer, onReported }: { customer: Customer; onReported: (report: MissedReport) => void }) {
  const [street, setStreet] = useState(customer.street);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!street.trim()) { setError("Tell us the street or close the truck missed."); return; }
    if (!date) { setError("Pick the date the collection was missed."); return; }
    if (date > todayISO()) { setError("You can only report a collection that has already been missed — pick today or an earlier date."); return; }
    if (note.trim().length < 10) { setError("Add a short note (at least 10 characters) — e.g. bins were out by 8 AM but the truck did not come."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const report = addReport(customer.id, { street: street.trim(), date, note: note.trim() });
      toast.success("Missed collection reported", { description: `The team will review ${formatDate(date)} for ${report.street}.` });
      setNote("");
      setDate(todayISO());
      setStreet(customer.street);
      onReported(report);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card card-pad report-form" id="report-missed" onSubmit={handleSubmit} noValidate>
      <div className="card-title">
        <div>
          <h2><TriangleAlert size={18} strokeWidth={2} aria-hidden="true" /> Report a missed collection</h2>
          <p>Bins out but no truck? Tell us the date and street so the route supervisor can follow up.</p>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Street / close" htmlFor="report-street" hint="Prefilled from your service address.">
          <input id="report-street" className="input" type="text" value={street} onChange={(event) => setStreet(event.target.value)} required />
        </Field>
        <Field label="Date missed" htmlFor="report-date" hint="Today or an earlier date.">
          <input id="report-date" className="input" type="date" value={date} max={todayISO()} onChange={(event) => setDate(event.target.value)} required />
        </Field>
        <Field label="What happened?" htmlFor="report-note" className="full" hint="Include the time your bins were out and any landmark that helps the crew.">
          <textarea
            id="report-note"
            className="textarea"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Example: Bins were out before 8 AM on Tuesday but the truck did not come through our close."
            required
          />
        </Field>
      </div>
      {error && <p className="form-error upload-error" role="alert"><CircleAlert size={15} /> {error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <><LoaderCircle size={16} className="spin" /> Sending…</> : <><Send size={16} /> Send report</>}
        </button>
      </div>
    </form>
  );
}

function ReportList({ reports, highlightId }: { reports: MissedReport[]; highlightId: string | null }) {
  if (reports.length === 0) {
    return (
      <section className="card">
        <EmptyState
          icon={CircleCheck}
          title="No missed collections reported"
          body="When a route is missed, your reports and their review status will appear here. Hopefully this stays empty."
        />
      </section>
    );
  }
  return (
    <section className="card card-pad" aria-labelledby="reports-title">
      <div className="card-title">
        <div>
          <h2 id="reports-title">Your reports</h2>
          <p>{reports.length} report{reports.length === 1 ? "" : "s"} · newest first</p>
        </div>
      </div>
      <ul className="report-list">
        {reports.map((report) => (
          <li key={report.id} className={`report-item ${highlightId === report.id ? "row-highlight" : ""}`}>
            <div className="report-item-head">
              <span className="report-date"><CalendarDays size={15} /> {formatDate(report.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              <StatusBadge status={report.status} />
            </div>
            <p className="report-street"><MapPin size={14} /> {report.street}</p>
            <p className="report-note">{report.note}</p>
            {report.adminNote && <p className="report-admin-note"><ShieldCheck size={14} /> Team note: {report.adminNote}</p>}
            <span className="report-created">Reported {formatDateTime(report.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MessagesView({ customerId, messages, onRead }: { customerId: string; messages: CustomerMessage[]; onRead: (id: string) => void }) {
  const mine = useMemo(
    () => messages.filter((message) => message.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [messages, customerId],
  );
  const [expanded, setExpanded] = useState<string | null>(mine.find((message) => !message.read)?.id ?? null);
  const unread = mine.filter((message) => !message.read).length;

  function toggle(message: CustomerMessage) {
    setExpanded((current) => (current === message.id ? null : message.id));
    if (!message.read) onRead(message.id);
  }

  return (
    <section className="card card-pad messages-card" aria-labelledby="messages-title">
      <div className="card-title">
        <div>
          <h2 id="messages-title"><MessageSquare size={18} strokeWidth={2} aria-hidden="true" /> Messages from JURICHEST</h2>
          <p>{unread > 0 ? `${unread} unread message${unread === 1 ? "" : "s"}` : "You are all caught up"} · service updates, billing notices and route changes</p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              mine.filter((message) => !message.read).forEach((message) => onRead(message.id));
              toast.success("All messages marked as read");
            }}
          >
            <Check size={15} /> Mark all read
          </button>
        )}
      </div>
      {mine.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No messages yet"
          body="Notices from the JURICHEST team — schedule changes, payment confirmations and service updates — will land here."
        />
      ) : (
        <ul className="message-list">
          {mine.map((message) => {
            const isOpen = expanded === message.id;
            return (
              <li key={message.id} className={`message-item ${message.read ? "" : "is-unread"} ${isOpen ? "is-open" : ""}`}>
                <button type="button" className="message-toggle" onClick={() => toggle(message)} aria-expanded={isOpen}>
                  <span className="message-dot" aria-hidden="true" />
                  <span className="message-heads">
                    <strong>{message.subject}</strong>
                    <span>{formatDateTime(message.createdAt)}{message.read ? "" : " · New"}</span>
                  </span>
                  <ChevronRight className="message-chevron" size={18} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="message-body">
                    <p>{message.body}</p>
                    <span className="message-sender"><BrandMark small /> JURICHEST service team</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="history-footnote"><Info size={13} /> Need a reply? Call {COMPANY.phones[0]} or chat on WhatsApp — messages here are one-way notices from the team.</p>
    </section>
  );
}

function AccountView({ customer }: { customer: Customer }) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
  }, [customer.name, customer.phone, customer.email]);

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (name.trim().length < 3) { setProfileError("Enter your full name (at least 3 characters)."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setProfileError("Enter a valid email address, e.g. name@example.com."); return; }
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10 || digits.length > 14) { setProfileError("Enter a valid Nigerian phone number, e.g. 08012345678."); return; }
    setSaving(true);
    setProfileError(null);
    try {
      updateCustomer(customer.id, { name: name.trim(), phone: phone.trim(), email: email.trim() });
      toast.success("Profile updated", { description: "Your contact details were saved to this browser's demo records." });
    } finally {
      setSaving(false);
    }
  }

  function savePassword(event: FormEvent) {
    event.preventDefault();
    if (changing) return;
    if (!current) { setPasswordError("Enter your current password."); return; }
    if (next.length < 6) { setPasswordError("The new password must be at least 6 characters."); return; }
    if (next !== confirm) { setPasswordError("The new password and confirmation do not match."); return; }
    setChanging(true);
    setPasswordError(null);
    try {
      const ok = changePassword(customer.id, current, next);
      if (!ok) {
        setPasswordError("That current password is incorrect, or the new password is under 6 characters.");
        toast.error("Password not changed");
        return;
      }
      toast.success("Password changed", { description: "Use the new password next time you sign in on this browser." });
      setCurrent(""); setNext(""); setConfirm("");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="account-grid">
      <section className="card card-pad account-summary" aria-labelledby="account-title">
        <div className="account-identity">
          <span className="portal-avatar is-large">{initials(customer.name)}</span>
          <div>
            <h2 id="account-title">{customer.name}</h2>
            <span className="mono account-code">{customer.accountCode}</span>
            <CopyButton value={customer.accountCode} label="Copy code" />
          </div>
        </div>
        <dl className="account-facts">
          <div><dt><MapPin size={14} /> Service address</dt><dd>{customer.street}, {customer.estate}</dd></div>
          <div><dt><Wallet size={14} /> Outstanding balance</dt><dd>{money(customer.balance)} <StatusBadge status={customer.status} /></dd></div>
          <div><dt><ReceiptText size={14} /> Monthly plan</dt><dd>{money(customer.billAmount)} / collection cycle</dd></div>
          <div><dt><CalendarDays size={14} /> Customer since</dt><dd>{formatDate(customer.joinedAt)}</dd></div>
        </dl>
        <p className="form-note"><ShieldCheck size={14} /> Your balance, plan and service address are managed by JURICHEST after receipt review — they cannot be edited here. To change your address, call {COMPANY.phones[0]}.</p>
      </section>

      <form className="card card-pad" onSubmit={saveProfile} noValidate>
        <div className="card-title">
          <div>
            <h2><UserRound size={18} strokeWidth={2} aria-hidden="true" /> Contact details</h2>
            <p>Where the team reaches you about collections and payments.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Full name" htmlFor="account-name" className="full">
            <input id="account-name" className="input" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </Field>
          <Field label="Phone number" htmlFor="account-phone">
            <input id="account-phone" className="input" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08012345678" autoComplete="tel" required />
          </Field>
          <Field label="Email address" htmlFor="account-email">
            <input id="account-email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required />
          </Field>
        </div>
        {profileError && <p className="form-error upload-error" role="alert"><CircleAlert size={15} /> {profileError}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><LoaderCircle size={16} className="spin" /> Saving…</> : <><Check size={16} /> Save changes</>}
          </button>
        </div>
      </form>

      <form className="card card-pad" onSubmit={savePassword} noValidate>
        <div className="card-title">
          <div>
            <h2><KeyRound size={18} strokeWidth={2} aria-hidden="true" /> Change password</h2>
            <p>Minimum 6 characters. Stored locally for this demo only.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field label="Current password" htmlFor="password-current" className="full">
            <span className="portal-password-wrap">
              <input id="password-current" className="input" type={showCurrent ? "text" : "password"} value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" required />
              <button type="button" className="portal-password-toggle" onClick={() => setShowCurrent((value) => !value)} aria-label={showCurrent ? "Hide current password" : "Show current password"}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </Field>
          <Field label="New password" htmlFor="password-next" hint="At least 6 characters.">
            <span className="portal-password-wrap">
              <input id="password-next" className="input" type={showNext ? "text" : "password"} value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" required />
              <button type="button" className="portal-password-toggle" onClick={() => setShowNext((value) => !value)} aria-label={showNext ? "Hide new password" : "Show new password"}>
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </Field>
          <Field label="Confirm new password" htmlFor="password-confirm">
            <input id="password-confirm" className="input" type={showNext ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required />
          </Field>
        </div>
        {passwordError && <p className="form-error upload-error" role="alert"><CircleAlert size={15} /> {passwordError}</p>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={changing}>
            {changing ? <><LoaderCircle size={16} className="spin" /> Updating…</> : <><KeyRound size={16} /> Update password</>}
          </button>
        </div>
      </form>

      <section className="card card-pad account-support">
        <div className="card-title">
          <div>
            <h2><Phone size={18} strokeWidth={2} aria-hidden="true" /> Talk to the team</h2>
            <p>Lagos Island / Lekki routes · Monday to Saturday, 8 AM – 6 PM</p>
          </div>
        </div>
        <div className="support-actions">
          <a className="btn btn-outline" href={`tel:${COMPANY.phones[0]}`}><Phone size={16} /> {COMPANY.phones[0]}</a>
          <a className="btn btn-outline" href={`tel:${COMPANY.phones[1]}`}><Phone size={16} /> {COMPANY.phones[1]}</a>
          <a className="btn btn-lime" href={COMPANY.whatsapp} target="_blank" rel="noreferrer"><MessageSquare size={16} /> WhatsApp us <ArrowUpRight size={15} /></a>
          <a className="btn btn-ghost" href={`mailto:${COMPANY.email}`}><Mail size={16} /> {COMPANY.email}</a>
        </div>
      </section>
    </div>
  );
}

export default function Portal({ navigate }: { navigate: (path: string) => void }) {
  const session = useSession();
  const data = useAppData();
  useDocumentTitle("Customer portal");

  const [tab, setTab] = useState<TabId>("overview");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [highlightReceipt, setHighlightReceipt] = useState<string | null>(null);
  const [highlightReport, setHighlightReport] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const customer = session?.role === "customer"
    ? data.customers.find((item) => item.id === session.customerId && !item.deletedAt) ?? null
    : null;

  const receipts = useMemo(
    () => customer ? data.receipts.filter((receipt) => receipt.customerId === customer.id).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)) : [],
    [data.receipts, customer],
  );
  const reports = useMemo(
    () => customer ? data.reports.filter((report) => report.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [],
    [data.reports, customer],
  );
  const messages = useMemo(
    () => customer ? data.messages.filter((message) => message.customerId === customer.id) : [],
    [data.messages, customer],
  );
  const unreadCount = messages.filter((message) => !message.read).length;
  const openReports = reports.filter((report) => report.status !== "Resolved").length;
  const nextSchedule = customer ? nextScheduleFor(customer, data) : undefined;
  const mySchedules = useMemo(() => {
    if (!customer) return [];
    return activeSchedules(data)
      .filter((schedule) => schedule.date >= todayISO() && (schedule.street.toLowerCase() === customer.street.toLowerCase() || schedule.area === customer.estate))
      .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  }, [data, customer]);

  function goTo(nextTab: TabId, focusId?: string) {
    setTab(nextTab);
    window.setTimeout(() => {
      if (focusId) {
        const target = document.getElementById(focusId);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = target?.querySelector<HTMLElement>("input:not([type='file']), textarea") ?? target?.querySelector<HTMLElement>("button");
        focusable?.focus({ preventScroll: true });
      } else {
        mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 140);
  }

  function handleLogout() {
    logout();
    toast.success("Signed out", { description: "Your demo records stay in this browser." });
    navigate("/");
  }

  if (!customer) {
    return (
      <div className="portal-root portal-gate">
        <PortalToaster />
        <div className="card card-pad portal-gate-card">
          <BrandMark />
          <h1>{session?.role === "admin" ? "You are signed in as admin" : "Sign in to your customer portal"}</h1>
          <p>
            {session?.role === "admin"
              ? "This portal is for JURICHEST customers. Head to the admin console to manage customers, receipts and schedules."
              : "Your session has ended or no customer is signed in. Sign in with your email or Customer Account Code to see your balance, schedule and receipts."}
          </p>
          <DemoNotice />
          <div className="portal-gate-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate(session?.role === "admin" ? "/admin" : "/")}>
              {session?.role === "admin" ? <>Open admin console <ArrowRight size={16} /></> : <>Go to sign in <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const balanceDue = customer.balance > 0;

  return (
    <div className="portal-root">
      <PortalToaster />

      <header className="portal-header">
        <div className="portal-header-row">
          <button type="button" className="portal-brand" onClick={() => goTo("overview")} aria-label="JURICHEST customer portal — go to overview">
            <BrandMark />
            <span className="portal-brand-text">
              <strong>JURICHEST</strong>
              <span>Customer Portal</span>
            </span>
          </button>
          <div className="portal-header-actions">
            <button
              type="button"
              className="portal-bell"
              onClick={() => goTo("messages")}
              aria-label={`Messages — ${unreadCount} unread`}
            >
              <Bell size={18} strokeWidth={1.9} />
              {unreadCount > 0 && <span className="portal-bell-count">{unreadCount}</span>}
            </button>
            <button type="button" className="portal-userchip" onClick={() => goTo("account")} aria-label={`My account — ${customer.name}, ${customer.accountCode}`}>
              <span className="portal-avatar">{initials(customer.name)}</span>
              <span className="portal-userchip-text">
                <strong>{customer.name}</strong>
                <span className="mono">{customer.accountCode}</span>
              </span>
            </button>
            <button type="button" className="btn btn-outline btn-sm portal-signout" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={15} /> <span>Sign out</span>
            </button>
          </div>
        </div>

        <DemoNotice />

        <nav className="portal-tabs" aria-label="Portal sections">
          {TABS.map(({ id, short, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`portal-tab ${tab === id ? "is-active" : ""}`}
              onClick={() => goTo(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{short}</span>
              {id === "messages" && unreadCount > 0 && <span className="portal-tab-badge">{unreadCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <div className="portal-layout">
        <aside className="portal-sidebar">
          <nav className="portal-nav" aria-label="Portal sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`portal-nav-item ${tab === id ? "is-active" : ""}`}
                onClick={() => goTo(id)}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{label}</span>
                {id === "messages" && unreadCount > 0 && <span className="portal-nav-badge">{unreadCount}</span>}
                {id === "missed" && openReports > 0 && <span className="portal-nav-badge is-amber">{openReports}</span>}
                {tab === id && <ChevronRight className="portal-nav-arrow" size={15} aria-hidden="true" />}
              </button>
            ))}
          </nav>

          <div className="portal-side-account">
            <span className="portal-avatar">{initials(customer.name)}</span>
            <div>
              <strong>{customer.name}</strong>
              <span className="mono">{customer.accountCode}</span>
            </div>
            <StatusBadge status={customer.status} />
          </div>

          <div className="portal-side-support">
            <h3><Phone size={15} /> Need help?</h3>
            <p>Route or billing questions, Mon–Sat 8 AM – 6 PM.</p>
            <a href={`tel:${COMPANY.phones[0]}`} className="portal-side-phone">{COMPANY.phones[0]}</a>
            <a href={COMPANY.whatsapp} target="_blank" rel="noreferrer" className="btn btn-lime btn-sm btn-block">
              <MessageSquare size={15} /> Chat on WhatsApp
            </a>
          </div>

          <p className="portal-side-foot">LAWMA registered PSP · RC {COMPANY.rc}<br />Keeping Lekki clean, street by street.</p>
        </aside>

        <main className="portal-main" ref={mainRef} id="portal-main">
          <div className="portal-section" key={tab}>
            <div className="portal-section-head">
              <span className="eyebrow"><span />{TAB_TITLES[tab]}</span>
              {tab === "overview" && <h1>{greeting()}, {customer.name.split(" ")[0]}</h1>}
              {tab !== "overview" && <h1>{TAB_TITLES[tab]}</h1>}
              <p className="portal-section-sub">
                {tab === "overview" && <>{customer.street}, {customer.estate} · account <b className="mono">{customer.accountCode}</b></>}
                {tab === "payments" && <>Pay by bank transfer, upload your receipt and track every review.</>}
                {tab === "schedule" && <>Published collection routes for your street and area.</>}
                {tab === "missed" && <>Report a skipped route and follow the team's response.</>}
                {tab === "messages" && <>Notices from the JURICHEST service team.</>}
                {tab === "account" && <>Your profile, password and service details.</>}
              </p>
            </div>

            {tab === "overview" && (
              <div className="overview-stack">
                <div className="portal-stats">
                  <StatCard
                    icon={Wallet}
                    label="Outstanding balance"
                    value={money(customer.balance)}
                    detail={balanceDue ? "Payment due" : "Fully paid"}
                    tone={balanceDue ? "amber" : "green"}
                  />
                  <StatCard
                    icon={CalendarClock}
                    label="Next collection"
                    value={nextSchedule ? formatDate(nextSchedule.date, { day: "numeric", month: "short" }) : "Not published"}
                    detail={nextSchedule ? relativeDay(nextSchedule.date) : "Check schedule"}
                    tone="lime"
                  />
                  <StatCard
                    icon={ReceiptText}
                    label="Monthly plan"
                    value={money(customer.billAmount)}
                    detail="Per collection cycle"
                    tone="blue"
                  />
                  <StatCard
                    icon={Truck}
                    label="Open reports"
                    value={String(openReports)}
                    detail={openReports > 0 ? "Being followed up" : "No missed routes"}
                    tone={openReports > 0 ? "amber" : "green"}
                  />
                </div>

                <div className="overview-hero-grid">
                  <section className={`card card-pad balance-card ${balanceDue ? "is-due" : "is-clear"}`} aria-labelledby="balance-title">
                    <div className="balance-card-top">
                      <span className="balance-label" id="balance-title">Current outstanding balance</span>
                      <StatusBadge status={customer.status} />
                    </div>
                    <strong className="balance-amount">{money(customer.balance)}</strong>
                    <p className="balance-copy">
                      {balanceDue
                        ? <>Your {formatDate(todayISO(), { month: "long", year: "numeric" })} collection bill of {money(customer.billAmount)} is awaiting payment. Transfer to Providus Bank and upload the receipt.</>
                        : <>You are fully paid up — thank you for keeping {customer.estate} clean. Your next bill follows the collection cycle.</>}
                    </p>
                    <div className="balance-actions">
                      <button type="button" className="btn btn-primary" onClick={() => setInvoiceOpen(true)}>
                        <ReceiptText size={16} /> View invoice
                      </button>
                      <button type="button" className="btn btn-lime" onClick={() => goTo("payments", "upload-receipt")}>
                        <Upload size={16} /> Upload receipt
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => goTo("missed", "report-missed")}>
                        <TriangleAlert size={16} /> Report missed collection
                      </button>
                    </div>
                    <div className="balance-code">
                      <span>Pay with narration</span>
                      <b className="mono">{customer.accountCode}</b>
                      <CopyButton value={customer.accountCode} label="Copy" />
                    </div>
                  </section>

                  <section className="card card-pad next-collection-card" aria-labelledby="next-collection-title">
                    <div className="card-title">
                      <div>
                        <h2 id="next-collection-title"><Truck size={18} strokeWidth={2} aria-hidden="true" /> Next collection</h2>
                        <p>Matched to {customer.street} · {customer.estate}</p>
                      </div>
                      {nextSchedule && <span className="next-chip">{relativeDay(nextSchedule.date)}</span>}
                    </div>
                    {nextSchedule ? (
                      <div className="next-collection-details">
                        <div className="next-collection-date">
                          <strong>{formatDate(nextSchedule.date, { weekday: "long", day: "numeric", month: "long" })}</strong>
                          <span><Clock size={14} /> {nextSchedule.window}</span>
                        </div>
                        <p className="next-collection-note"><Info size={14} /> {nextSchedule.notes}</p>
                      </div>
                    ) : (
                      <p className="next-collection-note is-empty">
                        <Info size={14} /> No upcoming collection is published for your street yet. Coverage is limited to selected Lekki routes — check the schedule or call {COMPANY.phones[0]}.
                      </p>
                    )}
                    <CollectionTruck />
                    <button type="button" className="btn btn-ghost btn-sm next-collection-link" onClick={() => goTo("schedule")}>
                      Full collection schedule <ArrowRight size={15} />
                    </button>
                  </section>
                </div>

                <section className="card card-pad overview-history" aria-labelledby="recent-payments-title">
                  <div className="card-title">
                    <div>
                      <h2 id="recent-payments-title"><Banknote size={18} strokeWidth={2} aria-hidden="true" /> Recent payments</h2>
                      <p>Your latest receipts and their review status</p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => goTo("payments")}>
                      View all <ArrowRight size={15} />
                    </button>
                  </div>
                  {receipts.length === 0 ? (
                    <EmptyState
                      icon={Inbox}
                      title="No payments recorded yet"
                      body="Transfer to the Providus account with your account code as narration, then upload the receipt."
                      action={<button type="button" className="btn btn-primary btn-sm" onClick={() => goTo("payments", "upload-receipt")}><Upload size={15} /> Upload your first receipt</button>}
                    />
                  ) : (
                    <ul className="mini-history">
                      {receipts.slice(0, 4).map((receipt) => (
                        <li key={receipt.id}>
                          <span className={`mini-history-icon is-${receiptStatusLabel(receipt).toLowerCase()}`}>
                            {receiptStatusLabel(receipt) === "Paid" ? <CircleCheck size={17} /> : receiptStatusLabel(receipt) === "Declined" ? <CircleAlert size={17} /> : <Clock size={17} />}
                          </span>
                          <span className="mini-history-meta">
                            <strong>{money(receipt.amount)}</strong>
                            <span>{formatDate(receipt.uploadedAt)} · {receipt.note || receipt.fileName}</span>
                          </span>
                          <StatusBadge status={receiptStatusLabel(receipt)} />
                          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewingReceipt(receipt)} aria-label={`View receipt ${receipt.fileName}`}>
                            <Eye size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {unreadCount > 0 && (
                  <button type="button" className="card unread-nudge" onClick={() => goTo("messages")}>
                    <span className="unread-nudge-icon"><Bell size={18} /></span>
                    <span>
                      <strong>{unreadCount} unread message{unreadCount === 1 ? "" : "s"} from the team</strong>
                      <span>{messages.find((message) => !message.read)?.subject}</span>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            )}

            {tab === "payments" && (
              <div className="payments-stack">
                <div className="payments-top-grid">
                  <HowToPayCard customer={customer} />
                  <div className="payments-side">
                    <section className="card card-pad invoice-cta">
                      <span className="invoice-cta-icon"><ReceiptText size={22} strokeWidth={1.8} /></span>
                      <h2>Your {formatDate(todayISO(), { month: "long" })} invoice</h2>
                      <p>{balanceDue ? `${money(customer.balance)} due` : "Fully paid"} · account <b className="mono">{customer.accountCode}</b></p>
                      <button type="button" className="btn btn-primary btn-block" onClick={() => setInvoiceOpen(true)}>
                        <ReceiptText size={16} /> View invoice
                      </button>
                      <button type="button" className="btn btn-outline btn-block" onClick={() => { setInvoiceOpen(true); window.setTimeout(() => window.print(), 350); }}>
                        <Printer size={16} /> Print / save invoice
                      </button>
                      <span className="invoice-cta-hint"><Smartphone size={13} /> On mobile, use Share → Print → Save as PDF.</span>
                    </section>
                    <UploadReceiptForm
                      customer={customer}
                      onUploaded={(receipt) => {
                        setHighlightReceipt(receipt.id);
                        window.setTimeout(() => setHighlightReceipt(null), 4000);
                      }}
                    />
                  </div>
                </div>
                <PaymentHistory receipts={receipts} onOpenReceipt={setViewingReceipt} highlightId={highlightReceipt} />
              </div>
            )}

            {tab === "schedule" && (
              <div className="schedule-stack">
                <p className="form-note coverage-note">
                  <MapPin size={15} />
                  <span>
                    <b>Limited coverage:</b> JURICHEST currently serves {SERVICE_AREAS.join(", ")}. Schedules below match your street or area only. If your street is missing, call <a href={`tel:${COMPANY.phones[0]}`}>{COMPANY.phones[0]}</a> to confirm coverage before paying.
                  </span>
                </p>
                {mySchedules.length === 0 ? (
                  <section className="card">
                    <EmptyState
                      icon={CalendarDays}
                      title="No upcoming collections published"
                      body={`Nothing is scheduled yet for ${customer.street} or ${customer.estate}. Routes are published ahead of each cycle — check back soon or call the team.`}
                      action={<a className="btn btn-outline btn-sm" href={`tel:${COMPANY.phones[0]}`}><Phone size={15} /> Call {COMPANY.phones[0]}</a>}
                    />
                  </section>
                ) : (
                  <div className="schedule-grid">
                    {mySchedules.map((schedule, index) => (
                      <article key={schedule.id} className={`card schedule-card ${index === 0 ? "is-next" : ""}`}>
                        <div className="schedule-card-date">
                          <span className="schedule-day">{formatDate(schedule.date, { day: "2-digit" })}</span>
                          <span className="schedule-month">{formatDate(schedule.date, { month: "short", year: "numeric" })}</span>
                          <span className="schedule-weekday">{formatDate(schedule.date, { weekday: "long" })}</span>
                        </div>
                        <div className="schedule-card-body">
                          <div className="schedule-card-head">
                            <h2>{schedule.street}</h2>
                            {index === 0 && <span className="next-chip">Next · {relativeDay(schedule.date)}</span>}
                          </div>
                          <span className="schedule-area"><MapPin size={13} /> {schedule.area}</span>
                          <span className="schedule-window"><Clock size={14} /> {schedule.window}</span>
                          <p className="schedule-notes">{schedule.notes}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <p className="history-footnote"><Info size={13} /> Put bins out before the window starts. Trucks may arrive any time within the window depending on traffic and route order.</p>
              </div>
            )}

            {tab === "missed" && (
              <div className="missed-stack">
                <ReportForm
                  customer={customer}
                  onReported={(report) => {
                    setHighlightReport(report.id);
                    window.setTimeout(() => setHighlightReport(null), 4000);
                  }}
                />
                <ReportList reports={reports} highlightId={highlightReport} />
              </div>
            )}

            {tab === "messages" && (
              <MessagesView
                customerId={customer.id}
                messages={data.messages}
                onRead={(id) => markMessageRead(id)}
              />
            )}

            {tab === "account" && <AccountView customer={customer} />}
          </div>

          <footer className="portal-footer">
            <span><BrandMark small /> JURICHEST NIG. LTD · RC {COMPANY.rc}</span>
            <span>{COMPANY.address}</span>
            <span className="portal-footer-demo"><FlaskConical size={12} /> Local demo — browser storage only</span>
          </footer>
        </main>
      </div>

      <Modal
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        wide
        title="Waste collection invoice"
        description={`Account ${customer.accountCode} · issued ${formatDate(todayISO())}`}
        className="invoice-modal"
      >
        <InvoiceDocument customer={customer} />
        <div className="form-actions invoice-modal-actions">
          <span className="invoice-print-hint">
            <Smartphone size={14} />
            On mobile: Share → Print, then choose “Save as PDF”. On desktop use the print dialog’s PDF destination.
          </span>
          <button type="button" className="btn btn-outline" onClick={() => setInvoiceOpen(false)}>
            <X size={16} /> Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print / save invoice
          </button>
        </div>
      </Modal>

      <ReceiptFileModal
        receipt={viewingReceipt}
        customer={customer}
        open={viewingReceipt !== null}
        onOpenChange={(open) => { if (!open) setViewingReceipt(null); }}
      />
    </div>
  );
}