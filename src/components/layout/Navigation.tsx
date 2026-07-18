import { Link } from "react-router-dom";
import { LogOut, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button-enhanced";
import { Badge } from "@/components/ui/badge";
import { useAuth, useCart } from "@/contexts/AppContext";

const Navigation = () => {
  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();

  return (
    <nav className="nav-sticky">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center group" aria-label="Print Strokes home">
            <img src="/print%20strokes%20logo.png" alt="Print Strokes" className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          <div className="flex items-center space-x-3">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" aria-label={`Shopping cart with ${cartState.itemCount} items`}>
                <ShoppingCart className="h-5 w-5" />
                {cartState.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center px-1 text-xs bg-primary">
                    {Math.min(cartState.itemCount, 99)}
                  </Badge>
                )}
              </Button>
            </Link>

            {authState.isAuthenticated ? (
              <Button variant="brand-outline" size="sm" onClick={() => void logout()} disabled={authState.isLoading}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button variant="brand-outline" size="sm" asChild>
                <Link to="/login"><User className="h-4 w-4" />Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
