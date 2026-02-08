import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Trash2,
  FileText,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoices, deleteInvoice, Invoice } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { format } from "date-fns";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const invoices = await getInvoices();
        setInvoices(invoices);
      } catch (error) {
        console.error("Failed to load invoices:", error);
        toast({ title: "Failed to load invoices", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, [toast]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteInvoice(id);
      const invoices = await getInvoices();
      setInvoices(invoices);
      toast({ title: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast({ title: "Failed to delete invoice", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold font-display text-foreground">
                Invoices
              </h1>
              <p className="text-muted-foreground mobile-text max-w-2xl">
                All your generated invoices in one place. View, print, or delete
                past transactions.
              </p>
            </div>

            <Button
              onClick={() => navigate("/invoices/new")}
              className="mobile-button"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">New Invoice</span>
            </Button>
          </div>
        </div>

        {/* Invoices Display */}
        <div className="mobile-grid mt-8 sm:mt-12">
          {loading ? (
            <div className="grid gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-3" />
                      <Skeleton className="h-4 w-48 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col sm:gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-20 h-20 text-muted-foreground/40 mb-6" />
              <h3 className="text-xl font-semibold font-display text-foreground mb-2">
                No invoices yet
              </h3>
              <p className="text-muted-foreground mobile-text mb-6 max-w-md">
                Create your first invoice to get started tracking your business
                transactions.
              </p>
              <Button
                onClick={() => navigate("/invoices/new")}
                className="mobile-button"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Invoice
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {invoices.map((inv) => (
                <Card
                  key={inv.id}
                  className="p-4 sm:p-6 transition-all duration-200 hover:shadow-lg border-l-4 border-l-primary"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <span className="text-lg font-bold font-mono text-primary bg-secondary/50 px-3 py-1 rounded">
                          {inv.invoiceNumber}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(inv.date), "dd MMM yyyy")}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary flex-shrink-0" />
                          <p className="font-semibold font-display text-lg text-foreground truncate">
                            {inv.customerName}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {inv.items.length} item
                            {inv.items.length !== 1 ? "s" : ""}
                          </span>
                          <div className="font-bold text-lg text-primary">
                            {fmt(inv.subtotal)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {inv.items.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-secondary/50 text-foreground px-2 py-1 rounded-full"
                            >
                              {item.productName}
                            </span>
                          ))}
                          {inv.items.length > 3 && (
                            <span className="text-xs bg-secondary/50 text-foreground px-2 py-1 rounded-full">
                              +{inv.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:flex-col sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="flex-1 sm:flex-none hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                      >
                        <Eye className="w-4 h-4 sm:mr-0 mr-2" />
                        <span className="sm:hidden">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(inv.id)}
                        disabled={deletingId === inv.id}
                        className="flex-1 sm:flex-none hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                      >
                        {deletingId === inv.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Delete</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
