// Supabase-based store for products and invoices

import { supabase } from "./supabaseClient";

export interface Product {
  id: string;
  name: string;
  packPrice: number;
  halfPackPrice: number;
  quarterPackPrice: number;
  piecePrice: number;
  piecesPerPack: number;
  createdAt?: string;
}

export type UnitType = "pack" | "halfPack" | "quarterPack" | "piece";

export const UNIT_LABELS: Record<UnitType, string> = {
  pack: "Pack",
  halfPack: "Half Pack",
  quarterPack: "Quarter Pack",
  piece: "Piece",
};

export interface InvoiceItem {
  id?: string;
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

// Database row interfaces (for mapping snake_case to camelCase)
interface ProductRow {
  id: string;
  name: string;
  pack_price: number;
  half_pack_price: number;
  quarter_pack_price: number;
  piece_price: number;
  pieces_per_pack: number;
  created_at: string;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  notes: string;
  created_at: string;
}

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  unit: UnitType;
  quantity: number;
  unit_price: number;
  total: number;
}

// Helper functions to convert between database rows and our interfaces
function mapProductFromDb(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    packPrice: row.pack_price,
    halfPackPrice: row.half_pack_price,
    quarterPackPrice: row.quarter_pack_price,
    piecePrice: row.piece_price,
    piecesPerPack: row.pieces_per_pack,
    createdAt: row.created_at,
  };
}

function mapInvoiceFromDb(
  row: InvoiceRow & { invoice_items?: InvoiceItemRow[] },
): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    date: row.date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    subtotal: row.subtotal,
    notes: row.notes,
    createdAt: row.created_at,
    items: row.invoice_items?.map(mapInvoiceItemFromDb) || [],
  };
}

function mapInvoiceItemFromDb(row: InvoiceItemRow): InvoiceItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    unit: row.unit,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
  };
}

// Products API
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapProductFromDb);
}

export async function addProduct(
  product: Omit<Product, "id" | "createdAt">,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      pack_price: product.packPrice,
      half_pack_price: product.halfPackPrice,
      quarter_pack_price: product.quarterPackPrice,
      piece_price: product.piecePrice,
      pieces_per_pack: product.piecesPerPack,
    })
    .select()
    .single();

  if (error) throw error;
  return mapProductFromDb(data);
}

export async function updateProduct(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      pack_price: product.packPrice,
      half_pack_price: product.halfPackPrice,
      quarter_pack_price: product.quarterPackPrice,
      piece_price: product.piecePrice,
      pieces_per_pack: product.piecesPerPack,
    })
    .eq("id", product.id)
    .select()
    .single();

  if (error) throw error;
  return mapProductFromDb(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
}

// Invoices API
export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapInvoiceFromDb);
}

export async function saveInvoice(
  invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">,
): Promise<Invoice> {
  // Get current counter and increment it
  const { data: current, error: counterError } = await supabase
    .from("invoice_counter")
    .select("counter")
    .eq("id", 1)
    .single();

  if (counterError) throw counterError;

  const newCounter = (current?.counter || 0) + 1;

  // Update the counter
  const { error: updateError } = await supabase
    .from("invoice_counter")
    .update({ counter: newCounter })
    .eq("id", 1);

  if (updateError) throw updateError;

  const invoiceNumber = `QB-${newCounter.toString().padStart(4, "0")}`;

  // Insert invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      date: invoice.date,
      customer_name: invoice.customerName,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      subtotal: invoice.subtotal,
      notes: invoice.notes,
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Insert invoice items
  if (invoice.items.length > 0) {
    const items = invoice.items.map((item) => ({
      invoice_id: invoiceData.id,
      product_id: item.productId,
      product_name: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items);

    if (itemsError) throw itemsError;
  }

  // Return the complete invoice with items
  const { data: completeInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceData.id)
    .single();

  if (fetchError) throw fetchError;
  return mapInvoiceFromDb(completeInvoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) throw error;
}

// Utility function
export function getUnitPrice(product: Product, unit: UnitType): number {
  switch (unit) {
    case "pack":
      return product.packPrice;
    case "halfPack":
      return product.halfPackPrice;
    case "quarterPack":
      return product.quarterPackPrice;
    case "piece":
      return product.piecePrice;
  }
}
