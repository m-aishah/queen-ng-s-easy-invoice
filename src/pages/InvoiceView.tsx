import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoices, Invoice, UNIT_LABELS } from "@/lib/store";
import Layout from "@/components/Layout";
import { format } from "date-fns";

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const invoices = getInvoices();
    const found = invoices.find((i) => i.id === id);
    setInvoice(found || null);
  }, [id]);

  if (!invoice) {
    return (
      <Layout>
        <p className="text-center py-16 text-muted-foreground">Invoice not found.</p>
      </Layout>
    );
  }

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <Layout>
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate("/invoices")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print Invoice
        </Button>
      </div>

      {/* Printable invoice */}
      <div className="bg-card rounded-xl border shadow-sm max-w-2xl mx-auto p-8 print:shadow-none print:border-none print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Queen Ng</h1>
            </div>
            <p className="text-sm text-muted-foreground">Wholesale Drinks</p>
          </div>
          <div className="text-right">
            <h2 className="font-display text-xl font-bold text-primary">INVOICE</h2>
            <p className="text-sm font-semibold text-foreground mt-1">{invoice.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(invoice.date), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Bill To
          </p>
          <p className="font-semibold text-foreground">{invoice.customerName}</p>
          {invoice.customerPhone && (
            <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
          )}
          {invoice.customerAddress && (
            <p className="text-sm text-muted-foreground">{invoice.customerAddress}</p>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold text-muted-foreground">Item</th>
              <th className="text-left py-2 font-semibold text-muted-foreground">Unit</th>
              <th className="text-right py-2 font-semibold text-muted-foreground">Qty</th>
              <th className="text-right py-2 font-semibold text-muted-foreground">Price</th>
              <th className="text-right py-2 font-semibold text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="py-3 text-foreground font-medium">{item.productName}</td>
                <td className="py-3 text-muted-foreground">{UNIT_LABELS[item.unit]}</td>
                <td className="py-3 text-right text-foreground">{item.quantity}</td>
                <td className="py-3 text-right text-muted-foreground">{fmt(item.unitPrice)}</td>
                <td className="py-3 text-right font-semibold text-foreground">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-3 border-t-2 border-primary">
              <span className="font-display text-lg font-bold text-foreground">Total</span>
              <span className="font-display text-lg font-bold text-primary">
                {fmt(invoice.subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Thank you for your business! — Queen Ng Wholesale Drinks
          </p>
        </div>
      </div>
    </Layout>
  );
}
