import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInvoices, deleteInvoice, Invoice, UNIT_LABELS } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { format } from "date-fns";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    setInvoices(getInvoices());
    toast({ title: "Invoice deleted" });
  };

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All your generated invoices in one place.
          </p>
        </div>
        <Button onClick={() => navigate("/invoices/new")} size="lg" className="gap-2 text-base">
          <Plus className="w-5 h-5" /> New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No invoices yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first invoice to get started!
          </p>
          <Button onClick={() => navigate("/invoices/new")} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Invoice
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {invoices.map((inv) => (
            <Card key={inv.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-semibold text-primary">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(inv.date), "dd MMM yyyy")}
                  </span>
                </div>
                <p className="font-semibold text-foreground mt-1">{inv.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} · {fmt(inv.subtotal)}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(inv.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
