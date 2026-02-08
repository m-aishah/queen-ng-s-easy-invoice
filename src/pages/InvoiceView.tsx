import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const invoices = await getInvoices();
        const found = invoices.find((i) => i.id === id);
        setInvoice(found || null);
      } catch (error) {
        console.error("Failed to load invoice:", error);
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div className="flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Invoice Content Skeleton */}
          <Card className="p-6 sm:p-8">
            <div className="space-y-6">
              <div className="flex justify-between">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
              <Skeleton className="h-8 w-32 ml-auto" />
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Invoice not found.</p>
          <Button
            onClick={() => navigate("/invoices")}
            variant="outline"
            className="hover:bg-secondary/50 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
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
        <Button
          variant="outline"
          onClick={() => navigate("/invoices")}
          className="gap-2 hover:bg-secondary/50 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2 hover:bg-primary/90"
        >
          <Download className="w-4 h-4" />{" "}
          {downloading ? "Downloading..." : "Download Invoice"}
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
            <img
              src={queenLogo}
              alt="Queen Business Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                Queen Business
              </h1>
              <p className="text-sm text-gray-500">Wholesale Drinks</p>
            </div>
          </div>
          <div className="text-right">
            <h2
              className="font-display text-xl font-bold"
              style={{ color: "hsl(36, 80%, 50%)" }}
            >
              INVOICE
            </h2>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {invoice.invoiceNumber}
            </p>
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
              <th className="text-left py-2 font-semibold text-gray-400">
                Item
              </th>
              <th className="text-left py-2 font-semibold text-gray-400">
                Unit
              </th>
              <th className="text-right py-2 font-semibold text-gray-400">
                Qty
              </th>
              <th className="text-right py-2 font-semibold text-gray-400">
                Price
              </th>
              <th className="text-right py-2 font-semibold text-gray-400">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 text-gray-900 font-medium">
                  {item.productName}
                </td>
                <td className="py-3 text-gray-500">{UNIT_LABELS[item.unit]}</td>
                <td className="py-3 text-right text-gray-900">
                  {item.quantity}
                </td>
                <td className="py-3 text-right text-gray-500">
                  {fmt(item.unitPrice)}
                </td>
                <td className="py-3 text-right font-semibold text-gray-900">
                  {fmt(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64">
            <div
              className="flex justify-between py-3 border-t-2"
              style={{ borderColor: "hsl(36, 80%, 50%)" }}
            >
              <span className="font-display text-lg font-bold text-gray-900">
                Total
              </span>
              <span
                className="font-display text-lg font-bold"
                style={{ color: "hsl(36, 80%, 50%)" }}
              >
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
            Thank you for shopping with us!
          </p>
        </div>
      </div>
    </Layout>
  );
}
