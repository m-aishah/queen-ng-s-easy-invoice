import { Link, useLocation } from "react-router-dom";
import { Package, FileText, Home } from "lucide-react";
import queenLogo from "@/assets/queen-business-logo.png";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/products", label: "My Products", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="no-print border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto mobile-container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={queenLogo}
              alt="Queen Business"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <span className="font-display text-xl lg:text-2xl font-bold text-foreground">
                Queen Business
              </span>
              <div className="text-xs text-muted-foreground font-medium">
                Invoice Solutions
              </div>
            </div>
          </Link>

          <nav className="flex gap-1 sm:gap-2">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 mobile-button rounded-lg font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto mobile-container py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
