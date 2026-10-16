import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Navigation from "./Navigation";
import CartDrawer from "@/components/cart/CartDrawer";
import { useCart } from "@/contexts/AppContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { openCart } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>{children}</main>
      <CartDrawer />
      <footer className="bg-muted/30 mt-24">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-3 text-center md:text-left">
            <img src="/print%20strokes%20logo.png" alt="Print Strokes" className="h-8 w-auto object-contain mx-auto md:mx-0" />
            <p className="text-sm text-muted-foreground">Personalized products printed on premium materials.</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground" aria-label="Footer navigation">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/category/all" className="hover:text-primary transition-colors">Products</Link>
            <Link
              to="/blogs"
              className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition-all"
            >
              Blogs
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Cart
            </button>
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Print Strokes</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
