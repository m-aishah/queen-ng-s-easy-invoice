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
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center py-8 lg:py-12">
          <img
            src={queenLogo}
            alt="Queen Business"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain mb-6"
          />

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-foreground">
              Invoice Generator
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Built with ❤️ by Aishah for Queen Business. Create professional
              invoices in seconds.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <Card
            className="group p-6 sm:p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border border-border hover:border-primary/20 relative overflow-hidden"
            onClick={() => navigate("/invoices/new")}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
              Create Invoice
            </h2>
            <p className="text-muted-foreground leading-relaxed mobile-text">
              Pick products, set quantities, and generate beautiful invoices
              instantly.
            </p>
          </Card>

          <Card
            className="group p-6 sm:p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-primary/20 relative overflow-hidden"
            onClick={() => navigate("/products")}
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
              My Products
            </h2>
            <p className="text-muted-foreground leading-relaxed mobile-text">
              Manage your drink products and set pricing for different pack
              sizes.
            </p>
          </Card>

          <Card
            className="group p-6 sm:p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-primary/20 relative overflow-hidden sm:col-span-2 lg:col-span-1"
            onClick={() => navigate("/invoices")}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
              View Invoices
            </h2>
            <p className="text-muted-foreground leading-relaxed mobile-text">
              Browse all your generated invoices and download them as PDFs.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
