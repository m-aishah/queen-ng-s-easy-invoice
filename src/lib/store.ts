// Simple localStorage-based store for products and invoices

export interface Product {
  id: string;
  name: string;
  packPrice: number;
  halfPackPrice: number;
  quarterPackPrice: number;
  piecePrice: number;
  piecesPerPack: number;
}

export type UnitType = 'pack' | 'halfPack' | 'quarterPack' | 'piece';

export const UNIT_LABELS: Record<UnitType, string> = {
  pack: 'Pack',
  halfPack: 'Half Pack',
  quarterPack: 'Quarter Pack',
  piece: 'Piece',
};

export interface InvoiceItem {
  productId: string;
  productName: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  notes: string;
  createdAt: string;
}

const PRODUCTS_KEY = 'queenng_products';
const INVOICES_KEY = 'queenng_invoices';
const INVOICE_COUNTER_KEY = 'queenng_invoice_counter';

export function getProducts(): Product[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product: Omit<Product, 'id'>): Product {
  const products = getProducts();
  const newProduct = { ...product, id: crypto.randomUUID() };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(product: Product) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx !== -1) {
    products[idx] = product;
    saveProducts(products);
  }
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

export function getInvoices(): Invoice[] {
  const data = localStorage.getItem(INVOICES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice {
  const invoices = getInvoices();
  const counter = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || '0') + 1;
  localStorage.setItem(INVOICE_COUNTER_KEY, counter.toString());
  
  const newInvoice: Invoice = {
    ...invoice,
    id: crypto.randomUUID(),
    invoiceNumber: `QNG-${counter.toString().padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
  };
  invoices.unshift(newInvoice);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  return newInvoice;
}

export function deleteInvoice(id: string) {
  const invoices = getInvoices().filter(i => i.id !== id);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getUnitPrice(product: Product, unit: UnitType): number {
  switch (unit) {
    case 'pack': return product.packPrice;
    case 'halfPack': return product.halfPackPrice;
    case 'quarterPack': return product.quarterPackPrice;
    case 'piece': return product.piecePrice;
  }
}
