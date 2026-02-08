import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const emptyForm = {
  name: "",
  packPrice: "",
  halfPackPrice: "",
  quarterPackPrice: "",
  piecePrice: "",
  piecesPerPack: "24",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      packPrice: p.packPrice.toString(),
      halfPackPrice: p.halfPackPrice.toString(),
      quarterPackPrice: p.quarterPackPrice.toString(),
      piecePrice: p.piecePrice.toString(),
      piecesPerPack: p.piecesPerPack.toString(),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Please enter a product name", variant: "destructive" });
      return;
    }

    const data = {
      name: form.name.trim(),
      packPrice: parseFloat(form.packPrice) || 0,
      halfPackPrice: parseFloat(form.halfPackPrice) || 0,
      quarterPackPrice: parseFloat(form.quarterPackPrice) || 0,
      piecePrice: parseFloat(form.piecePrice) || 0,
      piecesPerPack: parseInt(form.piecesPerPack) || 24,
    };

    try {
      setSaving(true);
      if (editing) {
        await updateProduct({ ...data, id: editing.id });
        toast({ title: "Product updated successfully!" });
      } else {
        await addProduct(data);
        toast({ title: "Product added successfully!" });
      }

      const products = await getProducts();
      setProducts(products);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ title: "Failed to save product", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteProduct(id);
      const products = await getProducts();
      setProducts(products);
      toast({ title: "Product deleted successfully" });
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({ title: "Failed to delete product", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (n: number) => (n > 0 ? `₦${n.toLocaleString()}` : "—");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold font-display text-foreground">
                My Products
              </h1>
              <p className="text-muted-foreground mobile-text max-w-2xl">
                Add and manage your drink products and their prices. You'll pick
                from these when creating invoices.
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAdd} className="mobile-button" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editing ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      placeholder="e.g. Coca-Cola 50cl"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="mt-1 text-base h-12"
                    />
                  </div>
                  <div>
                    <Label>Pieces per Pack</Label>
                    <Input
                      type="number"
                      placeholder="24"
                      value={form.piecesPerPack}
                      onChange={(e) =>
                        setForm({ ...form, piecesPerPack: e.target.value })
                      }
                      className="mt-1 h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pack Price (₦)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.packPrice}
                        onChange={(e) =>
                          setForm({ ...form, packPrice: e.target.value })
                        }
                        className="mt-1 h-12"
                      />
                    </div>
                    <div>
                      <Label>Half Pack (₦)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.halfPackPrice}
                        onChange={(e) =>
                          setForm({ ...form, halfPackPrice: e.target.value })
                        }
                        className="mt-1 h-12"
                      />
                    </div>
                    <div>
                      <Label>Quarter Pack (₦)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.quarterPackPrice}
                        onChange={(e) =>
                          setForm({ ...form, quarterPackPrice: e.target.value })
                        }
                        className="mt-1 h-12"
                      />
                    </div>
                    <div>
                      <Label>Per Piece (₦)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.piecePrice}
                        onChange={(e) =>
                          setForm({ ...form, piecePrice: e.target.value })
                        }
                        className="mt-1 h-12"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full h-12 text-base"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {editing ? "Updating..." : "Adding..."}
                      </>
                    ) : editing ? (
                      "Update Product"
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Display */}
          <div className="mobile-grid mt-8 sm:mt-12">
            {loading ? (
              <div className="grid gap-4 sm:gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-48 mb-3" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                          {[...Array(4)].map((_, j) => (
                            <div key={j} className="rounded-lg p-2">
                              <Skeleton className="h-4 w-12 mb-1" />
                              <Skeleton className="h-5 w-16" />
                            </div>
                          ))}
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
            ) : products.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-20 h-20 text-muted-foreground/40 mb-6" />
                <h3 className="text-xl font-semibold font-display text-foreground mb-2">
                  No products yet
                </h3>
                <p className="text-muted-foreground mobile-text mb-6 max-w-md">
                  Add your first drink product to get started creating invoices.
                </p>
                <Button onClick={openAdd} className="mobile-button" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Product
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {products.map((p) => (
                  <Card
                    key={p.id}
                    className="p-4 sm:p-6 transition-all duration-200 hover:shadow-lg border-l-4 border-l-primary"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-primary flex-shrink-0" />
                          <h3 className="font-semibold font-display text-lg text-foreground truncate">
                            {p.name}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                          <div className="bg-secondary/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-muted-foreground font-medium">
                              Pack
                            </div>
                            <div className="font-semibold text-foreground">
                              {fmt(p.packPrice)}
                            </div>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-muted-foreground font-medium">
                              Half Pack
                            </div>
                            <div className="font-semibold text-foreground">
                              {fmt(p.halfPackPrice)}
                            </div>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-muted-foreground font-medium">
                              Quarter Pack
                            </div>
                            <div className="font-semibold text-foreground">
                              {fmt(p.quarterPackPrice)}
                            </div>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-muted-foreground font-medium">
                              Per Piece
                            </div>
                            <div className="font-semibold text-foreground">
                              {fmt(p.piecePrice)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">{p.piecesPerPack}</span>{" "}
                          pieces per pack
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col sm:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(p)}
                          className="flex-1 sm:flex-none hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        >
                          <Pencil className="w-4 h-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="flex-1 sm:flex-none hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                        >
                          {deletingId === p.id ? (
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
      </div>
    </Layout>
  );
}
