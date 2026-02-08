import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProducts,
  saveInvoice,
  getUnitPrice,
  Product,
  InvoiceItem,
  UnitType,
  UNIT_LABELS,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

interface LineItem {
  productId: string;
  unit: UnitType;
  quantity: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", unit: "pack", quantity: "1" },
  ]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const products = await getProducts();
        setProducts(products);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast({ title: "Failed to load products", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [toast]);

  const addLine = () => {
    setLines([...lines, { productId: "", unit: "pack", quantity: "1" }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  const getLineTotal = (line: LineItem): number => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return 0;
    const price = getUnitPrice(product, line.unit);
    return price * (parseFloat(line.quantity) || 0);
  };

  const subtotal = lines.reduce((sum, line) => sum + getLineTotal(line), 0);

  const handleGenerate = async () => {
    if (generating) return; // Prevent double submission

    if (!customerName.trim()) {
      toast({
        title: "Please enter the customer name",
        variant: "destructive",
      });
      return;
    }

    const validLines = lines.filter(
      (l) => l.productId && parseFloat(l.quantity) > 0,
    );
    if (validLines.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    const items: InvoiceItem[] = validLines.map((line) => {
      const product = products.find((p) => p.id === line.productId)!;
      const unitPrice = getUnitPrice(product, line.unit);
      const qty = parseFloat(line.quantity) || 0;
      return {
        productId: line.productId,
        productName: product.name,
        unit: line.unit,
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
      };
    });

    try {
      setGenerating(true);
      const invoice = await saveInvoice({
        date,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items,
        subtotal: items.reduce((s, i) => s + i.total, 0),
        notes: notes.trim(),
      });

      toast({ title: `Invoice ${invoice.invoiceNumber} created! 🎉` });
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast({ title: "Failed to create invoice", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-foreground">
            Create Invoice
          </h1>
          <p className="text-muted-foreground mobile-text max-w-2xl">
            Fill in the customer details and select products to generate a
            professional invoice.
          </p>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Customer Details Skeleton */}
            <Card className="p-4 sm:p-6 lg:col-span-1">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Items Skeleton */}
            <Card className="p-4 sm:p-6 lg:col-span-2">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3"
                  >
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Customer Details */}
            <Card className="p-4 sm:p-6 lg:col-span-1">
              <h2 className="font-display text-lg font-semibold mb-4 text-foreground">
                Customer Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 h-10 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 08012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 h-10 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Customer address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 h-10 sm:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 min-h-[60px] resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card className="p-4 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Items
                </h2>
                <Button
                  onClick={addLine}
                  variant="outline"
                  className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>

              {products.length === 0 && (
                <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm mb-4 border border-border">
                  No products yet!{" "}
                  <a
                    href="/products"
                    className="underline font-medium text-primary hover:text-primary/80"
                  >
                    Add some products first →
                  </a>
                </div>
              )}

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end bg-muted/50 rounded-lg p-3"
                  >
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={line.productId}
                        onValueChange={(v) => updateLine(idx, "productId", v)}
                      >
                        <SelectTrigger className="mt-1 h-11 border-border hover:bg-muted/50 focus:bg-background focus:border-primary">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border shadow-lg">
                          {products.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              className="hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <Label className="text-xs">Unit</Label>
                      <Select
                        value={line.unit}
                        onValueChange={(v) =>
                          updateLine(idx, "unit", v as UnitType)
                        }
                      >
                        <SelectTrigger className="mt-1 h-11 border-border hover:bg-muted/50 focus:bg-background focus:border-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border shadow-lg">
                          {(Object.keys(UNIT_LABELS) as UnitType[]).map((u) => (
                            <SelectItem
                              key={u}
                              value={u}
                              className="hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
                            >
                              {UNIT_LABELS[u]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                        className="mt-1 h-11"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right">
                      <Label className="text-xs">Total</Label>
                      <p className="h-11 flex items-center justify-end font-semibold text-foreground">
                        {fmt(getLineTotal(line))}
                      </p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fmt(subtotal)}
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || loading}
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-base px-6 sm:px-8 h-12"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Invoice"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
