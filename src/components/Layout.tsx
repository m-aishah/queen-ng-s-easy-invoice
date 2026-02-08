import { Link, useLocation } from "react-router-dom";
import { Package, FileText, Home, Crown } from "lucide-react";

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
      <header className="no-print border-b bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Queen Ng</span>
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
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
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
