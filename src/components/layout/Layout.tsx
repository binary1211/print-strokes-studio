import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Navigation from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navigation />
    <main>{children}</main>
    <footer className="bg-muted/30 mt-24">
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="space-y-3 text-center md:text-left">
          <img src="/print%20strokes%20logo.png" alt="Print Strokes" className="h-8 w-auto object-contain mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">Personalized products printed on premium materials.</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground" aria-label="Footer navigation">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Link to="/category/all" className="hover:text-primary">Products</Link>
          <Link to="/cart" className="hover:text-primary">Cart</Link>
        </nav>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Print Strokes</p>
      </div>
    </footer>
  </div>
);

export default Layout;
