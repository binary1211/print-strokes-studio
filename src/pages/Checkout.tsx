import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth, useCart } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { Address, CheckoutSession } from "@/types";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: { description?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpay = async () => {
  if (window.Razorpay) return;
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout")), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.head.appendChild(script);
  });
};

const emptyAddress = (name = "", phone = ""): Omit<Address, "id"> => ({
  name,
  phone,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  isDefault: false,
});

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: cartState, refreshCart } = useCart();
  const { state: authState } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState<Omit<Address, "id">>(() => emptyAddress());
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CheckoutSession | null>(null);

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [authState.isAuthenticated, authState.isLoading, location.pathname, navigate]);

  useEffect(() => {
    if (!orderPlaced && !cartState.isLoading && cartState.items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartState.isLoading, cartState.items.length, navigate, orderPlaced]);

  useEffect(() => {
    if (!authState.isAuthenticated) return;
    let cancelled = false;
    const loadAddresses = async () => {
      try {
        const list = await storefrontApi.addresses.list();
        if (cancelled) return;
        setAddresses(list);
        const preferred = list.find((item) => item.isDefault) ?? list[0];
        if (preferred) setSelectedAddressId(preferred.id);
        else setAddress(emptyAddress(authState.user?.name ?? "", authState.user?.phone ?? ""));
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Unable to load saved addresses"));
      } finally {
        if (!cancelled) setIsLoadingAddresses(false);
      }
    };
    void loadAddresses();
    return () => { cancelled = true; };
  }, [authState.isAuthenticated, authState.user?.name, authState.user?.phone]);

  const displaySubtotal = useMemo(
    () => cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartState.items],
  );

  const updateAddress = (field: keyof Omit<Address, "id">, value: string | boolean) => {
    setAddress((current) => ({ ...current, [field]: value }));
  };

  const validateNewAddress = () => {
    if (!address.name.trim() || !address.addressLine1.trim() || !address.city.trim() || !address.state.trim()) {
      throw new Error("Please fill all required shipping fields");
    }
    if (!/^[6-9][0-9]{9}$/.test(address.phone.trim())) {
      throw new Error("Enter a valid 10-digit Indian mobile number");
    }
    if (!/^[1-9][0-9]{5}$/.test(address.pincode.trim())) {
      throw new Error("Enter a valid 6-digit pincode");
    }
  };

  const resolveShippingAddressId = async () => {
    if (selectedAddressId !== "new") return selectedAddressId;
    validateNewAddress();
    const saved = await storefrontApi.addresses.create({
      ...address,
      name: address.name.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2?.trim() || null,
      city: address.city.trim(),
      state: address.state.trim(),
      country: address.country.trim() || "India",
      pincode: address.pincode.trim(),
    });
    setAddresses((current) => [...current, saved]);
    setSelectedAddressId(saved.id);
    return saved.id;
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (isProcessing) return;
    if (!authState.isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    setIsProcessing(true);
    try {
      const shippingAddressId = await resolveShippingAddressId();
      const checkout = await storefrontApi.checkout.create(shippingAddressId);
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable");

      const razorpay = new window.Razorpay({
        key: checkout.razorpayKeyId,
        amount: checkout.amountInPaise,
        currency: checkout.currency || "INR",
        name: "Print Strokes",
        description: `Order ${checkout.orderNumber}`,
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: checkout.customerName || authState.user?.name || "",
          email: checkout.customerEmail || authState.user?.email || "",
          contact: checkout.customerPhone || authState.user?.phone || undefined,
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment window closed. Your order has not been confirmed.");
          },
        },
        handler: async (payment) => {
          try {
            await storefrontApi.checkout.verify({
              orderId: checkout.orderId,
              razorpayOrderId: checkout.razorpayOrderId,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            });
            await refreshCart();
            setCompletedOrder(checkout);
            setOrderPlaced(true);
            toast.success("Payment verified and order placed successfully");
          } catch (error) {
            toast.error(getApiErrorMessage(error, "Payment verification failed"));
          } finally {
            setIsProcessing(false);
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        setIsProcessing(false);
        toast.error(response.error?.description || "Payment failed. Please try again.");
      });
      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      toast.error(getApiErrorMessage(error, "Unable to start checkout"));
    }
  };

  if (authState.isLoading || isLoadingAddresses) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (orderPlaced && completedOrder) {
    return (
      <Layout>
        <div className="min-h-[75vh] flex items-center justify-center bg-slate-50/30 py-16 px-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-heading font-bold text-slate-800">Order Placed Successfully</h1>
              <p className="text-sm text-slate-500">Your payment was verified securely.</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Order Number</span>
                <span className="font-bold text-slate-800 font-mono">{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200 pt-3">
                <span className="text-slate-500">Paid Amount</span>
                <span className="font-bold text-slate-800">₹{completedOrder.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Button onClick={() => navigate("/")} className="w-full h-11 rounded-xl font-bold">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/40 pb-20">
        <div className="container mx-auto px-4 max-w-7xl pt-8">
          <div className="flex items-center gap-3 mb-8">
            <button
              type="button"
              aria-label="Back to cart"
              onClick={() => navigate("/cart")}
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-800">Checkout</h1>
              <p className="text-xs text-slate-500">Address and secure Razorpay payment</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Truck className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-slate-800">Shipping Address</h2>
                </div>

                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="savedAddress">Saved address</Label>
                    <select
                      id="savedAddress"
                      value={selectedAddressId}
                      onChange={(event) => setSelectedAddressId(event.target.value === "new" ? "new" : Number(event.target.value))}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      {addresses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.addressLine1}, {item.city} {item.pincode}
                        </option>
                      ))}
                      <option value="new">+ Add a new address</option>
                    </select>
                  </div>
                )}

                {(addresses.length === 0 || selectedAddressId === "new") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" maxLength={120} value={address.name} onChange={(e) => updateAddress("name", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" inputMode="numeric" maxLength={10} value={address.phone} onChange={(e) => updateAddress("phone", e.target.value.replace(/\D/g, ""))} required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address1">Address Line 1 *</Label>
                      <Input id="address1" maxLength={250} value={address.addressLine1} onChange={(e) => updateAddress("addressLine1", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address2">Address Line 2</Label>
                      <Input id="address2" maxLength={250} value={address.addressLine2 ?? ""} onChange={(e) => updateAddress("addressLine2", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" maxLength={100} value={address.city} onChange={(e) => updateAddress("city", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" maxLength={100} value={address.state} onChange={(e) => updateAddress("state", e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input id="pincode" inputMode="numeric" maxLength={6} value={address.pincode} onChange={(e) => updateAddress("pincode", e.target.value.replace(/\D/g, ""))} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" maxLength={100} value={address.country} onChange={(e) => updateAddress("country", e.target.value)} required />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Secure online payment</h2>
                    <p className="text-xs text-slate-500">Available payment methods are shown inside Razorpay Checkout.</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-slate-800">Order Summary</h2>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-3">
                    <img src={item.thumbnail || "/placeholder.svg"} alt="" className="h-14 w-14 rounded-lg object-cover bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.productName || `Product #${item.productId}`}</p>
                      <p className="text-xs text-slate-500">{item.variantName || "Standard"} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-600">Cart subtotal</span>
                <span className="font-bold">₹{displaySubtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-slate-500">The final payable amount is calculated and signed by the backend before Razorpay opens.</p>
              <Button type="submit" disabled={isProcessing || cartState.items.length === 0} className="w-full h-12 rounded-xl font-bold">
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : "Pay Securely"}
              </Button>
            </aside>
          </form>
        </div>
      </div>
    </Layout>
  );
}
