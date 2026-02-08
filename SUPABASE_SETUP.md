# Queen Business — Supabase Setup Guide

This guide walks you through setting up Supabase as the backend for Queen Business so your data (products & invoices) is stored in the cloud and accessible from any device.

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in.
2. Click **"New Project"**.
3. Choose an organization (or create one), give it a name like `queen-business`, set a database password, and pick a region close to you.
4. Wait for the project to finish setting up (~2 minutes).

---

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API**.
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon/public key** (the one labeled `anon` `public`)
3. Create a file in your project at `src/lib/supabaseClient.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_PROJECT_URL";
const supabaseAnonKey = "YOUR_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. Install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

---

## Step 3: Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

```sql
-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pack_price NUMERIC NOT NULL DEFAULT 0,
  half_pack_price NUMERIC NOT NULL DEFAULT 0,
  quarter_pack_price NUMERIC NOT NULL DEFAULT 0,
  piece_price NUMERIC NOT NULL DEFAULT 0,
  pieces_per_pack INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('pack', 'halfPack', 'quarterPack', 'piece')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- Invoice counter (for sequential numbering)
CREATE TABLE public.invoice_counter (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  counter INTEGER NOT NULL DEFAULT 0
);

-- Insert the initial counter row
INSERT INTO public.invoice_counter (id, counter) VALUES (1, 0);
```

---

## Step 4: Set Up Row-Level Security (RLS)

Since this is a single-user app (your aunt), the simplest approach is to allow all operations. Run this in the SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counter ENABLE ROW LEVEL SECURITY;

-- Allow all operations using the anon key (single-user app)
-- PRODUCTS
CREATE POLICY "Allow all on products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- INVOICES
CREATE POLICY "Allow all on invoices" ON public.invoices
  FOR ALL USING (true) WITH CHECK (true);

-- INVOICE ITEMS
CREATE POLICY "Allow all on invoice_items" ON public.invoice_items
  FOR ALL USING (true) WITH CHECK (true);

-- INVOICE COUNTER
CREATE POLICY "Allow all on invoice_counter" ON public.invoice_counter
  FOR ALL USING (true) WITH CHECK (true);
```

> **⚠️ Note:** This policy allows anyone with the anon key to read/write data. This is fine for a personal business tool. If you later want authentication, you'd add `auth.uid()` checks instead.

---

## Step 6: Update the App Code

Replace the localStorage-based `src/lib/store.ts` with Supabase calls. Here's a reference for each function:

### Get Products

```ts
import { supabase } from "./supabaseClient";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
```

### Add Product

```ts
export async function addProduct(product: Omit<Product, "id">) {
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
  return data;
}
```

### Save Invoice

```ts
export async function saveInvoice(
  invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">,
) {
  // Increment counter
  const { data: counterData } = await supabase.rpc("increment_invoice_counter");
  // Or manually:
  const { data: current } = await supabase
    .from("invoice_counter")
    .select("counter")
    .eq("id", 1)
    .single();

  const newCounter = (current?.counter || 0) + 1;

  await supabase
    .from("invoice_counter")
    .update({ counter: newCounter })
    .eq("id", 1);

  const invoiceNumber = `QB-${newCounter.toString().padStart(4, "0")}`;

  // Insert invoice
  const { data: inv, error } = await supabase
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

  if (error) throw error;

  // Insert items
  const items = invoice.items.map((item) => ({
    invoice_id: inv.id,
    product_id: item.productId,
    product_name: item.productName,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.total,
  }));

  await supabase.from("invoice_items").insert(items);

  return { ...inv, invoiceNumber, items: invoice.items };
}
```

### Get Invoices

```ts
export async function getInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
```

---

## Step 7: Test It

1. Add a product via the Products page.
2. Create an invoice using that product.
3. Verify the data appears in your Supabase dashboard under **Table Editor**.

---

## Summary of Tables

| Table             | Purpose                                |
| ----------------- | -------------------------------------- |
| `products`        | Drink names & tiered prices            |
| `invoices`        | Invoice header (customer, date, total) |
| `invoice_items`   | Line items for each invoice            |
| `invoice_counter` | Auto-incrementing invoice number       |

---

That's it! Your aunt's invoice data will now be safely stored in the cloud. 🎉
