import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { Product } from "@/types";
import { Grid, Filter, RefreshCw, Layers, SlidersHorizontal, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PresetCatalog() {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();

  // Core State
  const [preset, setPreset] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [selectedOrientation, setSelectedOrientation] = useState<string>("All");

  useEffect(() => {
    const loadData = async () => {
      if (!presetId) return;
      try {
        setLoading(true);
        // 1. Fetch presets list to find current preset info
        const presets = await storefrontApi.products.homepagePresets();
        const matchedPreset = presets.find((p: any) => String(p.id) === String(presetId));
        setPreset(matchedPreset || { name: "Product Category", shortDescription: "Browse dynamic customizable catalog items." });

        // 2. Fetch all products and filter by preset ID
        const allProducts = await storefrontApi.products.list();
        const filtered = allProducts.filter((p: any) => {
          // Check productType.id or productTypePresetId or similar mapping properties
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
    loadData();
  }, [presetId]);

  // Extract unique filters from product list
  const uniqueThemes = Array.from(
    new Set(
      products.flatMap((p: any) => {
        const themesList = p.themes || [];
        return themesList.map((t: any) => (typeof t === "object" ? t.name : String(t)));
      })
    )
  ).filter(Boolean) as string[];

  const uniqueOrientations = Array.from(
    new Set(
      products.flatMap((p: any) => {
        const orientationGroup = p.variantOptionGroups?.find(
          (g: any) => g.optionName?.toLowerCase() === "orientation"
        );
        return orientationGroup ? orientationGroup.optionValues : [];
      })
    )
  ).filter(Boolean) as string[];

  // Filter matched products based on user selections
  const filteredProducts = products.filter((p: any) => {
    // 1. Theme Filter
    if (selectedTheme !== "All") {
      const pThemes = p.themes || [];
      const hasTheme = pThemes.some((t: any) => {
        const tName = typeof t === "object" ? t.name : String(t);
        return tName.toLowerCase() === selectedTheme.toLowerCase();
      });
      if (!hasTheme) return false;
    }

    // 2. Orientation Filter
    if (selectedOrientation !== "All") {
      const orientationGroup = p.variantOptionGroups?.find(
        (g: any) => g.optionName?.toLowerCase() === "orientation"
      );
      if (!orientationGroup) return false;
      const hasOrientation = orientationGroup.optionValues.some(
        (v: any) => v.toLowerCase() === selectedOrientation.toLowerCase()
      );
      if (!hasOrientation) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-slate-50/50">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Loading catalog items...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/40 pb-16">
        {/* Banner Section */}
        <div className="bg-white border-b border-slate-200 py-12 shadow-sm">
          <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center gap-8">
            {preset?.imageUrl && (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-md flex-shrink-0 bg-slate-100">
                <img src={preset.imageUrl} alt={preset.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2 text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-800">
                {preset?.name || "Customizer Catalog"}
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                {preset?.shortDescription || "Select template presets and customize high quality products."}
              </p>
            </div>
          </div>
        </div>

        {/* Catalog Main Grid Area */}
        <div className="container mx-auto px-4 max-w-7xl mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar Filters */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-slate-800">Refine Catalog</span>
                </div>

                {/* Themes List Selector */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Occasion / Themes
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setSelectedTheme("All")}
                      className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                        selectedTheme === "All"
                          ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      All Themes
                    </button>
                    {uniqueThemes.map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setSelectedTheme(theme)}
                        className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                          selectedTheme === theme
                            ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientations Selector */}
                {uniqueOrientations.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Canvas Orientation
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setSelectedOrientation("All")}
                        className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                          selectedOrientation === "All"
                            ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        All Orientations
                      </button>
                      {uniqueOrientations.map((orientation) => (
                        <button
                          key={orientation}
                          onClick={() => setSelectedOrientation(orientation)}
                          className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                            selectedOrientation === orientation
                              ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {orientation}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Display List */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Showing {filteredProducts.length} of {products.length} Products
                </span>
                <div className="flex items-center gap-1">
                  <Grid className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Filter className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-slate-700 text-lg">No Matching Products</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing theme/orientation filters to see other products in this preset category.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedTheme("All");
                      setSelectedOrientation("All");
                    }}
                    variant="outline"
                    className="text-xs font-bold border-slate-200 hover:bg-slate-50"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="group cursor-pointer bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Product Media Box */}
                      <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative flex items-center justify-center border-b border-slate-100">
                        <img
                          src={product.images[0] || "/placeholder-product.png"}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.isCustomizable && (
                          <span className="absolute top-3 right-3 text-[9px] font-bold tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">
                            Customizable
                          </span>
                        )}
                      </div>

                      {/* Info Panel */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                            {product.category}
                          </span>
                          <h3 className="font-heading font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {product.title}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-sm font-bold text-slate-900">
                            ₹{product.basePrice.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] font-bold text-primary group-hover:underline">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
