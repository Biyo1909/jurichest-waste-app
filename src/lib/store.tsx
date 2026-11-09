import { useSyncExternalStore } from "react";

export type BillingStatus = "Paid" | "Pending";
export type ReceiptStatus = "Pending" | "Approved" | "Declined";
export type ReportStatus = "Open" | "In review" | "Resolved";

export interface Customer {
  id: string;
  accountCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  estate: string;
  street: string;
  balance: number;
  billAmount: number;
  status: BillingStatus;
  joinedAt: string;
  deletedAt?: string;
}

export interface Schedule {
  id: string;
  area: string;
  street: string;
  date: string;
  window: string;
  notes: string;
  order: number;
  deletedAt?: string;
}

export interface Receipt {
  id: string;
  customerId: string;
  fileName: string;
  fileType: string;
  amount: number;
  reference: string;
  note: string;
  uploadedAt: string;
  status: ReceiptStatus;
  sample?: boolean;
  reviewNote?: string;
  reviewedAt?: string;
}

export interface MissedReport {
  id: string;
  customerId: string;
  street: string;
  date: string;
  note: string;
  status: ReportStatus;
  createdAt: string;
  adminNote?: string;
}

export interface CustomerMessage {
  id: string;
  customerId: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  service: string;
  message: string;
  createdAt: string;
  status: "New" | "Contacted" | "Closed";
}

export interface Activity {
  id: string;
  description: string;
  createdAt: string;
  customerId?: string;
  kind: "payment" | "customer" | "schedule" | "report" | "message" | "request";
}

export interface AppData {
  version: 1;
  customers: Customer[];
  schedules: Schedule[];
  receipts: Receipt[];
  reports: MissedReport[];
  messages: CustomerMessage[];
  requests: ServiceRequest[];
  activity: Activity[];
}

export type Session = { role: "admin" } | { role: "customer"; customerId: string } | null;
export type CustomerInput = Pick<Customer, "name" | "email" | "phone" | "password" | "estate" | "street" | "balance"> & { accountCode?: string; billAmount?: number };
export type ScheduleInput = Omit<Schedule, "id" | "order" | "deletedAt">;
export type ReceiptReviewSnapshot = { receipt: Receipt; customer: Customer };

export const COMPANY = {
  name: "JURICHEST NIG. LTD",
  address: "4, Kofo Abayomi Street, Victoria Island, Lagos",
  phones: ["09015268402", "07070804008"],
  email: "jurichestng@gmail.com",
  bank: "Providus Bank",
  accountNumber: "1308987486",
  accountName: "JURICHEST NIG. LTD",
  rc: "9940815",
  whatsapp: "https://wa.me/2349015268402",
};

export const SERVICE_AREAS = [
  "Ikate",
  "Kushenla / Kusenla Extension",
  "Folix Club Area",
  "Freedom Way (selected streets)",
  "Surrounding estates",
];

export const DATA_KEY = "jurichest.demo.v1";
const SESSION_KEY = "jurichest.session.v1";
const listeners = new Set<() => void>();
const sessionListeners = new Set<() => void>();

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDaysISO(days: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function money(amount: number) {
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-NG", options);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function seedData(): AppData {
  const now = new Date().toISOString();
  const customers: Customer[] = [
    { id: "c-demo", accountCode: "JRC-KUS-024", name: "Adaeze Okafor", email: "demo@jurichest.ng", phone: "08012345678", password: "demo123", estate: "Kushenla / Kusenla Extension", street: "Kushenla Road", balance: 15000, billAmount: 15000, status: "Pending", joinedAt: addDaysISO(-180) },
    { id: "c-2", accountCode: "JRC-IKT-011", name: "Tunde Bakare", email: "tunde@example.com", phone: "08023456781", password: "demo123", estate: "Ikate", street: "Ikate Elegushi Road", balance: 15000, billAmount: 15000, status: "Pending", joinedAt: addDaysISO(-150) },
    { id: "c-3", accountCode: "JRC-FOL-008", name: "Chiamaka Eze", email: "chiamaka@example.com", phone: "08034567892", password: "demo123", estate: "Folix Club Area", street: "Folix Club Close", balance: 0, billAmount: 12000, status: "Paid", joinedAt: addDaysISO(-120) },
    { id: "c-4", accountCode: "JRC-FRW-017", name: "Emeka Nwosu", email: "emeka@example.com", phone: "08045678903", password: "demo123", estate: "Freedom Way (selected streets)", street: "Freedom Way — Admiralty Link", balance: 18000, billAmount: 18000, status: "Pending", joinedAt: addDaysISO(-90) },
    { id: "c-5", accountCode: "JRC-KUS-031", name: "Fatima Bello", email: "fatima@example.com", phone: "08056789014", password: "demo123", estate: "Kushenla / Kusenla Extension", street: "Kusenla Extension Avenue", balance: 0, billAmount: 15000, status: "Paid", joinedAt: addDaysISO(-80) },
    { id: "c-6", accountCode: "JRC-EST-005", name: "Olumide Adeyemi", email: "olumide@example.com", phone: "08067890125", password: "demo123", estate: "Surrounding estates", street: "Orchid Estate Gate", balance: 25000, billAmount: 25000, status: "Pending", joinedAt: addDaysISO(-60) },
    { id: "c-7", accountCode: "JRC-IKT-019", name: "Ngozi Obi", email: "ngozi@example.com", phone: "08078901236", password: "demo123", estate: "Ikate", street: "Ikate Roundabout Close", balance: 0, billAmount: 15000, status: "Paid", joinedAt: addDaysISO(-45) },
    { id: "c-8", accountCode: "JRC-FOL-012", name: "Kelechi Umeh", email: "kelechi@example.com", phone: "08089012347", password: "demo123", estate: "Folix Club Area", street: "Folix Crescent", balance: 12000, billAmount: 12000, status: "Pending", joinedAt: addDaysISO(-30) },
  ];
  const schedules: Schedule[] = [
    { id: "s-1", area: "Kushenla / Kusenla Extension", street: "Kushenla Road", date: addDaysISO(2), window: "8:00 AM – 12:00 PM", notes: "Please have bins out by 8:00 AM.", order: 0 },
    { id: "s-2", area: "Ikate", street: "Ikate Elegushi Road", date: addDaysISO(3), window: "9:00 AM – 1:00 PM", notes: "Collection includes the side streets off the main road.", order: 1 },
    { id: "s-3", area: "Folix Club Area", street: "Folix Club Close", date: addDaysISO(4), window: "8:00 AM – 11:00 AM", notes: "Estate gate access arranged with security.", order: 2 },
    { id: "s-4", area: "Freedom Way (selected streets)", street: "Freedom Way — Admiralty Link", date: addDaysISO(5), window: "10:00 AM – 2:00 PM", notes: "Selected streets only; confirm your account coverage.", order: 3 },
    { id: "s-5", area: "Kushenla / Kusenla Extension", street: "Kusenla Extension Avenue", date: addDaysISO(6), window: "8:00 AM – 12:00 PM", notes: "Second route for the extension.", order: 4 },
  ];
  const receipts: Receipt[] = [
    { id: "r-1", customerId: "c-demo", fileName: "providus-transfer-november.pdf", fileType: "application/pdf", amount: 15000, reference: "JRC-KUS-024", note: "November collection payment", uploadedAt: addDaysISO(-1) + "T09:24:00.000Z", status: "Pending", sample: true },
    { id: "r-2", customerId: "c-demo", fileName: "october-receipt.pdf", fileType: "application/pdf", amount: 15000, reference: "JRC-KUS-024", note: "October collection payment", uploadedAt: addDaysISO(-34) + "T10:00:00.000Z", status: "Approved", sample: true, reviewedAt: addDaysISO(-33) + "T11:00:00.000Z" },
    { id: "r-3", customerId: "c-demo", fileName: "september-receipt.pdf", fileType: "application/pdf", amount: 15000, reference: "JRC-KUS-024", note: "September collection payment", uploadedAt: addDaysISO(-65) + "T10:00:00.000Z", status: "Approved", sample: true, reviewedAt: addDaysISO(-64) + "T11:00:00.000Z" },
    { id: "r-4", customerId: "c-2", fileName: "tunde-transfer.jpg", fileType: "image/jpeg", amount: 15000, reference: "JRC-IKT-011", note: "Paid via bank app", uploadedAt: addDaysISO(-2) + "T14:12:00.000Z", status: "Pending", sample: true },
    { id: "r-5", customerId: "c-3", fileName: "chiamaka-receipt.pdf", fileType: "application/pdf", amount: 12000, reference: "JRC-FOL-008", note: "November payment", uploadedAt: addDaysISO(-5) + "T08:30:00.000Z", status: "Approved", sample: true, reviewedAt: addDaysISO(-4) + "T09:00:00.000Z" },
  ];
  return {
    version: 1,
    customers,
    schedules,
    receipts,
    reports: [{ id: "m-1", customerId: "c-4", street: "Freedom Way — Admiralty Link", date: addDaysISO(-2), note: "Bins were out before 9 AM but the truck did not come through our close.", status: "Open", createdAt: addDaysISO(-1) + "T16:20:00.000Z" }],
    messages: [{ id: "msg-1", customerId: "c-demo", subject: "Welcome to your JURICHEST portal", body: "Your collection schedule, invoices and payment history now live in one place. Upload your bank receipt after payment and our team will review it.", createdAt: now, read: false }],
    requests: [],
    activity: [
      { id: "a-1", description: "Adaeze Okafor uploaded a payment receipt", createdAt: receipts[0].uploadedAt, customerId: "c-demo", kind: "payment" },
      { id: "a-2", description: "Collection schedule published for Kushenla Road", createdAt: addDaysISO(-1) + "T08:00:00.000Z", kind: "schedule" },
      { id: "a-3", description: "Chiamaka Eze's receipt was approved", createdAt: receipts[4].reviewedAt!, customerId: "c-3", kind: "payment" },
    ],
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.version === 1 && Array.isArray(parsed.customers)) return parsed;
    }
  } catch { /* fall through to seed */ }
  const seeded = seedData();
  try { localStorage.setItem(DATA_KEY, JSON.stringify(seeded)); } catch { /* demo remains usable in memory */ }
  return seeded;
}

let data: AppData = loadData();
let session: Session = loadSession();

function loadSession(): Session {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch { return null; }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}

window.addEventListener("storage", (event) => {
  if (event.key === DATA_KEY && event.newValue) {
    try {
      data = JSON.parse(event.newValue) as AppData;
      listeners.forEach((listener) => listener());
    } catch { /* ignore malformed external writes */ }
  }
});

function mutate(recipe: (draft: AppData) => void) {
  const draft = structuredClone(data);
  recipe(draft);
  data = draft;
  try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch { /* keep the optimistic in-memory state */ }
  listeners.forEach((listener) => listener());
}

function setSession(next: Session) {
  session = next;
  try {
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* session remains in memory */ }
  sessionListeners.forEach((listener) => listener());
}

function log(draft: AppData, kind: Activity["kind"], description: string, customerId?: string) {
  draft.activity.unshift({ id: uid("a"), kind, description, customerId, createdAt: new Date().toISOString() });
  draft.activity = draft.activity.slice(0, 100);
}

export function useAppData() {
  return useSyncExternalStore(subscribe, () => data, () => data);
}

export function useSession() {
  return useSyncExternalStore(subscribeSession, () => session, () => session);
}

export function activeCustomers(source = data) {
  return source.customers.filter((customer) => !customer.deletedAt);
}

export function activeSchedules(source = data) {
  return source.schedules.filter((schedule) => !schedule.deletedAt).sort((a, b) => a.order - b.order);
}

export function nextScheduleFor(customer: Customer, source = data) {
  return activeSchedules(source)
    .filter((schedule) => schedule.date >= todayISO() && (schedule.street.toLowerCase() === customer.street.toLowerCase() || schedule.area === customer.estate))
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)[0];
}

export function loginCustomer(identifier: string, password: string): Session {
  const key = identifier.trim().toLowerCase();
  if (!key || !password) return null;
  let customer = activeCustomers().find((item) => item.email.toLowerCase() === key || item.accountCode.toLowerCase() === key);
  if (!customer) {
    const localPart = key.includes("@") ? key.split("@")[0] : key;
    const name = localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Demo Resident";
    customer = addCustomer({ name, email: key.includes("@") ? key : `${key}@demo.jurichest.ng`, phone: "", password, estate: "Ikate", street: "Ikate Elegushi Road", balance: 15000, billAmount: 15000 });
  }
  const next: Session = { role: "customer", customerId: customer.id };
  setSession(next);
  return next;
}

export function loginAdmin(username: string, password: string) {
  if (username.trim() === "admin" && password === "jurichest2026") {
    setSession({ role: "admin" });
    return true;
  }
  return false;
}

export function logout() {
  setSession(null);
}

export function addCustomer(input: CustomerInput): Customer {
  const customer: Customer = {
    id: uid("c"),
    accountCode: input.accountCode?.trim() || `JRC-${input.estate.slice(0, 3).toUpperCase()}-${String(activeCustomers().length + 1).padStart(3, "0")}`,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    password: input.password,
    estate: input.estate,
    street: input.street.trim(),
    balance: Math.max(0, input.balance),
    billAmount: Math.max(0, input.billAmount ?? input.balance),
    status: input.balance > 0 ? "Pending" : "Paid",
    joinedAt: new Date().toISOString(),
  };
  mutate((draft) => {
    draft.customers.push(customer);
    log(draft, "customer", `${customer.name} was added to customers`, customer.id);
  });
  return customer;
}

export function updateCustomer(id: string, patch: Partial<Customer>) {
  mutate((draft) => {
    const customer = draft.customers.find((item) => item.id === id);
    if (!customer) return;
    Object.assign(customer, patch);
    if (patch.balance !== undefined) {
      customer.balance = Math.max(0, patch.balance);
      customer.status = customer.balance > 0 ? "Pending" : "Paid";
      if (customer.balance > 0) customer.billAmount = customer.balance;
    }
    if (patch.status) customer.status = patch.status;
    log(draft, "customer", `${customer.name}'s account was updated`, id);
  });
}

export function deleteCustomer(id: string) {
  mutate((draft) => {
    const customer = draft.customers.find((item) => item.id === id);
    if (!customer) return;
    customer.deletedAt = new Date().toISOString();
    log(draft, "customer", `${customer.name} was removed from the active customer list`, id);
  });
}

export function restoreCustomer(id: string) {
  mutate((draft) => {
    const customer = draft.customers.find((item) => item.id === id);
    if (customer) delete customer.deletedAt;
  });
}

export function addSchedule(input: ScheduleInput) {
  const schedule: Schedule = { ...input, id: uid("s"), order: activeSchedules().length };
  mutate((draft) => {
    draft.schedules.push(schedule);
    log(draft, "schedule", `Collection published for ${schedule.street}`);
  });
  return schedule;
}

export function updateSchedule(id: string, patch: Partial<ScheduleInput>) {
  mutate((draft) => {
    const schedule = draft.schedules.find((item) => item.id === id);
    if (schedule) Object.assign(schedule, patch);
  });
}

export function deleteSchedule(id: string) {
  mutate((draft) => {
    const schedule = draft.schedules.find((item) => item.id === id);
    if (schedule) schedule.deletedAt = new Date().toISOString();
  });
}

export function restoreSchedule(id: string) {
  mutate((draft) => {
    const schedule = draft.schedules.find((item) => item.id === id);
    if (schedule) delete schedule.deletedAt;
  });
}

export function reorderSchedules(ids: string[]) {
  mutate((draft) => {
    ids.forEach((id, index) => {
      const schedule = draft.schedules.find((item) => item.id === id);
      if (schedule) schedule.order = index;
    });
  });
}

function openFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("jurichest-receipt-files", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getReceiptFile(id: string): Promise<Blob | null> {
  const db = await openFilesDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function putReceiptFile(id: string, file: Blob) {
  const db = await openFilesDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function uploadReceipt(customerId: string, input: { amount: number; reference: string; note: string }, file: File) {
  const receipt: Receipt = {
    id: uid("r"), customerId, fileName: file.name, fileType: file.type,
    amount: input.amount, reference: input.reference, note: input.note,
    uploadedAt: new Date().toISOString(), status: "Pending",
  };
  await putReceiptFile(receipt.id, file);
  mutate((draft) => {
    draft.receipts.unshift(receipt);
    const customer = draft.customers.find((item) => item.id === customerId);
    log(draft, "payment", `${customer?.name ?? "A customer"} uploaded a payment receipt`, customerId);
  });
  return receipt;
}

export function reviewReceipt(id: string, decision: "Approved" | "Declined", note = ""): ReceiptReviewSnapshot | null {
  const currentReceipt = data.receipts.find((item) => item.id === id);
  const currentCustomer = data.customers.find((item) => item.id === currentReceipt?.customerId);
  if (!currentReceipt || !currentCustomer || currentReceipt.status !== "Pending") return null;
  const snapshot: ReceiptReviewSnapshot = { receipt: structuredClone(currentReceipt), customer: structuredClone(currentCustomer) };
  mutate((draft) => {
    const receipt = draft.receipts.find((item) => item.id === id)!;
    const customer = draft.customers.find((item) => item.id === receipt.customerId)!;
    receipt.status = decision;
    receipt.reviewNote = note;
    receipt.reviewedAt = new Date().toISOString();
    if (decision === "Approved") {
      customer.balance = 0;
      customer.status = "Paid";
    }
    log(draft, "payment", `${customer.name}'s receipt was ${decision.toLowerCase()}`, customer.id);
  });
  return snapshot;
}

export function undoReceiptReview(snapshot: ReceiptReviewSnapshot) {
  mutate((draft) => {
    const receipt = draft.receipts.find((item) => item.id === snapshot.receipt.id);
    const customer = draft.customers.find((item) => item.id === snapshot.customer.id);
    if (!receipt || !customer || receipt.status === "Pending") return;
    Object.assign(receipt, snapshot.receipt);
    customer.balance = snapshot.customer.balance;
    customer.status = snapshot.customer.status;
    customer.billAmount = snapshot.customer.billAmount;
    log(draft, "payment", `Receipt review for ${customer.name} was undone`, customer.id);
  });
}

export function addReport(customerId: string, input: { street: string; date: string; note: string }) {
  const report: MissedReport = { ...input, id: uid("m"), customerId, status: "Open", createdAt: new Date().toISOString() };
  mutate((draft) => {
    draft.reports.unshift(report);
    const customer = draft.customers.find((item) => item.id === customerId);
    log(draft, "report", `${customer?.name ?? "A customer"} reported a missed collection`, customerId);
  });
  return report;
}

export function updateReport(id: string, status: ReportStatus, adminNote = "") {
  mutate((draft) => {
    const report = draft.reports.find((item) => item.id === id);
    if (!report) return;
    report.status = status;
    report.adminNote = adminNote;
    log(draft, "report", `Missed-collection report marked ${status.toLowerCase()}`, report.customerId);
  });
}

export function sendMessage(customerId: string, subject: string, body: string) {
  mutate((draft) => {
    draft.messages.unshift({ id: uid("msg"), customerId, subject, body, createdAt: new Date().toISOString(), read: false });
    const customer = draft.customers.find((item) => item.id === customerId);
    log(draft, "message", `Message sent to ${customer?.name ?? "a customer"}`, customerId);
  });
}

export function markMessageRead(id: string) {
  mutate((draft) => {
    const message = draft.messages.find((item) => item.id === id);
    if (message) message.read = true;
  });
}

export function addRequest(input: Omit<ServiceRequest, "id" | "createdAt" | "status">) {
  const request: ServiceRequest = { ...input, id: uid("req"), createdAt: new Date().toISOString(), status: "New" };
  mutate((draft) => {
    draft.requests.unshift(request);
    log(draft, "request", `New service request from ${request.name}`);
  });
  return request;
}

export function updateRequest(id: string, status: ServiceRequest["status"]) {
  mutate((draft) => {
    const request = draft.requests.find((item) => item.id === id);
    if (request) request.status = status;
  });
}

export function changePassword(customerId: string, current: string, next: string) {
  const customer = data.customers.find((item) => item.id === customerId);
  if (!customer || customer.password !== current || next.length < 6) return false;
  mutate((draft) => {
    const target = draft.customers.find((item) => item.id === customerId)!;
    target.password = next;
    log(draft, "customer", `${target.name} updated their password`, customerId);
  });
  return true;
}

export function resetDemoData() {
  data = seedData();
  try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch { /* keep in-memory reset */ }
  listeners.forEach((listener) => listener());
  setSession(null);
}

export function exportCustomersCsv(customers: Customer[]) {
  const rows = [["Account Code", "Name", "Email", "Phone", "Estate", "Street", "Balance", "Status"], ...customers.map((customer) => [customer.accountCode, customer.name, customer.email, customer.phone, customer.estate, customer.street, String(customer.balance), customer.status])];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `jurichest-customers-${todayISO()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}