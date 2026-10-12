import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/home/ProductCard";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { Product } from "@/types";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button-enhanced";

type PriceRangeId = "all" | "under-500" | "500-999" | "1000-plus";

const PRICE_PILLS: Array<{ id: PriceRangeId; label: string }> = [
  { id: "all", label: "All" },
  { id: "under-500", label: "Under ₹500" },
  { id: "500-999", label: "₹500 – ₹999" },
  { id: "1000-plus", label: "₹1,000+" },
];

export default function PresetCatalog() {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();

  const [preset, setPreset] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedThickness, setSelectedThickness] = useState<string>("All");
  const [selectedNumberStyle, setSelectedNumberStyle] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<PriceRangeId>("all");

  useEffect(() => {
    const loadData = async () => {
      if (!presetId) return;
      try {
        setLoading(true);
        const presets = await storefrontApi.products.homepagePresets();
        const matchedPreset = presets.find((p: any) => String(p.id) === String(presetId));
        setPreset(
          matchedPreset || {
            name: "Product Category",
            shortDescription: "Browse dynamic customizable catalog items.",
          }
        );

        const allProducts = await storefrontApi.products.list();
        const filtered = allProducts.filter((p: any) => {
          const pPresetId = p.productType?.id || p.productTypePresetId || p.productTypeId;
          return String(pPresetId) === String(presetId);
        });
        setProducts(filtered);
      } catch (e) {
        console.error("Failed to load catalog data", e);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [presetId]);

  const uniqueSizes = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products.flatMap((p) => {
            const group = p.variantOptionGroups?.find((g) => g.optionName === "Size");
            return group ? group.optionValues : p.variants.map((v) => v.name);
          })
        )
      ).filter(Boolean),
    ],
    [products]
  );

  const uniqueThicknesses = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) => {
            const group = p.variantOptionGroups?.find((g) => g.optionName === "Thickness");
            return group ? group.optionValues : [];
          })
        )
      ).filter(Boolean),
    [products]
  );

  const uniqueNumberStyles = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) => {
            const group = p.variantOptionGroups?.find((g) => g.optionName === "Number Style");
            return group ? group.optionValues : [];
          })
        )
      ).filter(Boolean),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedPrice === "under-500" && p.basePrice >= 500) return false;
      if (selectedPrice === "500-999" && (p.basePrice < 500 || p.basePrice > 999)) return false;
      if (selectedPrice === "1000-plus" && p.basePrice < 1000) return false;

      if (selectedSize !== "All") {
        const sizeGroup = p.variantOptionGroups?.find((g) => g.optionName === "Size");
        const hasSize =
          sizeGroup?.optionValues.includes(selectedSize) ||
          p.variants.some((v) => v.name.includes(selectedSize));
        if (!hasSize) return false;
      }

      if (selectedThickness !== "All") {
        const thickGroup = p.variantOptionGroups?.find((g) => g.optionName === "Thickness");
        if (!thickGroup?.optionValues.includes(selectedThickness)) return false;
      }

      if (selectedNumberStyle !== "All") {
        const styleGroup = p.variantOptionGroups?.find((g) => g.optionName === "Number Style");
        if (!styleGroup?.optionValues.includes(selectedNumberStyle)) return false;
      }

      return true;
    });
  }, [products, selectedPrice, selectedSize, selectedThickness, selectedNumberStyle]);

  const resetFilters = () => {
    setSelectedSize("All");
    setSelectedThickness("All");
    setSelectedNumberStyle("All");
    setSelectedPrice("all");
  };

  const pillClass = (isActive: boolean) =>
    `px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 border ${
      isActive
        ? "bg-primary text-primary-foreground border-primary shadow-brand font-semibold"
        : "bg-background text-foreground/80 border-foreground/20 hover:border-primary hover:text-primary hover:bg-primary/5"
    }`;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading catalog items...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 min-h-[70vh]">
        {/* Header Banner */}
        <div className="mb-10 flex flex-col md:flex-row items-center gap-6 border-b border-border pb-8">
          {preset?.imageUrl && (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden shadow-elegant flex-shrink-0 bg-muted">
              <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2 text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              {preset?.name || "Customizer Catalog"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {preset?.shortDescription || "Select template presets and customize high quality products."}
            </p>
          </div>
        </div>

        {/* Main 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT SIDEBAR: Pill Filter Groups */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-8 pr-2">
            {/* Size */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Size
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={pillClass(selectedSize === size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Thickness */}
            {uniqueThicknesses.length > 0 && (
              <div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                  Thickness
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {["All", ...uniqueThicknesses].map((thick) => (
                    <button
                      key={thick}
                      type="button"
                      onClick={() => setSelectedThickness(thick)}
                      className={pillClass(selectedThickness === thick)}
                    >
                      {thick}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Number Style */}
            {uniqueNumberStyles.length > 0 && (
              <div>
                <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                  Number Style
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {["All", ...uniqueNumberStyles].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedNumberStyle(style)}
                      className={pillClass(selectedNumberStyle === style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Price Range
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {PRICE_PILLS.map((price) => (
                  <button
                    key={price.id}
                    type="button"
                    onClick={() => setSelectedPrice(price.id)}
                    className={pillClass(selectedPrice === price.id)}
                  >
                    {price.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID */}
          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
                <h3 className="font-heading font-semibold text-foreground text-lg">
                  No Matching Products
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Try selecting a different Size, Thickness, or Price filter on the left.
                </p>
                <Button onClick={resetFilters} variant="brand-outline" size="sm">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
