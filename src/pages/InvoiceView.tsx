import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getInvoice, Invoice, UNIT_LABELS } from "@/lib/store";
import Layout from "@/components/Layout";
import { format } from "date-fns";
import jsPDF from "jspdf";
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

  const fmt = (n: number) => `N${n.toLocaleString()}`;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPos = margin;
      
      // Header - Queen Business
      pdf.setFontSize(20);
      pdf.setTextColor(209, 143, 43); // Queen Business color
      pdf.text("Queen Business", margin, yPos);
      yPos += 7;
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text("Wholesale Drinks", margin, yPos);
      yPos += 15;
      
      // Invoice Title and Number (Right aligned)
      pdf.setFontSize(18);
      pdf.setTextColor(209, 143, 43);
      const invoiceText = "INVOICE";
      const invoiceWidth = pdf.getTextWidth(invoiceText);
      pdf.text(invoiceText, pageWidth - margin - invoiceWidth, margin);
      
      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39); // Gray-900
      const invoiceNum = invoice.invoiceNumber;
      const invoiceNumWidth = pdf.getTextWidth(invoiceNum);
      pdf.text(invoiceNum, pageWidth - margin - invoiceNumWidth, margin + 8);
      
      const dateText = format(new Date(invoice.date), "dd MMM yyyy");
      const dateWidth = pdf.getTextWidth(dateText);
      pdf.text(dateText, pageWidth - margin - dateWidth, margin + 16);
      
      // Bill To Section
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text("BILL TO", margin, yPos);
      yPos += 5;
      
      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text(invoice.customerName, margin, yPos);
      yPos += 6;
      
      if (invoice.customerPhone) {
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text(invoice.customerPhone, margin, yPos);
        yPos += 5;
      }
      
      if (invoice.customerAddress) {
        // Handle long addresses with text wrapping
        const addressLines = pdf.splitTextToSize(invoice.customerAddress, contentWidth * 0.6);
        pdf.text(addressLines, margin, yPos);
        yPos += addressLines.length * 5;
      }
      
      yPos += 10;
      
      // Table Header
      const tableTop = yPos;
      const colWidths = {
        item: contentWidth * 0.45,    // 45% for item name
        unit: contentWidth * 0.12,    // 12% for unit
        qty: contentWidth * 0.12,     // 12% for quantity
        price: contentWidth * 0.15,   // 15% for unit price
        total: contentWidth * 0.16    // 16% for total
      };
      
      // Table background
      pdf.setFillColor(249, 250, 251); // Gray-50
      pdf.rect(margin, tableTop, contentWidth, 8, 'F');
      
      // Table headers
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text("Item", margin + 2, tableTop + 5);
      pdf.text("Unit", margin + colWidths.item + 2, tableTop + 5, { align: 'center' });
      pdf.text("Qty", margin + colWidths.item + colWidths.unit + 2, tableTop + 5, { align: 'center' });
      pdf.text("Price", margin + colWidths.item + colWidths.unit + colWidths.qty + 2, tableTop + 5, { align: 'right' });
      pdf.text("Total", margin + contentWidth - 2, tableTop + 5, { align: 'right' });
      
      yPos = tableTop + 10;
      
      // Table rows
      pdf.setFontSize(10);
      pdf.setTextColor(17, 24, 39);
      
      invoice.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPos + 8 > pageHeight - margin - 30) { // Leave space for total
          pdf.addPage();
          yPos = margin;
        }
        
        // Alternate row background
        if (index % 2 === 1) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos - 2, contentWidth, 8, 'F');
        }
        
        // Item name (with text wrapping if needed)
        const itemLines = pdf.splitTextToSize(item.productName, colWidths.item - 4);
        pdf.text(itemLines, margin + 2, yPos + 3);
        
        // Unit
        pdf.text(UNIT_LABELS[item.unit], margin + colWidths.item + colWidths.unit/2, yPos + 3, { align: 'center' });
        
        // Quantity
        pdf.text(item.quantity.toString(), margin + colWidths.item + colWidths.unit + colWidths.qty/2, yPos + 3, { align: 'center' });
        
        // Unit Price
        pdf.text(fmt(item.unitPrice), margin + colWidths.item + colWidths.unit + colWidths.qty + colWidths.price - 2, yPos + 3, { align: 'right' });
        
        // Total
        pdf.text(fmt(item.total), margin + contentWidth - 2, yPos + 3, { align: 'right' });
        
        const rowHeight = Math.max(6, itemLines.length * 4);
        yPos += rowHeight;
      });
      
      // Total section
      yPos += 5;
      
      // Draw line above total
      pdf.setDrawColor(209, 143, 43); // Queen Business color
      pdf.setLineWidth(0.5);
      pdf.line(margin + contentWidth * 0.6, yPos, margin + contentWidth, yPos);
      yPos += 8;
      
      // Total amount
      pdf.setFontSize(14);
      pdf.setTextColor(17, 24, 39);
      const totalLabel = "TOTAL:";
      const totalAmount = fmt(invoice.subtotal);
      const totalLabelWidth = pdf.getTextWidth(totalLabel);
      
      pdf.text(totalLabel, margin + contentWidth - totalLabelWidth - pdf.getTextWidth(totalAmount) - 10, yPos);
      pdf.text(totalAmount, margin + contentWidth - 2, yPos, { align: 'right' });
      
      // Footer
      if (yPos + 20 > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      } else {
        yPos += 20;
      }
      
      pdf.setFontSize(10);
      pdf.setTextColor(156, 163, 175); // Gray-400
      const footerText = "Thank you for shopping with us!";
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerWidth) / 2, yPos);
      
      // Save the PDF
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
