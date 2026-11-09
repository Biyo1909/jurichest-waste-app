import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import {
  Activity as ActivityIcon, ArrowUpDown, Banknote, Bookmark, CalendarDays, CalendarPlus, Check,
  ChevronDown, ChevronUp, ClipboardList, Clock, Database, Download, ExternalLink, Eye, EyeOff,
  FileText, GripVertical, HandCoins, LayoutDashboard, ListChecks, LoaderCircle,
  LogOut, Mail, MapPin, MessageSquare, Pencil, Phone, Plus, ReceiptText, Search, Send, ShieldCheck,
  Trash2, TriangleAlert, Truck, Undo2, UserPlus, Users, Wallet, X, type LucideIcon,
} from "lucide-react";
import {
  Modal, Field, StatusBadge, EmptyState, StatCard, SampleReceipt, useDocumentTitle,
} from "../components/shared";
import {
  useAppData, activeCustomers, activeSchedules, nextScheduleFor, addCustomer, updateCustomer,
  deleteCustomer, restoreCustomer, addSchedule, updateSchedule, deleteSchedule, restoreSchedule,
  reorderSchedules, getReceiptFile, reviewReceipt, undoReceiptReview, updateReport, sendMessage,
  updateRequest, exportCustomersCsv, money, formatDate, formatDateTime, todayISO, initials, uid, logout,
  SERVICE_AREAS, type AppData, type Customer, type Schedule, type Receipt, type MissedReport,
  type ServiceRequest, type Activity, type BillingStatus, type ReportStatus,
} from "../lib/store";
import "../styles/admin.css";

type Section = "overview" | "customers" | "receipts" | "schedules" | "missed" | "requests" | "messages";
type SortKey = "name" | "accountCode" | "estate" | "balance" | "status" | "joinedAt";
type SortDir = "asc" | "desc";
type SavedView = { id: string; name: string; query: string; status: string; estate: string; sortKey: SortKey; sortDir: SortDir };
type CustomerModalState = { mode: "add" } | { mode: "edit"; id: string } | null;
type ScheduleModalState = { mode: "add" } | { mode: "edit"; id: string } | null;

const VIEWS_KEY = "jurichest.admin.customer-views.v1";

const NAV: { key: Section; label: string; icon: LucideIcon; description: string }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, description: "Live pulse of customers, billing and collections." },
  { key: "customers", label: "Customers", icon: Users, description: "Accounts, balances and portal access for every resident." },
  { key: "receipts", label: "Payment receipts", icon: ReceiptText, description: "Review uploaded bank receipts and clear balances." },
  { key: "schedules", label: "Schedules", icon: CalendarDays, description: "Publish collection routes and set the crew order." },
  { key: "missed", label: "Missed collections", icon: TriangleAlert, description: "Move missed-collection reports from open to resolved." },
  { key: "requests", label: "Service requests", icon: ClipboardList, description: "Contact-form enquiries awaiting follow-up." },
  { key: "messages", label: "Messages / activity", icon: MessageSquare, description: "Write to customers and audit everything that happens." },
];

const KIND_ICON: Record<Activity["kind"], LucideIcon> = {
  payment: Banknote, customer: Users, schedule: CalendarDays, report: TriangleAlert, message: MessageSquare, request: ClipboardList,
};

function estateOptions(customers: Customer[]) {
  return Array.from(new Set([...SERVICE_AREAS, ...customers.map((c) => c.estate)])).sort((a, b) => a.localeCompare(b));
}

function ActivityFeed({ items, limit = 8 }: { items: Activity[]; limit?: number }) {
  if (items.length === 0) {
    return <EmptyState icon={ActivityIcon} title="No activity yet" body="Actions taken in this workspace will appear here as they happen." />;
  }
  return (
    <ul className="admin-activity">
      {items.slice(0, limit).map((item) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <li key={item.id} className="admin-activity-item">
            <span className={`admin-activity-icon kind-${item.kind}`}><Icon size={15} strokeWidth={1.9} /></span>
            <div className="admin-activity-body">
              <p>{item.description}</p>
              <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onClose }: {
  open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }} title={title}>
      <div className="admin-confirm-body">{body}</div>
      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}><Trash2 size={16} />{confirmLabel}</button>
      </div>
    </Modal>
  );
}

function CustomerFormFields({ form, setForm, editing, customers, idPrefix }: {
  form: CustomerFormState; setForm: (patch: Partial<CustomerFormState>) => void; editing: boolean; customers: Customer[]; idPrefix: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="form-grid">
      <Field label="Full name" htmlFor={`${idPrefix}-name`}>
        <input id={`${idPrefix}-name`} className="input" value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. Adaeze Okafor" required />
      </Field>
      <Field label="Phone" htmlFor={`${idPrefix}-phone`}>
        <input id={`${idPrefix}-phone`} className="input" type="tel" value={form.phone} onChange={(e) => setForm({ phone: e.target.value })} placeholder="0801 234 5678" />
      </Field>
      <Field label="Email" htmlFor={`${idPrefix}-email`}>
        <input id={`${idPrefix}-email`} className="input" type="email" value={form.email} onChange={(e) => setForm({ email: e.target.value })} placeholder="resident@example.com" required />
      </Field>
      <Field label="Portal password" htmlFor={`${idPrefix}-password`} hint={editing ? "The customer signs in with this password." : "Minimum 6 characters. Share it with the customer."}>
        <div className="admin-password-wrap">
          <input id={`${idPrefix}-password`} className="input" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ password: e.target.value })} placeholder="••••••••" required />
          <button type="button" className="admin-password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
      <Field label="Account code" htmlFor={`${idPrefix}-code`} hint={editing ? "Used as the payment reference." : "Leave blank to generate automatically."}>
        <input id={`${idPrefix}-code`} className="input mono" value={form.accountCode} onChange={(e) => setForm({ accountCode: e.target.value.toUpperCase() })} placeholder="JRC-KUS-024" />
      </Field>
      <Field label="Estate / area" htmlFor={`${idPrefix}-estate`}>
        <select id={`${idPrefix}-estate`} className="select" value={form.estate} onChange={(e) => setForm({ estate: e.target.value })}>
          {estateOptions(customers).map((estate) => <option key={estate} value={estate}>{estate}</option>)}
        </select>
      </Field>
      <Field label="Street" htmlFor={`${idPrefix}-street`} className="full">
        <input id={`${idPrefix}-street`} className="input" value={form.street} onChange={(e) => setForm({ street: e.target.value })} placeholder="e.g. Kushenla Road" required />
      </Field>
      <Field label="Amount owed / balance (₦)" htmlFor={`${idPrefix}-balance`} hint="Saving a balance updates the customer portal instantly.">
        <input id={`${idPrefix}-balance`} className="input" type="number" min={0} step={500} value={form.balance} onChange={(e) => setForm({ balance: e.target.value })} required />
      </Field>
      {editing ? (
        <Field label="Billing status" htmlFor={`${idPrefix}-status`}>
          <select id={`${idPrefix}-status`} className="select" value={form.status} onChange={(e) => setForm({ status: e.target.value as BillingStatus })}>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </Field>
      ) : (
        <div className="admin-form-aside full">
          <ShieldCheck size={16} />
          <span>Status is set automatically: a zero balance means <strong>Paid</strong>, anything above means <strong>Pending</strong>.</span>
        </div>
      )}
    </div>
  );
}

type CustomerFormState = {
  name: string; phone: string; email: string; password: string; accountCode: string;
  estate: string; street: string; balance: string; status: BillingStatus;
};

function emptyCustomerForm(): CustomerFormState {
  return { name: "", phone: "", email: "", password: "", accountCode: "", estate: SERVICE_AREAS[0], street: "", balance: "15000", status: "Pending" };
}

function validateCustomerForm(form: CustomerFormState, editing: boolean): string | null {
  if (!form.name.trim()) return "Enter the customer's full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (form.password.length < 6) return "The portal password must be at least 6 characters.";
  if (!form.street.trim()) return "Enter the street the crew collects from.";
  if (editing && !form.accountCode.trim()) return "The account code cannot be empty.";
  const balance = Number(form.balance);
  if (form.balance.trim() === "" || Number.isNaN(balance) || balance < 0) return "Enter a balance of zero or more.";
  return null;
}

function AddCustomerModal({ open, onClose, customers }: { open: boolean; onClose: () => void; customers: Customer[] }) {
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validateCustomerForm(form, false);
    if (problem) { setError(problem); return; }
    const balance = Math.max(0, Number(form.balance));
    const created = addCustomer({
      name: form.name, email: form.email, phone: form.phone, password: form.password,
      estate: form.estate, street: form.street, balance,
      accountCode: form.accountCode.trim() || undefined, billAmount: balance,
    });
    toast.success(`${created.name} added`, { description: `Account ${created.accountCode} can now sign in to the portal.` });
    setForm(emptyCustomerForm());
    setError("");
    onClose();
  }
  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) { setError(""); onClose(); } }} title="Add customer" description="Create a portal account and opening balance for a resident.">
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <CustomerFormFields form={form} setForm={(patch) => setForm((f) => ({ ...f, ...patch }))} editing={false} customers={customers} idPrefix="add-customer" />
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary"><UserPlus size={16} />Create customer</button>
        </div>
      </form>
    </Modal>
  );
}

function EditCustomerModal({ customer, onClose, customers }: { customer: Customer; onClose: () => void; customers: Customer[] }) {
  const data = useAppData();
  const [form, setForm] = useState<CustomerFormState>({
    name: customer.name, phone: customer.phone, email: customer.email, password: customer.password,
    accountCode: customer.accountCode, estate: customer.estate, street: customer.street,
    balance: String(customer.balance), status: customer.status,
  });
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const next = nextScheduleFor(customer, data);
  const receipts = data.receipts.filter((r) => r.customerId === customer.id).slice(0, 3);
  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = validateCustomerForm(form, true);
    if (problem) { setError(problem); return; }
    updateCustomer(customer.id, {
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), password: form.password,
      accountCode: form.accountCode.trim(), estate: form.estate, street: form.street.trim(),
      balance: Math.max(0, Number(form.balance)), status: form.status,
    });
    toast.success(`${form.name.trim()} updated`, { description: "Billing and profile changes are live in the customer portal." });
    onClose();
  }
  return (
    <>
      <Modal open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }} title={customer.name} description={`Account ${customer.accountCode} · joined ${formatDate(customer.joinedAt)}`} wide className="admin-edit-modal">
        <div className="admin-detail-grid">
          <aside className="admin-summary">
            <div className="admin-summary-head">
              <span className="admin-avatar admin-avatar-lg">{initials(customer.name)}</span>
              <div>
                <strong>{customer.name}</strong>
                <span className="mono">{customer.accountCode}</span>
              </div>
              <StatusBadge status={customer.status} />
            </div>
            <div className="admin-summary-balance">
              <span>Outstanding balance</span>
              <strong>{money(customer.balance)}</strong>
              <span className="muted">Monthly bill {money(customer.billAmount)}</span>
            </div>
            <div className="admin-summary-row"><MapPin size={15} /><span>{customer.street}, {customer.estate}</span></div>
            <div className="admin-summary-row"><Mail size={15} /><span className="admin-ellipsis">{customer.email}</span></div>
            <div className="admin-summary-row"><Phone size={15} /><span>{customer.phone || "No phone on file"}</span></div>
            <div className="admin-summary-next">
              <span className="admin-summary-label"><Truck size={14} />Next collection</span>
              {next ? <p><strong>{formatDate(next.date)}</strong> · {next.window}<span>{next.street}</span></p> : <p>No upcoming route for this street yet.</p>}
            </div>
            <div className="admin-summary-receipts">
              <span className="admin-summary-label"><ReceiptText size={14} />Recent receipts</span>
              {receipts.length === 0 ? <p className="muted">No receipts uploaded yet.</p> : receipts.map((r) => (
                <div key={r.id} className="admin-mini-row"><span>{money(r.amount)} · {formatDate(r.uploadedAt)}</span><StatusBadge status={r.status} /></div>
              ))}
            </div>
            <button type="button" className="btn btn-danger btn-sm btn-block" onClick={() => setConfirmDelete(true)}><Trash2 size={15} />Delete customer</button>
          </aside>
          <form onSubmit={submit} noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            <CustomerFormFields form={form} setForm={(patch) => setForm((f) => ({ ...f, ...patch }))} editing customers={customers} idPrefix="edit-customer" />
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Check size={16} />Save changes</button>
            </div>
          </form>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${customer.name}?`}
        body={<p>The account will be removed from the active customer list and hidden from the portal. Receipts and history stay in the local demo data, and you can undo right after.</p>}
        confirmLabel="Delete customer"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteCustomer(customer.id);
          setConfirmDelete(false);
          onClose();
          toast.success(`${customer.name} deleted`, {
            description: "Removed from active customers.",
            duration: 8000,
            action: { label: "Undo", onClick: () => { restoreCustomer(customer.id); toast.success(`${customer.name} restored`); } },
          });
        }}
      />
    </>
  );
}

function OverviewSection({ data, onNavigate, onAddCustomer, onOpenReceipt, onAddSchedule, onPortal }: {
  data: AppData; onNavigate: (section: Section) => void; onAddCustomer: () => void;
  onOpenReceipt: (id: string) => void; onAddSchedule: () => void; onPortal: () => void;
}) {
  const customers = activeCustomers(data);
  const schedules = activeSchedules(data);
  const pendingBills = customers.filter((c) => c.status === "Pending");
  const outstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const upcoming = schedules.filter((s) => s.date >= todayISO());
  const nextUp = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0];
  const pendingReceipts = data.receipts.filter((r) => r.status === "Pending");
  const byEstate = useMemo(() => {
    const groups = new Map<string, number>();
    customers.forEach((c) => { if (c.balance > 0) groups.set(c.estate, (groups.get(c.estate) ?? 0) + c.balance); });
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [customers]);
  const maxEstate = byEstate.length > 0 ? byEstate[0][1] : 1;
  const quickActions: { label: string; icon: LucideIcon; run: () => void }[] = [
    { label: "Add customer", icon: UserPlus, run: onAddCustomer },
    { label: "Review receipts", icon: ReceiptText, run: () => onNavigate("receipts") },
    { label: "Publish schedule", icon: CalendarPlus, run: onAddSchedule },
    { label: "Send a message", icon: Send, run: () => onNavigate("messages") },
    { label: "Export customers", icon: Download, run: () => { exportCustomersCsv(customers); toast.success("Customer CSV exported"); } },
    { label: "Customer portal", icon: ExternalLink, run: onPortal },
  ];
  return (
    <div className="admin-section">
      <div className="admin-stats">
        <StatCard icon={Users} label="Total Customers" value={String(customers.length)} detail={`${customers.filter((c) => c.status === "Paid").length} paid up`} tone="green" />
        <StatCard icon={FileText} label="Pending Bills" value={String(pendingBills.length)} detail="accounts awaiting payment" tone="amber" />
        <StatCard icon={Wallet} label="Total Outstanding" value={money(outstanding)} detail="across all active accounts" tone="blue" />
        <StatCard icon={CalendarDays} label="Upcoming Schedules" value={String(upcoming.length)} detail={nextUp ? `next: ${formatDate(nextUp.date, { day: "numeric", month: "short" })}` : "no routes ahead"} tone="lime" />
        <StatCard icon={HandCoins} label="Pending Receipts" value={String(pendingReceipts.length)} detail={money(pendingReceipts.reduce((s, r) => s + r.amount, 0)) + " claimed"} tone="amber" />
      </div>

      <div className="admin-overview-grid">
        <div className="admin-overview-main">
          <section className="card admin-panel">
            <div className="admin-panel-head">
              <div><h2>Receipt review queue</h2><p>Uploaded payments waiting for verification.</p></div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("receipts")}>View all<ChevronDown size={15} className="admin-rotate-270" /></button>
            </div>
            {pendingReceipts.length === 0 ? (
              <EmptyState icon={Check} title="Queue is clear" body="Every uploaded receipt has been reviewed. New uploads will land here." />
            ) : (
              <ul className="admin-queue">
                {pendingReceipts.slice(0, 4).map((receipt) => {
                  const customer = data.customers.find((c) => c.id === receipt.customerId);
                  return (
                    <li key={receipt.id} className="admin-queue-item">
                      <span className="admin-avatar">{initials(customer?.name ?? "?")}</span>
                      <div className="admin-queue-body">
                        <strong>{customer?.name ?? "Unknown customer"}</strong>
                        <span>{money(receipt.amount)} · ref <span className="mono">{receipt.reference}</span> · {formatDateTime(receipt.uploadedAt)}</span>
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenReceipt(receipt.id)}>Review</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card admin-panel">
            <div className="admin-panel-head">
              <div><h2>Recent activity</h2><p>The latest moves across the workspace.</p></div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("messages")}>Full log<ChevronDown size={15} className="admin-rotate-270" /></button>
            </div>
            <ActivityFeed items={data.activity} limit={6} />
          </section>
        </div>

        <div className="admin-overview-side">
          <section className="card admin-panel">
            <div className="admin-panel-head"><div><h2>Quick actions</h2><p>Jump straight into the common jobs.</p></div></div>
            <div className="admin-quick">
              {quickActions.map((action) => (
                <button key={action.label} type="button" className="admin-quick-tile" onClick={action.run}>
                  <action.icon size={18} strokeWidth={1.9} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card admin-panel">
            <div className="admin-panel-head"><div><h2>Outstanding by estate</h2><p>Where the pending money lives.</p></div></div>
            {byEstate.length === 0 ? (
              <p className="muted admin-small-note">No outstanding balances. Every active account is paid up.</p>
            ) : (
              <div className="admin-bars">
                {byEstate.map(([estate, amount], index) => (
                  <div key={estate} className="admin-bar-row">
                    <div className="admin-bar-label"><span>{estate}</span><strong>{money(amount)}</strong></div>
                    <div className="admin-bar-track"><span className={`admin-bar-fill bar-hue-${index % 6}`} style={{ width: `${Math.max(6, (amount / maxEstate) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="admin-demo-note">
            <Database size={16} />
            <p><strong>Persistent local demo data.</strong> Everything you change is saved in this browser only — no server is contacted. Clearing site data resets the workspace.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersSection({ data, onAdd, onEdit }: { data: AppData; onAdd: () => void; onEdit: (id: string) => void }) {
  const customers = activeCustomers(data);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [estate, setEstate] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [views, setViews] = useState<SavedView[]>(() => {
    try {
      const raw = localStorage.getItem(VIEWS_KEY);
      const parsed = raw ? JSON.parse(raw) as SavedView[] : [];
      const keys: SortKey[] = ["name", "accountCode", "estate", "balance", "status", "joinedAt"];
      return Array.isArray(parsed) ? parsed.filter((v) => v && typeof v.name === "string" && typeof v.query === "string" && typeof v.status === "string" && typeof v.estate === "string" && keys.includes(v.sortKey) && (v.sortDir === "asc" || v.sortDir === "desc")) : [];
    } catch { return []; }
  });
  const [saveViewOpen, setSaveViewOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [viewError, setViewError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const headCheckbox = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(VIEWS_KEY, JSON.stringify(views)); } catch { return; }
  }, [views]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = customers.filter((c) => {
      const matchesQuery = !q || [c.name, c.accountCode, c.email, c.estate, c.street].some((value) => value.toLowerCase().includes(q));
      return matchesQuery && (status === "All" || c.status === status) && (estate === "All" || c.estate === estate);
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      if (sortKey === "balance") return (a.balance - b.balance) * dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
  }, [customers, query, status, estate, sortKey, sortDir]);

  const selectedCustomers = customers.filter((c) => selected.has(c.id));
  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const someSelected = filtered.some((c) => selected.has(c.id));
  useEffect(() => {
    if (headCheckbox.current) headCheckbox.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }
  function toggleRow(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }
  function applyView(view: SavedView) {
    setQuery(view.query); setStatus(view.status); setEstate(view.estate); setSortKey(view.sortKey); setSortDir(view.sortDir);
    toast.info(`View “${view.name}” applied`);
  }
  function saveView(e: FormEvent) {
    e.preventDefault();
    const name = viewName.trim();
    if (!name) { setViewError("Give the view a name."); return; }
    if (views.some((v) => v.name.toLowerCase() === name.toLowerCase())) { setViewError("A view with that name already exists."); return; }
    setViews((prev) => [...prev, { id: uid("view"), name, query, status, estate, sortKey, sortDir }]);
    toast.success(`View “${name}” saved`, { description: "Saved views persist in this browser." });
    setViewName(""); setViewError(""); setSaveViewOpen(false);
  }
  function exportCsv() {
    const rows = selectedCustomers.length > 0 ? selectedCustomers : filtered;
    exportCustomersCsv(rows);
    toast.success(`${rows.length} customer${rows.length === 1 ? "" : "s"} exported to CSV`);
  }
  const sortHeader = (key: SortKey, label: string, numeric = false) => (
    <th className={numeric ? "num" : undefined}>
      <button type="button" className={`admin-sort-btn ${sortKey === key ? "is-sorted" : ""}`} onClick={() => toggleSort(key)}>
        {label}
        {sortKey === key ? (sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : <ArrowUpDown size={12} />}
      </button>
    </th>
  );
  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, code, email or estate…" aria-label="Search customers" />
        </div>
        <select className="select admin-filter-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option><option value="Pending">Pending</option><option value="Paid">Paid</option>
        </select>
        <select className="select admin-filter-select" value={estate} onChange={(e) => setEstate(e.target.value)} aria-label="Filter by estate">
          <option value="All">All estates</option>
          {estateOptions(customers).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setViewName(""); setViewError(""); setSaveViewOpen(true); }}><Bookmark size={15} />Save view</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}><Download size={15} />Export CSV</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={16} />Add customer</button>
      </div>

      {views.length > 0 && (
        <div className="admin-chips" aria-label="Saved views">
          <span className="admin-chips-label"><Bookmark size={13} />Saved views</span>
          {views.map((view) => (
            <span key={view.id} className="admin-view-chip">
              <button type="button" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" aria-label={`Delete view ${view.name}`} onClick={() => { setViews((prev) => prev.filter((v) => v.id !== view.id)); toast.info(`View “${view.name}” removed`); }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}

      {selectedCustomers.length > 0 && (
        <div className="admin-bulkbar" role="status">
          <span><ListChecks size={16} />{selectedCustomers.length} selected</span>
          <div className="admin-bulkbar-actions">
            <button type="button" className="btn btn-lime btn-sm" onClick={exportCsv}><Download size={15} />Export selected</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setBulkDeleteOpen(true)}><Trash2 size={15} />Delete selected</button>
            <button type="button" className="btn btn-ghost btn-sm admin-bulkbar-clear" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title={customers.length === 0 ? "No customers yet" : "No matches"} body={customers.length === 0 ? "Add your first resident account to start billing and scheduling collections." : "Try a different search term or clear the status and estate filters."} action={<button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={15} />Add customer</button>} />
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table admin-customers-table">
            <thead>
              <tr>
                <th className="admin-check-col"><input ref={headCheckbox} type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all filtered customers" /></th>
                {sortHeader("name", "Customer")}
                {sortHeader("accountCode", "Code")}
                {sortHeader("estate", "Estate / street")}
                {sortHeader("balance", "Balance", true)}
                {sortHeader("status", "Status")}
                {sortHeader("joinedAt", "Joined")}
                <th aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className={selected.has(customer.id) ? "admin-row-selected" : undefined}>
                  <td className="admin-check-col"><input type="checkbox" checked={selected.has(customer.id)} onChange={() => toggleRow(customer.id)} aria-label={`Select ${customer.name}`} /></td>
                  <td>
                    <button type="button" className="admin-customer-cell" onClick={() => onEdit(customer.id)}>
                      <span className="admin-avatar admin-avatar-sm">{initials(customer.name)}</span>
                      <span><span className="table-primary">{customer.name}</span><span className="table-secondary admin-ellipsis">{customer.email}</span></span>
                    </button>
                  </td>
                  <td className="mono">{customer.accountCode}</td>
                  <td><span className="table-primary admin-estate-name">{customer.estate}</span><span className="table-secondary">{customer.street}</span></td>
                  <td className="num"><strong className={customer.balance > 0 ? "admin-balance-due" : "admin-balance-clear"}>{money(customer.balance)}</strong></td>
                  <td><StatusBadge status={customer.status} /></td>
                  <td className="muted">{formatDate(customer.joinedAt, { day: "numeric", month: "short", year: "2-digit" })}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button type="button" className="admin-icon-btn" onClick={() => onEdit(customer.id)} aria-label={`Edit ${customer.name}`}><Pencil size={15} /></button>
                      <button type="button" className="admin-icon-btn admin-icon-danger" onClick={() => setDeleteTarget(customer)} aria-label={`Delete ${customer.name}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-table-foot muted">{filtered.length} of {customers.length} active customers · balances update the customer portal immediately.</p>

      <Modal open={saveViewOpen} onOpenChange={(next) => { if (!next) setSaveViewOpen(false); }} title="Save current view" description="Store this search, filters and sorting under a name. Views persist in this browser.">
        <form onSubmit={saveView}>
          {viewError && <div className="form-error" role="alert">{viewError}</div>}
          <Field label="View name" htmlFor="view-name">
            <input id="view-name" className="input" value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="e.g. Ikate pending" autoFocus />
          </Field>
          <div className="admin-view-preview muted">
            Search “{query || "—"}” · {status} · {estate} · sorted by {sortKey} ({sortDir})
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setSaveViewOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Bookmark size={15} />Save view</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name ?? "customer"}?`}
        body={<p>This removes the account from the active list and the portal. You can undo from the toast right after.</p>}
        confirmLabel="Delete customer"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          if (!target) return;
          deleteCustomer(target.id);
          setSelected((prev) => { const next = new Set(prev); next.delete(target.id); return next; });
          setDeleteTarget(null);
          toast.success(`${target.name} deleted`, { duration: 8000, action: { label: "Undo", onClick: () => { restoreCustomer(target.id); toast.success(`${target.name} restored`); } } });
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedCustomers.length} customers?`}
        body={<p>The selected accounts will be removed from the active list. One undo will bring all of them back.</p>}
        confirmLabel="Delete selected"
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          const targets = [...selectedCustomers];
          targets.forEach((c) => deleteCustomer(c.id));
          setSelected(new Set());
          setBulkDeleteOpen(false);
          toast.success(`${targets.length} customers deleted`, {
            duration: 9000,
            action: { label: "Undo", onClick: () => { targets.forEach((c) => restoreCustomer(c.id)); toast.success(`${targets.length} customers restored`); } },
          });
        }}
      />
    </div>
  );
}

function ReceiptFilePreview({ receipt }: { receipt: Receipt }) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "missing" | "error"; url: string }>({ status: "loading", url: "" });
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setState({ status: "loading", url: "" });
    getReceiptFile(receipt.id).then((blob) => {
      if (cancelled) return;
      if (!blob) { setState({ status: "missing", url: "" }); return; }
      objectUrl = URL.createObjectURL(blob);
      setState({ status: "ready", url: objectUrl });
    }).catch(() => { if (!cancelled) setState({ status: "error", url: "" }); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [receipt.id]);

  if (state.status === "loading") {
    return <div className="admin-file-state"><LoaderCircle size={22} className="spin" /><p>Loading the uploaded file from local storage…</p></div>;
  }
  if (state.status !== "ready") {
    return (
      <div className="admin-file-state">
        <FileText size={24} />
        <p>{state.status === "missing" ? "The original file is not in this browser's local storage." : "The uploaded file could not be read."}</p>
        <span className="muted">Metadata below is still reviewable. Ask the customer to re-upload if you need the document.</span>
      </div>
    );
  }
  const isImage = receipt.fileType.startsWith("image/");
  const isPdf = receipt.fileType === "application/pdf";
  return (
    <div className="admin-file-preview">
      {isImage ? <img className="admin-file-image" src={state.url} alt={`Uploaded receipt ${receipt.fileName}`} />
        : isPdf ? <iframe className="admin-file-frame" src={state.url} title={`Uploaded receipt ${receipt.fileName}`} />
          : <div className="admin-file-state"><FileText size={24} /><p>No inline preview for {receipt.fileType || "this file type"}.</p></div>}
      <a className="btn btn-outline btn-sm" href={state.url} download={receipt.fileName}><Download size={15} />Download {receipt.fileName}</a>
    </div>
  );
}

function ReceiptModal({ receiptId, data, onClose }: { receiptId: string; data: AppData; onClose: () => void }) {
  const receipt = data.receipts.find((r) => r.id === receiptId);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!receipt) return null;
  const customer = data.customers.find((c) => c.id === receipt.customerId);
  function decide(decision: "Approved" | "Declined") {
    if (decision === "Declined" && !note.trim()) { setError("A review note is required when declining a receipt."); return; }
    const snapshot = reviewReceipt(receiptId, decision, note.trim());
    if (!snapshot) { toast.error("This receipt has already been reviewed."); return; }
    setError("");
    if (decision === "Approved") {
      toast.success(`Receipt approved — ${customer?.name ?? "customer"} marked Paid`, {
        description: "Outstanding balance cleared in the portal.",
        duration: 9000,
        action: { label: "Undo", onClick: () => { undoReceiptReview(snapshot); toast.info("Receipt review undone"); } },
      });
    } else {
      toast.warning("Receipt declined", {
        description: note.trim(),
        duration: 9000,
        action: { label: "Undo", onClick: () => { undoReceiptReview(snapshot); toast.info("Receipt review undone"); } },
      });
    }
  }
  return (
    <Modal open onOpenChange={(next) => { if (!next) onClose(); }} title="Payment receipt" description={`${customer?.name ?? "Unknown customer"} · ${receipt.fileName}`} wide>
      <div className="admin-receipt-grid">
        <div className="admin-receipt-doc">
          {receipt.sample ? <SampleReceipt receipt={receipt} customer={customer} /> : <ReceiptFilePreview receipt={receipt} />}
        </div>
        <div className="admin-receipt-meta">
          <div className="admin-receipt-amount">
            <span>Amount claimed</span>
            <strong>{money(receipt.amount)}</strong>
            <StatusBadge status={receipt.status} />
          </div>
          <dl className="admin-meta-list">
            <div><dt>Customer</dt><dd>{customer?.name ?? "Unknown"}<span className="mono">{customer?.accountCode}</span></dd></div>
            <div><dt>Reference</dt><dd className="mono">{receipt.reference}</dd></div>
            <div><dt>Uploaded</dt><dd>{formatDateTime(receipt.uploadedAt)}</dd></div>
            <div><dt>Customer note</dt><dd>{receipt.note || "—"}</dd></div>
            {receipt.reviewedAt && <div><dt>Reviewed</dt><dd>{formatDateTime(receipt.reviewedAt)}</dd></div>}
            {receipt.reviewNote && <div><dt>Review note</dt><dd>{receipt.reviewNote}</dd></div>}
          </dl>
          {receipt.status === "Pending" ? (
            <div className="admin-review-box">
              {error && <div className="form-error" role="alert">{error}</div>}
              <Field label="Review note" htmlFor="review-note" hint="Required when declining; optional when approving.">
                <textarea id="review-note" className="textarea admin-review-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Transfer confirmed on Providus statement…" />
              </Field>
              <div className="admin-review-actions">
                <button type="button" className="btn btn-primary" onClick={() => decide("Approved")}><Check size={16} />Approve &amp; clear balance</button>
                <button type="button" className="btn btn-danger" onClick={() => decide("Declined")}><X size={16} />Decline</button>
              </div>
              <p className="admin-small-note muted">Approving sets the customer's balance to zero and marks them Paid. Every decision can be undone from its toast.</p>
            </div>
          ) : (
            <div className="form-note admin-reviewed-note"><ShieldCheck size={15} />This receipt was {receipt.status.toLowerCase()}{receipt.reviewedAt ? ` on ${formatDate(receipt.reviewedAt)}` : ""}. The decision is locked in the local demo log.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ReceiptsSection({ data, onOpen }: { data: AppData; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<"Pending" | "All">("Pending");
  const [query, setQuery] = useState("");
  const pendingCount = data.receipts.filter((r) => r.status === "Pending").length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.receipts
      .filter((r) => (filter === "All" || r.status === "Pending"))
      .filter((r) => {
        if (!q) return true;
        const customer = data.customers.find((c) => c.id === r.customerId);
        return [customer?.name ?? "", customer?.accountCode ?? "", r.reference, r.fileName].some((v) => v.toLowerCase().includes(q));
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [data.receipts, data.customers, filter, query]);
  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-segmented" role="tablist" aria-label="Receipt filter">
          <button type="button" role="tab" aria-selected={filter === "Pending"} className={filter === "Pending" ? "is-active" : ""} onClick={() => setFilter("Pending")}>Pending{pendingCount > 0 && <span className="admin-seg-count">{pendingCount}</span>}</button>
          <button type="button" role="tab" aria-selected={filter === "All"} className={filter === "All" ? "is-active" : ""} onClick={() => setFilter("All")}>All receipts</button>
        </div>
        <div className="admin-search">
          <Search size={16} />
          <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, reference or file…" aria-label="Search receipts" />
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <EmptyState icon={ReceiptText} title={filter === "Pending" ? "No receipts awaiting review" : "No receipts found"} body={filter === "Pending" ? "The queue is clear. Receipts customers upload from the portal will appear here." : "Try a different search term."} />
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table admin-receipts-table">
            <thead><tr><th>Customer</th><th className="num">Amount</th><th>Reference</th><th>Uploaded</th><th>Status</th><th aria-label="Open receipt" /></tr></thead>
            <tbody>
              {rows.map((receipt) => {
                const customer = data.customers.find((c) => c.id === receipt.customerId);
                return (
                  <tr key={receipt.id}>
                    <td>
                      <span className="table-primary">{customer?.name ?? "Unknown customer"}</span>
                      <span className="table-secondary">{receipt.fileName}{receipt.sample ? " · sample" : ""}</span>
                    </td>
                    <td className="num"><strong>{money(receipt.amount)}</strong></td>
                    <td className="mono">{receipt.reference}</td>
                    <td className="muted">{formatDateTime(receipt.uploadedAt)}</td>
                    <td><StatusBadge status={receipt.status} /></td>
                    <td><button type="button" className={`btn btn-sm ${receipt.status === "Pending" ? "btn-primary" : "btn-outline"}`} onClick={() => onOpen(receipt.id)}>{receipt.status === "Pending" ? "Review" : "View"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-table-foot muted">{rows.length} receipt{rows.length === 1 ? "" : "s"} shown · uploads are stored locally in this browser (IndexedDB).</p>
    </div>
  );
}

function ScheduleModal({ state, data, onClose }: { state: NonNullable<ScheduleModalState>; data: AppData; onClose: () => void }) {
  const editing = state.mode === "edit" ? data.schedules.find((s) => s.id === state.id) : undefined;
  const [form, setForm] = useState({
    area: editing?.area ?? SERVICE_AREAS[0], street: editing?.street ?? "",
    date: editing?.date ?? todayISO(), window: editing?.window ?? "8:00 AM – 12:00 PM", notes: editing?.notes ?? "",
  });
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.street.trim()) { setError("Enter the street for this route."); return; }
    if (!form.date) { setError("Pick a collection date."); return; }
    if (!form.window.trim()) { setError("Enter the collection time window."); return; }
    if (editing) {
      updateSchedule(editing.id, { ...form, street: form.street.trim(), window: form.window.trim() });
      toast.success(`Schedule updated for ${form.street.trim()}`);
    } else {
      addSchedule({ ...form, street: form.street.trim(), window: form.window.trim() });
      toast.success(`Collection published for ${form.street.trim()}`, { description: "Customers on this street see it in their portal." });
    }
    onClose();
  }
  return (
    <Modal open onOpenChange={(next) => { if (!next) onClose(); }} title={editing ? "Edit schedule" : "Publish a collection"} description="Routes appear in the customer portal for matching streets and estates.">
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-grid">
          <Field label="Area / estate" htmlFor="sched-area">
            <select id="sched-area" className="select" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}>
              {SERVICE_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </Field>
          <Field label="Street" htmlFor="sched-street">
            <input id="sched-street" className="input" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} placeholder="e.g. Kushenla Road" required />
          </Field>
          <Field label="Collection date" htmlFor="sched-date">
            <input id="sched-date" className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </Field>
          <Field label="Time window" htmlFor="sched-window">
            <input id="sched-window" className="input" value={form.window} onChange={(e) => setForm((f) => ({ ...f, window: e.target.value }))} placeholder="8:00 AM – 12:00 PM" required />
          </Field>
          <Field label="Notes for residents" htmlFor="sched-notes" className="full">
            <textarea id="sched-notes" className="textarea" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Please have bins out by 8:00 AM." />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary"><CalendarPlus size={16} />{editing ? "Save schedule" : "Publish schedule"}</button>
        </div>
      </form>
    </Modal>
  );
}

function SchedulesSection({ data, onAdd, onEdit }: { data: AppData; onAdd: () => void; onEdit: (id: string) => void }) {
  const schedules = activeSchedules(data);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const today = todayISO();
  function move(id: string, delta: number) {
    const ids = schedules.map((s) => s.id);
    const index = ids.indexOf(id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    ids.splice(index, 1);
    ids.splice(target, 0, id);
    reorderSchedules(ids);
  }
  function drop(targetId: string) {
    if (dragId && dragId !== targetId) {
      const ids = schedules.map((s) => s.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragId);
        reorderSchedules(ids);
      }
    }
    setDragId(null); setOverId(null);
  }
  function dragProps(schedule: Schedule) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => { setDragId(schedule.id); e.dataTransfer.effectAllowed = "move"; },
      onDragOver: (e: DragEvent) => { e.preventDefault(); setOverId(schedule.id); },
      onDragLeave: () => setOverId((current) => (current === schedule.id ? null : current)),
      onDrop: (e: DragEvent) => { e.preventDefault(); drop(schedule.id); },
      onDragEnd: () => { setDragId(null); setOverId(null); },
    };
  }
  return (
    <div className="admin-section">
      <div className="admin-toolbar admin-toolbar-split">
        <p className="muted admin-toolbar-note"><GripVertical size={15} />Drag rows to set the crew order on desktop, or use the arrows. Customers see this order in the portal.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={16} />Add schedule</button>
      </div>
      {schedules.length === 0 ? (
        <div className="card">
          <EmptyState icon={CalendarDays} title="No collection schedules" body="Publish a route so residents know when to put their bins out." action={<button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={15} />Add schedule</button>} />
        </div>
      ) : (
        <ol className="admin-schedule-list">
          {schedules.map((schedule, index) => (
            <li
              key={schedule.id}
              className={`admin-schedule-row card ${dragId === schedule.id ? "is-dragging" : ""} ${overId === schedule.id && dragId !== schedule.id ? "is-drag-over" : ""} ${schedule.date < today ? "is-past" : ""}`}
              {...dragProps(schedule)}
            >
              <span className="admin-drag-handle" aria-hidden="true"><GripVertical size={17} /></span>
              <span className="admin-order-num mono">{index + 1}</span>
              <div className="admin-schedule-body">
                <div className="admin-schedule-title">
                  <strong>{schedule.street}</strong>
                  {schedule.date >= today ? <span className="admin-pill admin-pill-green">Upcoming</span> : <span className="admin-pill">Past</span>}
                </div>
                <span className="admin-schedule-area"><MapPin size={13} />{schedule.area}</span>
                {schedule.notes && <p className="admin-schedule-notes">{schedule.notes}</p>}
              </div>
              <div className="admin-schedule-when">
                <span><CalendarDays size={14} />{formatDate(schedule.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                <span><Clock size={14} />{schedule.window}</span>
              </div>
              <div className="admin-schedule-actions">
                <div className="admin-reorder">
                  <button type="button" className="admin-icon-btn" onClick={() => move(schedule.id, -1)} disabled={index === 0} aria-label={`Move ${schedule.street} up`} draggable={false}><ChevronUp size={15} /></button>
                  <button type="button" className="admin-icon-btn" onClick={() => move(schedule.id, 1)} disabled={index === schedules.length - 1} aria-label={`Move ${schedule.street} down`} draggable={false}><ChevronDown size={15} /></button>
                </div>
                <button type="button" className="admin-icon-btn" onClick={() => onEdit(schedule.id)} aria-label={`Edit ${schedule.street}`} draggable={false}><Pencil size={15} /></button>
                <button
                  type="button" className="admin-icon-btn admin-icon-danger" draggable={false}
                  aria-label={`Delete ${schedule.street}`}
                  onClick={() => {
                    deleteSchedule(schedule.id);
                    toast.success(`Schedule removed for ${schedule.street}`, {
                      duration: 8000,
                      action: { label: "Undo", onClick: () => { restoreSchedule(schedule.id); toast.success("Schedule restored"); } },
                    });
                  }}
                ><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ReportUpdateModal({ report, data, onClose }: { report: MissedReport; data: AppData; onClose: () => void }) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");
  const [error, setError] = useState("");
  const customer = data.customers.find((c) => c.id === report.customerId);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (status === "Resolved" && !note.trim()) { setError("Add an admin note explaining how this was resolved."); return; }
    updateReport(report.id, status, note.trim());
    toast.success(`Report marked ${status.toLowerCase()}`, { description: customer ? `${customer.name} · ${report.street}` : report.street });
    onClose();
  }
  return (
    <Modal open onOpenChange={(next) => { if (!next) onClose(); }} title="Update missed-collection report" description={`${customer?.name ?? "Customer"} · ${report.street} · ${formatDate(report.date)}`}>
      <form onSubmit={submit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="admin-quote">{report.note}</div>
        <div className="form-grid admin-report-form">
          <Field label="Status" htmlFor="report-status" className="full">
            <select id="report-status" className="select" value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
              <option value="Open">Open</option><option value="In review">In review</option><option value="Resolved">Resolved</option>
            </select>
          </Field>
          <Field label="Admin note" htmlFor="report-note" className="full" hint="Required when resolving. Visible in the customer's portal.">
            <textarea id="report-note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Crew rerouted on Thursday; bin collected and resident notified." />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary"><Check size={16} />Save update</button>
        </div>
      </form>
    </Modal>
  );
}

function MissedSection({ data }: { data: AppData }) {
  const [filter, setFilter] = useState<"All" | ReportStatus>("All");
  const [target, setTarget] = useState<MissedReport | null>(null);
  const reports = data.reports.filter((r) => filter === "All" || r.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const counts = { Open: data.reports.filter((r) => r.status === "Open").length, "In review": data.reports.filter((r) => r.status === "In review").length, Resolved: data.reports.filter((r) => r.status === "Resolved").length };
  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-segmented" role="tablist" aria-label="Report filter">
          {(["All", "Open", "In review", "Resolved"] as const).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={filter === option} className={filter === option ? "is-active" : ""} onClick={() => setFilter(option)}>
              {option}{option !== "All" && counts[option] > 0 && <span className="admin-seg-count">{counts[option]}</span>}
            </button>
          ))}
        </div>
      </div>
      {reports.length === 0 ? (
        <div className="card">
          <EmptyState icon={Truck} title="No reports here" body={filter === "All" ? "When a resident reports a missed collection from the portal, it lands here for follow-up." : `No reports are currently ${filter.toLowerCase()}.`} />
        </div>
      ) : (
        <div className="admin-card-list">
          {reports.map((report) => {
            const customer = data.customers.find((c) => c.id === report.customerId);
            return (
              <article key={report.id} className="card admin-report-card">
                <div className="admin-report-head">
                  <span className="admin-avatar">{initials(customer?.name ?? "?")}</span>
                  <div className="admin-report-who">
                    <strong>{customer?.name ?? "Unknown customer"}</strong>
                    <span><MapPin size={13} />{report.street} · missed {formatDate(report.date)}</span>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                <div className="admin-quote">{report.note}</div>
                {report.adminNote && <div className="admin-admin-note"><ShieldCheck size={14} /><p><strong>Admin note:</strong> {report.adminNote}</p></div>}
                <div className="admin-report-foot">
                  <time className="muted" dateTime={report.createdAt}>Reported {formatDateTime(report.createdAt)}</time>
                  <div className="admin-report-actions">
                    {report.status === "Open" && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { updateReport(report.id, "In review", report.adminNote ?? ""); toast.success("Report moved to In review"); }}>
                        <Search size={14} />Start review
                      </button>
                    )}
                    {report.status === "In review" && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setTarget({ ...report, status: "Resolved" })}><Check size={14} />Resolve</button>
                    )}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(report)}><Pencil size={14} />Update</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {target && <ReportUpdateModal key={`${target.id}-${target.status}`} report={target} data={data} onClose={() => setTarget(null)} />}
    </div>
  );
}

function RequestsSection({ data }: { data: AppData }) {
  const [filter, setFilter] = useState<"All" | ServiceRequest["status"]>("All");
  const requests = data.requests.filter((r) => filter === "All" || r.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const counts = { New: data.requests.filter((r) => r.status === "New").length, Contacted: data.requests.filter((r) => r.status === "Contacted").length, Closed: data.requests.filter((r) => r.status === "Closed").length };
  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-segmented" role="tablist" aria-label="Request filter">
          {(["All", "New", "Contacted", "Closed"] as const).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={filter === option} className={filter === option ? "is-active" : ""} onClick={() => setFilter(option)}>
              {option}{option !== "All" && counts[option] > 0 && <span className="admin-seg-count">{counts[option]}</span>}
            </button>
          ))}
        </div>
      </div>
      {requests.length === 0 ? (
        <div className="card">
          <EmptyState icon={ClipboardList} title="No service requests yet" body="Enquiries submitted through the website contact form appear here so the team can follow up and close them out." />
        </div>
      ) : (
        <div className="admin-card-list">
          {requests.map((request) => (
            <article key={request.id} className="card admin-request-card">
              <div className="admin-report-head">
                <span className="admin-avatar admin-avatar-blue">{initials(request.name)}</span>
                <div className="admin-report-who">
                  <strong>{request.name}</strong>
                  <span>{request.service} · {request.area}</span>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="admin-request-contact">
                <a href={`mailto:${request.email}`}><Mail size={13} />{request.email}</a>
                {request.phone && <a href={`tel:${request.phone}`}><Phone size={13} />{request.phone}</a>}
              </div>
              {request.message && <div className="admin-quote">{request.message}</div>}
              <div className="admin-report-foot">
                <time className="muted" dateTime={request.createdAt}>Received {formatDateTime(request.createdAt)}</time>
                <div className="admin-report-actions">
                  {request.status === "New" && <button type="button" className="btn btn-outline btn-sm" onClick={() => { updateRequest(request.id, "Contacted"); toast.success(`${request.name} marked Contacted`); }}><Phone size={14} />Mark Contacted</button>}
                  {request.status !== "Closed" && <button type="button" className="btn btn-primary btn-sm" onClick={() => { updateRequest(request.id, "Closed"); toast.success(`Request from ${request.name} closed`); }}><Check size={14} />Close</button>}
                  {request.status === "Closed" && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { updateRequest(request.id, "New"); toast.info(`Request from ${request.name} reopened`); }}><Undo2 size={14} />Reopen</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesSection({ data }: { data: AppData }) {
  const customers = activeCustomers(data);
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const recipient = customers.find((c) => c.id === customerId);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) { setError("Choose the customer to message."); return; }
    if (!subject.trim()) { setError("Add a subject."); return; }
    if (!body.trim()) { setError("Write the message body."); return; }
    sendMessage(customerId, subject.trim(), body.trim());
    toast.success(`Message sent to ${recipient?.name ?? "customer"}`, { description: "It is waiting in their portal inbox." });
    setSubject(""); setBody(""); setError("");
  }
  const recent = data.messages.slice(0, 8);
  return (
    <div className="admin-section">
      <div className="admin-messages-grid">
        <section className="card admin-panel">
          <div className="admin-panel-head"><div><h2>Send a message</h2><p>Lands directly in the customer's portal inbox.</p></div><Send size={18} className="admin-panel-glyph" /></div>
          <form onSubmit={submit} noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="admin-compose">
              <Field label="Customer" htmlFor="msg-customer">
                <select id="msg-customer" className="select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Choose an active customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.accountCode}</option>)}
                </select>
              </Field>
              <Field label="Subject" htmlFor="msg-subject">
                <input id="msg-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Your November collection is confirmed" />
              </Field>
              <Field label="Message" htmlFor="msg-body">
                <textarea id="msg-body" className="textarea admin-compose-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a clear, friendly update for the resident…" />
              </Field>
              <button type="submit" className="btn btn-primary btn-block"><Send size={16} />Send message</button>
            </div>
          </form>
          <div className="divider" />
          <h3 className="admin-subhead">Recently sent</h3>
          {recent.length === 0 ? <p className="muted admin-small-note">No messages sent yet.</p> : (
            <ul className="admin-sent">
              {recent.map((message) => {
                const customer = data.customers.find((c) => c.id === message.customerId);
                return (
                  <li key={message.id} className="admin-sent-item">
                    <div className="admin-sent-head">
                      <strong>{message.subject}</strong>
                      <span className={`admin-pill ${message.read ? "admin-pill-green" : ""}`}>{message.read ? "Read" : "Unread"}</span>
                    </div>
                    <p>{message.body}</p>
                    <span className="muted">To {customer?.name ?? "unknown customer"} · {formatDateTime(message.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="card admin-panel">
          <div className="admin-panel-head"><div><h2>Activity log</h2><p>Every mutation in this workspace, newest first.</p></div><ActivityIcon size={18} className="admin-panel-glyph" /></div>
          <ActivityFeed items={data.activity} limit={24} />
        </section>
      </div>
    </div>
  );
}

export default function Admin({ navigate }: { navigate: (path: string) => void }) {
  const data = useAppData();
  const [section, setSection] = useState<Section>("overview");
  const [customerModal, setCustomerModal] = useState<CustomerModalState>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [needsToaster, setNeedsToaster] = useState(false);
  useDocumentTitle("Admin workspace");

  useEffect(() => {
    if (!document.querySelector("[data-sonner-toaster]")) setNeedsToaster(true);
  }, []);

  const customers = activeCustomers(data);
  const pendingReceipts = data.receipts.filter((r) => r.status === "Pending").length;
  const openReports = data.reports.filter((r) => r.status !== "Resolved").length;
  const newRequests = data.requests.filter((r) => r.status === "New").length;
  const badges: Partial<Record<Section, number>> = { receipts: pendingReceipts, missed: openReports, requests: newRequests };
  const current = NAV.find((item) => item.key === section)!;
  const editingCustomer = customerModal?.mode === "edit" ? data.customers.find((c) => c.id === customerModal.id && !c.deletedAt) : undefined;

  return (
    <div className="admin-shell">
      {needsToaster && <Toaster position="top-right" richColors closeButton duration={5000} />}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark"><Truck size={21} strokeWidth={1.9} /></span>
          <div className="admin-brand-text"><strong>JURICHEST</strong><span>Admin workspace</span></div>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {NAV.map((item) => (
            <button key={item.key} type="button" className={`admin-nav-item ${section === item.key ? "is-active" : ""}`} onClick={() => setSection(item.key)} aria-current={section === item.key ? "page" : undefined}>
              <item.icon size={17} strokeWidth={1.9} />
              <span className="admin-nav-label">{item.label}</span>
              {badges[item.key] ? <span className="admin-nav-badge">{badges[item.key]}</span> : null}
            </button>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="admin-demo-chip"><Database size={13} /><span>Local demo data · this browser only</span></div>
          <div className="admin-session">
            <span className="admin-session-avatar"><ShieldCheck size={15} /></span>
            <div><strong>Administrator</strong><span>Local demo session</span></div>
            <button type="button" className="admin-icon-btn admin-icon-invert" onClick={() => { logout(); navigate("/"); }} aria-label="Sign out and exit to website"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <h1>{current.label}</h1>
            <p>{current.description}</p>
          </div>
          <div className="admin-topbar-side">
            <span className="admin-demo-chip admin-demo-chip-top"><Database size={13} />Demo data</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate("/")}><ExternalLink size={15} />View site</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { logout(); navigate("/"); }}><LogOut size={15} />Sign out</button>
          </div>
        </header>

        <main className="admin-content" key={section}>
          {section === "overview" && (
            <OverviewSection
              data={data} onNavigate={setSection}
              onAddCustomer={() => setCustomerModal({ mode: "add" })}
              onOpenReceipt={setReceiptId}
              onAddSchedule={() => setScheduleModal({ mode: "add" })}
              onPortal={() => navigate("/portal")}
            />
          )}
          {section === "customers" && <CustomersSection data={data} onAdd={() => setCustomerModal({ mode: "add" })} onEdit={(id) => setCustomerModal({ mode: "edit", id })} />}
          {section === "receipts" && <ReceiptsSection data={data} onOpen={setReceiptId} />}
          {section === "schedules" && <SchedulesSection data={data} onAdd={() => setScheduleModal({ mode: "add" })} onEdit={(id) => setScheduleModal({ mode: "edit", id })} />}
          {section === "missed" && <MissedSection data={data} />}
          {section === "requests" && <RequestsSection data={data} />}
          {section === "messages" && <MessagesSection data={data} />}
        </main>
      </div>

      {customerModal?.mode === "add" && <AddCustomerModal open onClose={() => setCustomerModal(null)} customers={customers} />}
      {editingCustomer && <EditCustomerModal key={editingCustomer.id} customer={editingCustomer} onClose={() => setCustomerModal(null)} customers={customers} />}
      {scheduleModal && <ScheduleModal key={scheduleModal.mode === "edit" ? scheduleModal.id : "add"} state={scheduleModal} data={data} onClose={() => setScheduleModal(null)} />}
      {receiptId && <ReceiptModal key={receiptId} receiptId={receiptId} data={data} onClose={() => setReceiptId(null)} />}
    </div>
  );
}