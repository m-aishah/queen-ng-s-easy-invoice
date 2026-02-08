import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getInvoice, Invoice, UNIT_LABELS } from "@/lib/store";
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
      if (!id) {
        setInvoice(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const invoice = await getInvoice(id);
        setInvoice(invoice);
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-20" />
            <div className="flex-1" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-12 w-full sm:w-40" />
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
      // Optimized canvas settings for reliable PDF generation
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        height: invoiceRef.current.scrollHeight,
        width: invoiceRef.current.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // A4 page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      // Calculate scaled dimensions to fit page width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scaledWidth = contentWidth;
      const scaledHeight = (imgHeight * contentWidth) / imgWidth;

      if (scaledHeight <= contentHeight) {
        // Single page - center the content
        const yOffset = (pageHeight - scaledHeight) / 2;
        pdf.addImage(imgData, "PNG", margin, yOffset, scaledWidth, scaledHeight);
      } else {
        // Multiple pages needed - use simple page splitting
        let yPosition = 0;
        let pageNumber = 0;
        
        while (yPosition < scaledHeight) {
          if (pageNumber > 0) {
            pdf.addPage();
          }
          
          // Calculate how much content fits on this page
          const remainingHeight = scaledHeight - yPosition;
          const currentPageContent = Math.min(contentHeight, remainingHeight);
          
          // Add the image with negative Y offset to show the correct portion
          pdf.addImage(
            imgData, 
            "PNG", 
            margin, 
            margin - yPosition, 
            scaledWidth, 
            scaledHeight
          );
          
          yPosition += currentPageContent;
          pageNumber++;
        }
      }

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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/invoices")}
            className="gap-2 hover:bg-secondary/50 hover:text-foreground h-11 text-base self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2 hover:bg-primary/90 h-11 text-base w-full sm:w-auto"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Invoice
              </>
            )}
          </Button>
        </div>

        {/* Printable invoice */}
        <div
          ref={invoiceRef}
          className="bg-white rounded-xl border shadow-sm w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 print:shadow-none print:border-none print:max-w-none print:p-8 print:rounded-none"
          style={{ minWidth: '600px' }} // Ensure minimum width for consistent PDF rendering
        >
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <img
                src={queenLogo}
                alt="Queen Business Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-2xl font-bold text-gray-900">
                  Queen Business
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Wholesale Drinks
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2
                className="font-display text-lg sm:text-xl font-bold"
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
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Bill To
            </p>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">
              {invoice.customerName}
            </p>
            {invoice.customerPhone && (
              <p className="text-xs sm:text-sm text-gray-500">
                {invoice.customerPhone}
              </p>
            )}
            {invoice.customerAddress && (
              <p className="text-xs sm:text-sm text-gray-500 break-words">
                {invoice.customerAddress}
              </p>
            )}
          </div>

          {/* Items table - Responsive for all screen sizes */}
          <div className="mb-4 sm:mb-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-1 font-semibold text-gray-400 w-2/5">
                    Item
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-gray-400 w-1/6">
                    Unit
                  </th>
                  <th className="text-center py-2 px-1 font-semibold text-gray-400 w-1/6">
                    Qty
                  </th>
                  <th className="text-right py-2 px-1 font-semibold text-gray-400 w-1/6">
                    Price
                  </th>
                  <th className="text-right py-2 px-1 font-semibold text-gray-400 w-1/6">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-1 text-gray-900 font-medium text-xs sm:text-sm">
                      {item.productName}
                    </td>
                    <td className="py-2 px-1 text-center text-gray-500 text-xs sm:text-sm">
                      {UNIT_LABELS[item.unit]}
                    </td>
                    <td className="py-2 px-1 text-center text-gray-900 text-xs sm:text-sm">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-1 text-right text-gray-500 text-xs sm:text-sm">
                      {fmt(item.unitPrice)}
                    </td>
                    <td className="py-2 px-1 text-right font-semibold text-gray-900 text-xs sm:text-sm">
                      {fmt(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64">
              <div
                className="flex justify-between py-3 border-t-2"
                style={{ borderColor: "hsl(36, 80%, 50%)" }}
              >
                <span className="font-display text-base sm:text-lg font-bold text-gray-900">
                  Total
                </span>
                <span
                  className="font-display text-base sm:text-lg font-bold"
                  style={{ color: "hsl(36, 80%, 50%)" }}
                >
                  {fmt(invoice.subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-xs sm:text-sm text-gray-500 break-words">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Thank you for shopping with us!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
