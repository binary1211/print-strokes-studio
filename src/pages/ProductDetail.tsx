import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Heart, Plus, Share, Star } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductTabs from "@/components/product/ProductTabs";
import { Button } from "@/components/ui/button-enhanced";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Design, Product, ProductVariant } from "@/types";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { useCart } from "@/contexts/AppContext";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { toast } from "sonner";
import type { PreviewState, Slot, Template } from "../../../../packages/editor/src/types";

interface ProductDetailLocationState {
  uploadedImageUrl?: string;
  previewState?: PreviewState;
  customization?: {
    template: Template;
    slots: Slot[];
    previewData: Record<string, PreviewState>;
  };
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const stateData = location.state as ProductDetailLocationState | null;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(stateData?.uploadedImageUrl ?? null);
  const [previewState, setPreviewState] = useState<PreviewState | null>(stateData?.previewState ?? null);
  const [customization, setCustomization] = useState<ProductDetailLocationState["customization"]>(stateData?.customization);
  const [textCustomizations, setTextCustomizations] = useState<Array<{ text: string; packs: number }>>([{ text: "", packs: 1 }]);

  useEffect(() => {
    setUploadedImageUrl(stateData?.uploadedImageUrl ?? null);
    setPreviewState(stateData?.previewState ?? null);
    setCustomization(stateData?.customization);
  }, [stateData]);

  useEffect(() => {
    let cancelled = false;
    const loadProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const productData = await storefrontApi.products.get(id);
        if (!productData) {
          toast.error("Product not found");
          navigate("/", { replace: true });
          return;
        }
        if (!cancelled) {
          setProduct(productData);
          setSelectedVariant(productData.variants[0] ?? null);
        }
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, "Failed to load product"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProduct();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const isAcrylicCutouts = product?.slug === "acrylic-cutouts";
  const hasKonvaCustomizer = Boolean(product?.isCustomizable && product.customizationType === "ADVANCED_DESIGNER");
  const hasPhotoCustomizer = Boolean(product?.personalization?.supportsImage);
  const hasTextCustomizer = Boolean(product?.personalization?.supportsText && !hasKonvaCustomizer && !hasPhotoCustomizer);
  const requiresEditor = Boolean(hasKonvaCustomizer || hasPhotoCustomizer);

  const customizationJson = useMemo(() => {
    if (customization) {
      return JSON.stringify({
        version: 1,
        kind: "canvas",
        template: customization.template,
        slots: customization.slots,
        previewData: customization.previewData,
      });
    }
    if (hasTextCustomizer) {
      return JSON.stringify({ version: 1, kind: "text", values: textCustomizations });
    }
    return undefined;
  }, [customization, hasTextCustomizer, textCustomizations]);

  const validateCustomization = () => {
    if (requiresEditor && !customization) {
      navigate(`/product/${product?.id}/editor`);
      return false;
    }
    if (hasTextCustomizer && textCustomizations.some((item) => !item.text.trim())) {
      toast.error("Please enter all required names/text");
      return false;
    }
    return true;
  };

  const buildDesign = (): Design | undefined => {
    if (!product || !selectedVariant || !uploadedImageUrl) return undefined;
    return {
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: selectedVariant.id,
      layers: [{
        id: crypto.randomUUID(),
        type: "image",
        x: previewState?.x ?? 0,
        y: previewState?.y ?? 0,
        width: 300,
        height: 400,
        url: uploadedImageUrl,
        originalUrl: uploadedImageUrl,
        visible: true,
        zIndex: 1,
        rotation: previewState?.rotation ?? 0,
        opacity: 1,
        scale: previewState?.scaleX ?? 1,
        scaleX: previewState?.scaleX ?? 1,
        scaleY: previewState?.scaleY ?? 1,
        cropX: 0,
        cropY: 0,
        cropWidth: 300,
        cropHeight: 400,
      }],
      canvasWidth: selectedVariant.width || 800,
      canvasHeight: selectedVariant.height || 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariant || isSaving || !validateCustomization()) return false;
    setIsSaving(true);
    try {
      const textSummary = hasTextCustomizer
        ? textCustomizations.map((item) => `${item.text.trim()} (x${item.packs})`).join(", ")
        : customization ? "Customized design" : undefined;
      await addToCart({
        productId: product.id,
        productName: product.title,
        productSlug: product.slug,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        quantity,
        price: selectedVariant.price,
        design: buildDesign(),
        customizationJson,
        personalizationSummary: textSummary,
        thumbnail: uploadedImageUrl || product.images[0],
      });
      toast.success("Added to cart");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add to cart"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuyNow = async () => {
    if (await handleAddToCart()) navigate("/cart");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} variant="brand">
            Return to Home
          </Button>
        </div>
      </Layout>
    );
  }

  const galleryImages = uploadedImageUrl ? [uploadedImageUrl, ...product.images] : product.images;

  const parseDimensions = (dimensionStr: string) => {
    if (!dimensionStr) return { width: "12", height: "12" };
    // Find all numbers optionally followed by decimals in the string
    const matches = dimensionStr.match(/(\d+(?:\.\d+)?)/g);
    if (matches && matches.length >= 2) {
      return { width: matches[0], height: matches[1] };
    }
    if (matches && matches.length === 1) {
      return { width: matches[0], height: matches[0] };
    }
    return { width: "12", height: "12" };
  };

  const { width: parsedWidth, height: parsedHeight } = parseDimensions(
    selectedVariant?.dimensions || selectedVariant?.name || "12x12"
  );

  const widthVal = parseFloat(parsedWidth) || 12;
  const heightVal = parseFloat(parsedHeight) || 12;
  const ratio = widthVal / heightVal;

  const maxDim = Math.max(widthVal, heightVal);
  const cutoutSizePercent = Math.min(65, Math.max(30, (maxDim / 16) * 65));
  const cutoutWidth = ratio > 1 ? `${cutoutSizePercent}%` : "auto";
  const cutoutHeight = ratio <= 1 ? `${cutoutSizePercent}%` : "auto";

  const handleEditAgain = () => {
    navigate(`/product/${product.id}/editor`, {
      state: {
        uploadedImageUrl,
        previewState,
      },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column: Product Image Gallery / Wall Mockup Preview */}
          <div className="lg:col-span-1">
            {uploadedImageUrl ? (
              <div
                className="relative aspect-square w-full rounded-3xl border border-slate-200 overflow-hidden bg-cover bg-center shadow-lg"
                style={{ backgroundImage: "url('/mockup_wall_bg.jpg')" }}
              >
                {/* Edit Again Button */}
                <button
                  onClick={handleEditAgain}
                  className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Again
                </button>

                {/* Main Wall Canvas Area containing Cutout & Dimension lines */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="relative flex items-center justify-center w-[80%] h-[80%]">
                    {/* Top Dimension Label */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 select-none">
                      <div className="h-[1px] bg-slate-400 flex-1 opacity-70" />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-wide bg-slate-50/50 px-2 py-0.5 rounded">
                        {parsedWidth} inch
                      </span>
                      <div className="h-[1px] bg-slate-400 flex-1 opacity-70" />
                    </div>

                    {/* Left Dimension Label */}
                    <div
                      className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center gap-2 select-none"
                      style={{ width: "20px" }}
                    >
                      <div className="w-[1px] bg-slate-400 flex-1 opacity-70" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 tracking-wide bg-slate-50/50 px-1 py-0.5 rounded rotate-90 origin-center whitespace-nowrap">
                        {parsedHeight} inch
                      </span>
                      <div className="w-[1px] bg-slate-400 flex-1 opacity-70" />
                    </div>

                    {/* The Cutout Image itself */}
                    <div
                      className="transition-all duration-300 ease-out flex items-center justify-center bg-transparent"
                      style={{
                        width: cutoutWidth,
                        height: cutoutHeight,
                        aspectRatio: ratio,
                        marginTop: "20px",
                        marginLeft: "20px",
                      }}
                    >
                      <img
                        src={uploadedImageUrl}
                        alt="Custom Cutout"
                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ProductImageGallery images={galleryImages} title={product.title} />
            )}
          </div>

          {/* Right Column: Product Info & Customization Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
                  {product.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">(127 reviews)</span>
                </div>
                <Badge variant={product.stock === "in-stock" ? "default" : "secondary"}>
                  {product.stock === "in-stock" ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>

              <p className="text-muted-foreground mb-6">
                {product.description}
              </p>
            </div>

            {/* Product Configuration Options */}
            <ProductInfo
              product={product}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              quantity={quantity}
              onQuantityChange={setQuantity}
              hideQuantity={hasTextCustomizer}
            />

            {/* Inline Text Customizer Widget */}
            {hasTextCustomizer && (
              <div className="border border-indigo-100 rounded-2xl p-5 bg-indigo-50/20 space-y-4 mb-6">
                <div className="flex items-center justify-between border-b border-indigo-50/50 pb-2">
                  <span className="text-sm font-bold text-slate-800">Customize Your Text</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Text Only
                  </span>
                </div>

                {textCustomizations.map((item, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Name {idx + 1}</span>
                      {textCustomizations.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = textCustomizations.filter((_, i) => i !== idx);
                            setTextCustomizations(updated);
                            setQuantity(updated.reduce((acc, x) => acc + x.packs, 0));
                          }}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Live Preview Bar */}
                    <div className="h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-medium text-xs tracking-wider select-none relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 opacity-90" />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-1.5 bg-yellow-500 rounded" />
                      <span className="relative z-10 font-sans text-xs text-yellow-400">
                        {item.text || "PREVIEW TEXT"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Your Text:</label>
                        <input
                          type="text"
                          value={item.text}
                          placeholder="Type your custom text"
                          maxLength={20}
                          onChange={(e) => {
                            const updated = [...textCustomizations];
                            updated[idx].text = e.target.value;
                            setTextCustomizations(updated);
                          }}
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 font-medium"
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Packs:</label>
                        <select
                          value={item.packs}
                          onChange={(e) => {
                            const updated = [...textCustomizations];
                            updated[idx].packs = parseInt(e.target.value);
                            setTextCustomizations(updated);
                            setQuantity(updated.reduce((acc, x) => acc + x.packs, 0));
                          }}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 font-bold bg-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const updated = [...textCustomizations, { text: "", packs: 1 }];
                    setTextCustomizations(updated);
                    setQuantity(updated.reduce((acc, x) => acc + x.packs, 0));
                  }}
                  className="w-full border border-dashed border-indigo-200 rounded-xl py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Name
                </button>
              </div>
            )}

            {/* Price and Cart Submission block */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div className="text-xs text-muted-foreground font-medium">Calculated Price</div>
              <div className="text-3xl font-heading font-bold text-foreground">
                ₹{((selectedVariant?.price || product.basePrice) * quantity).toLocaleString("en-IN")}
              </div>

              {!uploadedImageUrl && (hasKonvaCustomizer || hasPhotoCustomizer) ? (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate(`/product/${product.id}/editor`)}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm h-12 flex items-center justify-center gap-2"
                  >
                    {hasKonvaCustomizer ? "Personalize Design" : "Upload & Edit Photo"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="brand-outline"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isSaving || product.stock !== "in-stock"}
                    className="flex-1 font-semibold rounded-xl"
                  >
                    {isSaving ? "Adding..." : "Add to Cart"}
                  </Button>

                  <Button
                    variant="brand"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isSaving || product.stock !== "in-stock"}
                    className="flex-1 font-semibold rounded-xl"
                  >
                    Buy Now
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center">
                Final shipping and return eligibility are confirmed during checkout
              </div>
            </div>

            {/* Materials and Dimensions metadata */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div>
                <h4 className="font-semibold mb-2">Materials</h4>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material) => (
                    <Badge key={material} variant="outline">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedVariant && (
                <div>
                  <h4 className="font-semibold mb-2">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedVariant.dimensions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Grid from the screenshot */}
        {isAcrylicCutouts && (
          <div className="mt-16 border-t border-slate-200 pt-12">
            <h2 className="text-2xl font-heading font-bold text-center mb-10 text-foreground">Product Details:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: HD Print Quality */}
              <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col">
                <img
                  src="/detail_hd_quality.jpg"
                  alt="HD Print Quality"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between bg-card">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-foreground">HD Print Quality</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our Acrylic HD print quality provides exceptional clarity and vibrant colors, giving your photos a sleek, modern look. Durable and long-lasting, they are designed to showcase your memories in stunning detail.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: 3mm Thickness */}
              <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col">
                <img
                  src="/detail_thickness.jpg"
                  alt="3mm Thickness"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between bg-card">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-foreground">3mm Thickness</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The 3mm thickness of our acrylic cutouts ensures a sleek, lightweight design without compromising on durability. It provides a crystal-clear display that enhances the depth and vibrancy of your photos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Easy To Install */}
              <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col">
                <img
                  src="/detail_easy_install.jpg"
                  alt="Easy To Install"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between bg-card">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-foreground">Easy To Install</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our acrylic cutouts come with easy-to-install adhesive tape, allowing for quick, hassle-free mounting. Enjoy a secure, clean display without the need for nails or screws.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Acrylic Cutout */}
              <div className="bg-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col">
                <img
                  src="/detail_structure.jpg"
                  alt="Acrylic Cutout"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between bg-card">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-base text-foreground">Acrylic Cutout</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      An acrylic photo cutout is a crystal-clear front acrylic sheet with high-resolution print in the backing layer that enhances the image details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Tabs */}
        <ProductTabs product={product} />
      </div>
    </Layout>
  );
};

export default ProductDetail;
