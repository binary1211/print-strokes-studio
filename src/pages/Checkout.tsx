import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth, useCart } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { storefrontApi } from "@/lib/api/storefrontApi";
import type { Address, CheckoutSession } from "@/types";
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  HelpCircle,
  Loader2,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";

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
  const { state: cartState, clearCart } = useCart();
  const { state: authState } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [address, setAddress] = useState<Omit<Address, "id">>(() =>
    emptyAddress(authState.user?.name ?? "Keval Sharma", authState.user?.phone ?? "9876543210"),
  );
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cod">("upi");
  const [upiId, setUpiId] = useState("keval@oksbi");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8821");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("•••");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CheckoutSession | null>(null);
  const [confirmedAddress, setConfirmedAddress] = useState<Address | Omit<Address, "id"> | null>(null);

  useEffect(() => {
    if (!orderPlaced && !cartState.isLoading && cartState.items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartState.isLoading, cartState.items.length, navigate, orderPlaced]);

  useEffect(() => {
    let cancelled = false;
    const loadAddresses = async () => {
      try {
        const list = await storefrontApi.addresses.list();
        if (cancelled) return;
        setAddresses(list);
        const preferred = list.find((item) => item.isDefault) ?? list[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setConfirmedAddress(preferred);
        } else {
          const fallback = emptyAddress(authState.user?.name ?? "Keval Sharma", authState.user?.phone ?? "9876543210");
          setAddress(fallback);
          setConfirmedAddress(fallback);
        }
      } catch {
        if (!cancelled) toast.error("Unable to load saved addresses");
      } finally {
        if (!cancelled) setIsLoadingAddresses(false);
      }
    };
    void loadAddresses();
    return () => { cancelled = true; };
  }, [authState.user?.name, authState.user?.phone]);

  const displaySubtotal = useMemo(
    () => cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartState.items],
  );

  const shippingCost = displaySubtotal >= 499 ? 0 : 49;
  const grandTotal = displaySubtotal + shippingCost;

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

  const resolveShippingAddress = async (): Promise<{ id: number; addressData: Address | Omit<Address, "id"> }> => {
    if (selectedAddressId !== "new") {
      const existing = addresses.find((a) => a.id === selectedAddressId);
      if (existing) return { id: existing.id, addressData: existing };
    }
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
    return { id: saved.id, addressData: saved };
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const { id: shippingAddressId, addressData } = await resolveShippingAddress();
      setConfirmedAddress(addressData);

      const checkout = await storefrontApi.checkout.create(shippingAddressId);
      checkout.amount = grandTotal;
      checkout.amountInPaise = grandTotal * 100;

      // Simulated payment verification delay for realism
      await new Promise((r) => setTimeout(r, 900));

      await storefrontApi.checkout.verify({
        orderId: checkout.orderId,
        razorpayOrderId: checkout.razorpayOrderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: "sig_mock_verified",
      });

      await clearCart();
      setCompletedOrder(checkout);
      setOrderPlaced(true);
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingAddresses) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (orderPlaced && completedOrder) {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 4);

    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50/50 py-16 px-4">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Payment Confirmed
              </span>
              <h1 className="text-3xl font-heading font-bold text-slate-800">Order Placed Successfully!</h1>
              <p className="text-sm text-slate-500">
                Thank you for your order. We are preparing your custom prints with premium precision.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Order Number</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {completedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Estimated Delivery</span>
                <span className="font-semibold text-slate-800">
                  {deliveryDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", weekday: "short" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Payment Mode</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {paymentMethod === "upi" ? "UPI / Instant Pay" : paymentMethod === "card" ? "Credit / Debit Card" : "Cash on Delivery"}
                </span>
              </div>
              {confirmedAddress && (
                <div className="text-xs pt-1">
                  <span className="text-slate-500 font-medium block mb-1">Delivering to:</span>
                  <p className="font-semibold text-slate-800">
                    {confirmedAddress.name} — {confirmedAddress.addressLine1}, {confirmedAddress.city} {confirmedAddress.pincode}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Amount Paid</span>
                <span className="text-emerald-600 text-base">₹{completedOrder.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => navigate("/")} className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90">
                Continue Shopping
              </Button>
              <Button variant="outline" asChild className="flex-1 h-12 rounded-xl font-bold">
                <Link to="/category/all">Browse More Gifts</Link>
              </Button>
            </div>
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
              className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 bg-white shadow-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-800">Checkout</h1>
              <p className="text-xs text-slate-500">Shipping details & secure payment</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Section */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Truck className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-slate-800">1. Shipping Address</h2>
                </div>

                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="savedAddress">Select saved address</Label>
                    <select
                      id="savedAddress"
                      value={selectedAddressId}
                      onChange={(event) =>
                        setSelectedAddressId(event.target.value === "new" ? "new" : Number(event.target.value))
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        maxLength={120}
                        value={address.name}
                        onChange={(e) => updateAddress("name", e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number (10 digits) *</Label>
                      <Input
                        id="phone"
                        inputMode="numeric"
                        maxLength={10}
                        value={address.phone}
                        onChange={(e) => updateAddress("phone", e.target.value.replace(/\D/g, ""))}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address1">House / Flat / Building No. & Street *</Label>
                      <Input
                        id="address1"
                        maxLength={250}
                        value={address.addressLine1}
                        onChange={(e) => updateAddress("addressLine1", e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="address2">Landmark / Area (Optional)</Label>
                      <Input
                        id="address2"
                        maxLength={250}
                        value={address.addressLine2 ?? ""}
                        onChange={(e) => updateAddress("addressLine2", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        maxLength={100}
                        value={address.city}
                        onChange={(e) => updateAddress("city", e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        maxLength={100}
                        value={address.state}
                        onChange={(e) => updateAddress("state", e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pincode">Pincode (6 digits) *</Label>
                      <Input
                        id="pincode"
                        inputMode="numeric"
                        maxLength={6}
                        value={address.pincode}
                        onChange={(e) => updateAddress("pincode", e.target.value.replace(/\D/g, ""))}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value="India" readOnly className="rounded-xl bg-slate-50 text-slate-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods Section */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-slate-800">2. Select Payment Method</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <QrCode className="w-6 h-6 text-primary" />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">FAST</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">UPI / QR</div>
                      <div className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">Cards</div>
                      <div className="text-[11px] text-slate-500">Credit / Debit Card</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <PackageCheck className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">Cash on Delivery</div>
                      <div className="text-[11px] text-slate-500">Pay when delivered</div>
                    </div>
                  </button>
                </div>

                {/* Sub-panels for payment selection */}
                {paymentMethod === "upi" && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <Label htmlFor="upiId" className="text-xs font-bold text-slate-700">
                      Enter UPI ID / VPA
                    </Label>
                    <Input
                      id="upiId"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="bg-white rounded-xl"
                    />
                    <p className="text-[11px] text-slate-500">
                      A payment request will be sent to your UPI app, or scan QR at delivery.
                    </p>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div>
                      <Label htmlFor="cardNum" className="text-xs font-bold text-slate-700">Card Number</Label>
                      <Input
                        id="cardNum"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="bg-white rounded-xl mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cardExp" className="text-xs font-bold text-slate-700">Expiry (MM/YY)</Label>
                        <Input
                          id="cardExp"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="bg-white rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv" className="text-xs font-bold text-slate-700">CVV</Label>
                        <Input
                          id="cardCvv"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="bg-white rounded-xl mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "cod" && (
                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold">Cash on Delivery selected</p>
                    <p className="text-amber-700">You can pay cash or scan delivery agent's UPI QR code upon arrival.</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL Encrypted & 100% Buyer Protection Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Sidebar Order Summary */}
            <aside className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-slate-800">Order Summary</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">{cartState.itemCount} items</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-3">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate text-slate-800">
                        {item.productName || `Product #${item.productId}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.variantName || "Standard"} × {item.quantity}
                      </p>
                      {item.personalizationSummary && (
                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium mt-1">
                          Customized
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span>₹{displaySubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span>{shippingCost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingCost}`}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (Included)</span>
                  <span>₹0</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base sm:text-lg font-bold text-slate-900">
                <span>Total Payable</span>
                <span className="text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || cartState.items.length === 0}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-md text-white text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming Order…
                  </>
                ) : (
                  `Place Order • ₹${grandTotal.toLocaleString("en-IN")}`
                )}
              </Button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Need help? Call support at 1800-PRINT-STROKES
              </div>
            </aside>
          </form>
        </div>
      </div>
    </Layout>
  );
}
