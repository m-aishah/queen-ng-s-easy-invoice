import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  getInvoice,
  saveInvoice,
  updateInvoice,
  getUnitPrice,
  Product,
  Invoice,
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
  const { id } = useParams();
  const isEditing = !!id;
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(isEditing);
  const [generating, setGenerating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", unit: "pack", quantity: "1" },
  ]);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [showMobileSteps, setShowMobileSteps] = useState(false);

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

  // Load invoice data if editing
  useEffect(() => {
    if (!isEditing || !id) return;

    const loadInvoice = async () => {
      try {
        setLoadingInvoice(true);
        const invoice = await getInvoice(id);

        if (!invoice) {
          toast({ title: "Invoice not found", variant: "destructive" });
          navigate("/invoices");
          return;
        }

        // Populate form with invoice data
        setCustomerName(invoice.customerName);
        setCustomerPhone(invoice.customerPhone);
        setCustomerAddress(invoice.customerAddress);
        setDate(invoice.date);
        setNotes(invoice.notes);

        // Convert invoice items to line items
        const lineItems: LineItem[] = invoice.items.map((item) => ({
          productId: item.productId,
          unit: item.unit,
          quantity: item.quantity.toString(),
        }));

        setLines(
          lineItems.length > 0
            ? lineItems
            : [{ productId: "", unit: "pack", quantity: "1" }],
        );
      } catch (error) {
        console.error("Failed to load invoice:", error);
        toast({ title: "Failed to load invoice", variant: "destructive" });
        navigate("/invoices");
      } finally {
        setLoadingInvoice(false);
      }
    };

    loadInvoice();
  }, [isEditing, id, toast, navigate]);

  // Check if we should show mobile steps
  useEffect(() => {
    const checkMobile = () => {
      setShowMobileSteps(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const nextStep = () => {
    if (!showMobileSteps) return;

    // Validate step 1 before proceeding
    if (currentStep === 1) {
      if (!customerName.trim()) {
        toast({
          title: "Please enter the customer name",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    if (!showMobileSteps) return;
    if (currentStep === 2) {
      setCurrentStep(1);
    }
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

      if (isEditing && id) {
        const updatedInvoice = await updateInvoice(id, {
          date,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          items,
          subtotal: items.reduce((s, i) => s + i.total, 0),
          notes: notes.trim(),
        });

        toast({ title: `Invoice ${updatedInvoice.invoiceNumber} updated! ✨` });
        navigate(`/invoices/${updatedInvoice.id}`);
      } else {
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
      }
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} invoice:`,
        error,
      );
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} invoice`,
        variant: "destructive",
      });
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
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <p className="text-muted-foreground mobile-text max-w-2xl">
            {isEditing
              ? "Update the invoice details and items below."
              : "Fill in the customer details and select products to generate a professional invoice."}
          </p>
        </div>

        {/* Mobile Step Indicator */}
        {showMobileSteps && !loading && !loadingInvoice && (
          <div className="flex items-center justify-center space-x-4 py-4">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                1
              </div>
              <span
                className={`ml-2 text-sm font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Customer Details
              </span>
            </div>
            <div
              className={`h-0.5 w-8 ${currentStep >= 2 ? "bg-primary" : "bg-secondary"}`}
            />
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`ml-2 text-sm font-medium ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}
              >
                Add Items
              </span>
            </div>
          </div>
        )}

        {loading || loadingInvoice ? (
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
        ) : showMobileSteps ? (
          // Mobile 2-step flow
          <div className="space-y-6">
            {currentStep === 1 && (
              <CustomerDetailsStep
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerAddress={customerAddress}
                setCustomerAddress={setCustomerAddress}
                date={date}
                setDate={setDate}
                notes={notes}
                setNotes={setNotes}
                onNext={nextStep}
              />
            )}

            {currentStep === 2 && (
              <ItemsStep
                products={products}
                lines={lines}
                setLines={setLines}
                addLine={addLine}
                removeLine={removeLine}
                updateLine={updateLine}
                getLineTotal={getLineTotal}
                subtotal={subtotal}
                fmt={fmt}
                handleGenerate={handleGenerate}
                generating={generating}
                isEditing={isEditing}
                onPrev={prevStep}
              />
            )}
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
                      {isEditing ? "Updating..." : "Generating..."}
                    </>
                  ) : isEditing ? (
                    "Update Invoice"
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

// Step Components for Mobile
function CustomerDetailsStep({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  date,
  setDate,
  notes,
  setNotes,
  onNext,
}: {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  customerAddress: string;
  setCustomerAddress: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold mb-6 text-foreground">
        Customer Details
      </h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="e.g. 08012345678"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-2 h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Customer address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="mt-2 min-h-[100px] text-base resize-none"
          />
        </div>
        <div>
          <Label htmlFor="date">Invoice Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 h-12 text-base"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 min-h-[80px] text-base resize-none"
          />
        </div>
      </div>

      <Button onClick={onNext} className="w-full mt-8 h-12 text-base" size="lg">
        Next: Add Items
      </Button>
    </Card>
  );
}

function ItemsStep({
  products,
  lines,
  setLines,
  addLine,
  removeLine,
  updateLine,
  getLineTotal,
  subtotal,
  fmt,
  handleGenerate,
  generating,
  isEditing,
  onPrev,
}: {
  products: Product[];
  lines: LineItem[];
  setLines: (lines: LineItem[]) => void;
  addLine: () => void;
  removeLine: (idx: number) => void;
  updateLine: (idx: number, field: keyof LineItem, value: string) => void;
  getLineTotal: (line: LineItem) => number;
  subtotal: number;
  fmt: (n: number) => string;
  handleGenerate: () => void;
  generating: boolean;
  isEditing: boolean;
  onPrev: () => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0])); // First item starts expanded

  const toggleExpanded = (idx: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedItems(newExpanded);
  };

  const handleAddItem = () => {
    // Auto-collapse completed items before adding new one
    const completedItems = lines
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => line.productId && parseFloat(line.quantity) > 0)
      .map(({ idx }) => idx);

    const newExpandedItems = new Set([...expandedItems]);
    completedItems.forEach((idx) => newExpandedItems.delete(idx));

    addLine();
    // Expand only the new item
    newExpandedItems.add(lines.length);
    setExpandedItems(newExpandedItems);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Add Items
        </h2>

        {/* Table-like header for collapsed items */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2 mb-4">
          <div className="col-span-5">Product</div>
          <div className="col-span-2 text-center">Unit</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, idx) => {
          const isExpanded = expandedItems.has(idx);
          const product = products.find((p) => p.id === line.productId);
          const isComplete = line.productId && parseFloat(line.quantity) > 0;

          return (
            <div key={idx} className="border rounded-lg overflow-hidden">
              {/* Collapsed view - table-like row */}
              <div
                className="p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => toggleExpanded(idx)}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {product?.name || `Item #${idx + 1}`}
                      </span>
                      {!isComplete && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Incomplete
                        </span>
                      )}
                    </div>
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {line.unit &&
                        `${UNIT_LABELS[line.unit]} • Qty: ${line.quantity} • ${fmt(getLineTotal(line))}`}
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm hidden sm:block">
                    {line.unit ? UNIT_LABELS[line.unit] : "—"}
                  </div>
                  <div className="col-span-2 text-center text-sm hidden sm:block">
                    {line.quantity || "—"}
                  </div>
                  <div className="col-span-2 text-right font-medium hidden sm:block">
                    {fmt(getLineTotal(line))}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLine(idx);
                        }}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded view - detailed edit form */}
              {isExpanded && (
                <div className="border-t bg-muted/20 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Product *</Label>
                      <Select
                        value={line.productId}
                        onValueChange={(v) => updateLine(idx, "productId", v)}
                      >
                        <SelectTrigger className="mt-1 h-12 text-base focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {products.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              className="text-base hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Unit *</Label>
                      <Select
                        value={line.unit}
                        onValueChange={(v) =>
                          updateLine(idx, "unit", v as UnitType)
                        }
                      >
                        <SelectTrigger className="mt-1 h-12 text-base focus:border-primary focus:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {(
                            [
                              "pack",
                              "halfPack",
                              "quarterPack",
                              "piece",
                            ] as UnitType[]
                          ).map((u) => (
                            <SelectItem
                              key={u}
                              value={u}
                              className="text-base hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                            >
                              {UNIT_LABELS[u]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                        className="mt-1 h-12 text-base focus:border-primary focus:ring-primary"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Item Total</Label>
                      <div className="mt-1 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <span className="font-semibold text-foreground">
                          {fmt(getLineTotal(line))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Button - Below items */}
      <div className="mt-6 pt-4 border-t">
        <Button
          onClick={handleAddItem}
          variant="outline"
          className="w-full h-12 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Another Item
        </Button>
      </div>

      {/* Total and Actions */}
      <div className="mt-8 p-4 bg-secondary/20 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-foreground">{fmt(subtotal)}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex-1 h-12 text-base hover:bg-primary/10 hover:text-primary hover:border-primary/20"
        >
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1 h-12 text-base"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isEditing ? "Updating..." : "Generating..."}
            </>
          ) : isEditing ? (
            "Update Invoice"
          ) : (
            "Generate Invoice"
          )}
        </Button>
      </div>
    </Card>
  );
}
