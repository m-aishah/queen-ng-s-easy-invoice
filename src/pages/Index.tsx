import { useNavigate } from "react-router-dom";
import { Plus, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Layout from "@/components/Layout";
import queenLogo from "@/assets/queen-business-logo.png";

export default function Index() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center text-center py-12">
        <img src={queenLogo} alt="Queen Business" className="w-24 h-24 object-contain mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Welcome to Queen Business
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Your simple invoice generator for wholesale drinks. Create invoices in seconds!
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card
          className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          onClick={() => navigate("/invoices/new")}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            Create Invoice
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick products, set quantities, and generate a beautiful invoice instantly.
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
          onClick={() => navigate("/products")}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            My Products
          </h2>
          <p className="text-sm text-muted-foreground">
            Add and manage your drink products and their prices.
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group sm:col-span-2"
          onClick={() => navigate("/invoices")}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            View Invoices
          </h2>
          <p className="text-sm text-muted-foreground">
            See all your past invoices, print or share them.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
