// Invoice Service
const INVOICES_KEY = 'invoices';

export function saveInvoice(invoice) {
  const invoices = getInvoices();
  invoices.unshift(invoice);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getInvoices() {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearInvoices() {
  localStorage.setItem(INVOICES_KEY, JSON.stringify([]));
} 