import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Edit3,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button-enhanced";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/AppContext";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/apiClient";

const FREE_SHIPPING_THRESHOLD = 499;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isCartOpen, closeCart, state, updateQuantity, removeFromCart, clearCart } = useCart();
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
    closeCart();
    navigate("/checkout");
  };

  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - state.total);
  const freeShippingProgress = Math.min(100, (state.total / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background h-full shadow-2xl border-l border-border"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                Your Cart
                {state.itemCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold">
                    {state.itemCount}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {state.itemCount === 0
                  ? "No items yet"
                  : `${state.itemCount} ${state.itemCount === 1 ? "item" : "items"} selected`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Banner */}
        {state.items.length > 0 && (
          <div className="px-6 py-3 bg-muted/40 border-b border-border shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-foreground">
                <Truck className="w-3.5 h-3.5 text-primary" />
                {amountNeededForFreeShipping === 0 ? (
                  <strong className="text-emerald-600 font-bold">🎉 Free Delivery Unlocked!</strong>
                ) : (
                  <span>
                    Add <strong>₹{amountNeededForFreeShipping}</strong> more for{" "}
                    <strong className="text-primary font-bold">FREE Delivery</strong>
                  </span>
                )}
              </span>
              <span className="text-muted-foreground text-[11px] font-semibold">
                ₹{state.total} / ₹{FREE_SHIPPING_THRESHOLD}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Drawer Body / Items List */}
        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground mb-4">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-heading font-bold text-foreground mb-2">
              Your cart is empty
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-6 leading-relaxed">
              Looks like you haven't added any custom prints, wall clocks, or photo gifts to your
              cart yet.
            </p>
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                closeCart();
                navigate("/category/all");
              }}
              className="rounded-full px-6"
            >
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border space-y-4">
            {state.items.map((item) => {
              const isPending = pendingItemId === item.id;
              return (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-4 items-start group">
                  {/* Item Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl bg-muted/60 border border-border overflow-hidden shrink-0 flex items-center justify-center relative">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.productName || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.productId}`}
                        onClick={closeCart}
                        className="text-sm font-heading font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.productName || `Product #${item.productId}`}
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => void runItemAction(item.id, () => removeFromCart(item.id))}
                        aria-label="Remove item"
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1 -mr-1"
                      >
                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {item.variantName && (
                      <p className="text-xs text-muted-foreground truncate">{item.variantName}</p>
                    )}

                    {item.personalizationSummary && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium truncate max-w-full">
                        {item.personalizationSummary}
                      </Badge>
                    )}

                    {/* Stepper + Price Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-border rounded-lg bg-card h-8">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            void runItemAction(item.id, () =>
                              updateQuantity(item.id, item.quantity - 1)
                            )
                          }
                          aria-label="Decrease quantity"
                          className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isPending || item.quantity >= 99}
                          onClick={() =>
                            void runItemAction(item.id, () =>
                              updateQuantity(item.id, item.quantity + 1)
                            )
                          }
                          aria-label="Increase quantity"
                          className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-heading font-bold text-foreground">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-muted-foreground">
                            ₹{item.price.toLocaleString("en-IN")} each
                          </div>
                        )}
                      </div>
                    </div>

                    {item.customizationJson && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            closeCart();
                            navigate(`/product/${item.productId}/editor`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Design
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drawer Sticky Footer */}
        {state.items.length > 0 && (
          <div className="p-6 border-t border-border bg-card space-y-4 shrink-0 shadow-lg">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-heading font-bold text-foreground">
                  ₹{state.total.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Taxes and final shipping are calculated at checkout.
              </p>
            </div>

            <Button
              variant="brand"
              size="lg"
              onClick={handleCheckout}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-brand"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={closeCart}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                ← Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => void handleClearCart()}
                disabled={isClearing}
                className="text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                {isClearing ? "Clearing..." : "Clear Cart"}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
