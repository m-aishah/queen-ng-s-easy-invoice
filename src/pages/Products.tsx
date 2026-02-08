import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from "@/lib/store";
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
  const { toast } = useToast();

  useEffect(() => {
    setProducts(getProducts());
  }, []);

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

  const handleSave = () => {
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

    if (editing) {
      updateProduct({ ...data, id: editing.id });
      toast({ title: "Product updated! ✅" });
    } else {
      addProduct(data);
      toast({ title: "Product added! 🎉" });
    }

    setProducts(getProducts());
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setProducts(getProducts());
    toast({ title: "Product removed" });
  };

  const fmt = (n: number) => n > 0 ? `₦${n.toLocaleString()}` : "—";

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add your drinks and their prices here. You'll pick from these when creating invoices.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} size="lg" className="gap-2 text-base">
              <Plus className="w-5 h-5" /> Add Product
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 text-base h-12"
                />
              </div>
              <div>
                <Label>Pieces per Pack</Label>
                <Input
                  type="number"
                  placeholder="24"
                  value={form.piecesPerPack}
                  onChange={(e) => setForm({ ...form, piecesPerPack: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, packPrice: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label>Half Pack (₦)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.halfPackPrice}
                    onChange={(e) => setForm({ ...form, halfPackPrice: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label>Quarter Pack (₦)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.quarterPackPrice}
                    onChange={(e) => setForm({ ...form, quarterPackPrice: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label>Per Piece (₦)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.piecePrice}
                    onChange={(e) => setForm({ ...form, piecePrice: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full h-12 text-base">
                {editing ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No products yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first drink product to get started!
          </p>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Your First Product
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span>Pack: {fmt(p.packPrice)}</span>
                  <span>Half: {fmt(p.halfPackPrice)}</span>
                  <span>Qtr: {fmt(p.quarterPackPrice)}</span>
                  <span>Piece: {fmt(p.piecePrice)}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
                <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id)}>
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
