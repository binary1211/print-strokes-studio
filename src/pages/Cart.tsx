import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button-enhanced";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth, useCart } from "@/contexts/AppContext";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { toast } from "sonner";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, removeFromCart, updateQuantity, clearCart } = useCart();
  const { state: authState } = useAuth();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const runItemAction = async (itemId: string, action: () => Promise<void>) => {
    if (pendingItemId) return;
    setPendingItemId(itemId);
    try {
      await action();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update cart"));
    } finally {
      setPendingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to clear cart"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckout = () => {
    if (state.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (state.isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add a personalized item to continue.</p>
            <Button asChild variant="brand" size="lg">
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center min-w-0">
            <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">{state.itemCount} {state.itemCount === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void handleClearCart()} disabled={isClearing}>
            {isClearing ? "Clearing…" : "Clear Cart"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => {
              const isPending = pendingItemId === item.id;
              return (
                <div key={item.id} className="card-elegant p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={item.thumbnail || "/placeholder.svg"}
                        alt={item.productName || "Product preview"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.productName || `Product #${item.productId}`}</h3>
                          <p className="text-sm text-muted-foreground">{item.variantName || "Standard"}</p>
                          {item.personalizationSummary && (
                            <Badge variant="secondary" className="w-fit">{item.personalizationSummary}</Badge>
                          )}
                        </div>
                        <div className="sm:text-right">
                          <div className="text-lg font-semibold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
                          <div className="text-sm text-muted-foreground">₹{item.price.toLocaleString("en-IN")} each</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => void runItemAction(item.id, () => updateQuantity(item.id, item.quantity - 1))}
                              className="h-8 w-8 p-0"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending || item.quantity >= 100}
                              onClick={() => void runItemAction(item.id, () => updateQuantity(item.id, item.quantity + 1))}
                              className="h-8 w-8 p-0"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {item.customizationJson && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/product/${item.productId}/editor`)}>
                              <Edit3 className="h-3 w-3 mr-1" /> Edit Design
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => void runItemAction(item.id, () => removeFromCart(item.id))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="card-elegant p-6 sticky top-24">
              <h2 className="text-xl font-heading font-semibold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({state.itemCount} items)</span>
                  <span>₹{state.total.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Free shipping on orders above ₹499. Taxes included.
                </p>
              </div>
              <Separator className="mb-4" />
              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Cart Subtotal</span>
                <span>₹{state.total.toLocaleString("en-IN")}</span>
              </div>
              <Button variant="brand" size="lg" onClick={handleCheckout} className="w-full mb-4">
                Proceed to Checkout
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
