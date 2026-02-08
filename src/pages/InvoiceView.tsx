import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoices, Invoice, UNIT_LABELS } from "@/lib/store";
import Layout from "@/components/Layout";
import { format } from "date-fns";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import queenLogo from "@/assets/queen-business-logo.png";

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const dateStr = format(new Date(invoice.date), "dd-MM-yyyy");
      const fileName = `${invoice.customerName}_${dateStr}_Invoice.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate("/invoices")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          <Download className="w-4 h-4" /> {downloading ? "Downloading..." : "Download Invoice"}
        </Button>
      </div>

      {/* Printable invoice */}
      <div
        ref={invoiceRef}
        className="bg-white rounded-xl border shadow-sm max-w-2xl mx-auto p-8 print:shadow-none print:border-none print:max-w-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={queenLogo} alt="Queen Business Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Queen Business</h1>
              <p className="text-sm text-gray-500">Wholesale Drinks</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-display text-xl font-bold" style={{ color: "hsl(36, 80%, 50%)" }}>INVOICE</h2>
            <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(invoice.date), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        {/* Bill To */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Bill To
          </p>
          <p className="font-semibold text-gray-900">{invoice.customerName}</p>
          {invoice.customerPhone && (
            <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
          )}
          {invoice.customerAddress && (
            <p className="text-sm text-gray-500">{invoice.customerAddress}</p>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-400">Item</th>
              <th className="text-left py-2 font-semibold text-gray-400">Unit</th>
              <th className="text-right py-2 font-semibold text-gray-400">Qty</th>
              <th className="text-right py-2 font-semibold text-gray-400">Price</th>
              <th className="text-right py-2 font-semibold text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 text-gray-900 font-medium">{item.productName}</td>
                <td className="py-3 text-gray-500">{UNIT_LABELS[item.unit]}</td>
                <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">{fmt(item.unitPrice)}</td>
                <td className="py-3 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-3 border-t-2" style={{ borderColor: "hsl(36, 80%, 50%)" }}>
              <span className="font-display text-lg font-bold text-gray-900">Total</span>
              <span className="font-display text-lg font-bold" style={{ color: "hsl(36, 80%, 50%)" }}>
                {fmt(invoice.subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-500">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Thank you for your business! — Queen Business Wholesale Drinks
          </p>
        </div>
      </div>
    </Layout>
  );
}
