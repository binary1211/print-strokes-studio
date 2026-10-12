import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button-enhanced";
import { storefrontApi } from "@/lib/api/storefrontApi";
import type { Product } from "@/types";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type PriceRangeId = "all" | "under-500" | "500-999" | "1000-plus";
type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

const CATEGORY_PILLS = [
  { key: "all", label: "All" },
  { key: "acrylic-cutouts", label: "Acrylic Cutouts" },
  { key: "clocks-decor", label: "Wall Clocks" },
  { key: "phone-cases", label: "Phone Cases" },
  { key: "mugs-drinkware", label: "Mugs & Drinkware" },
  { key: "keychains-accessories", label: "Keychains" },
  { key: "nameplates-desk", label: "Nameplates & Desk" },
];

const MATERIAL_PILLS = [
  "All",
  "Acrylic",
  "Silent Quartz",
  "Ceramic",
  "Pine Wood",
  "Gold Foil",
  "Polycarbonate",
  "USB LEDs",
];

const PRICE_PILLS: Array<{ id: PriceRangeId; label: string }> = [
  { id: "all", label: "All" },
  { id: "under-500", label: "Under ₹500" },
  { id: "500-999", label: "₹500 – ₹999" },
  { id: "1000-plus", label: "₹1,000+" },
];

export default function CategoryCatalog() {
  const { categoryKey = "all" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pill Filter States
  const [selectedMaterial, setSelectedMaterial] = useState<string>("All");
  const [selectedSize, setSelectedSize] = useState<string>("All");
  const [selectedThickness, setSelectedThickness] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeId>("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await storefrontApi.products.list();
        if (!cancelled) setProducts(result);
      } catch {
        if (!cancelled) setError("Products are temporarily unavailable.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const sizeGroup = p.variantOptionGroups?.find((g) => g.optionName === "Size");
      sizeGroup?.optionValues.forEach((v) => set.add(v));
    }
    return ["All", ...Array.from(set)];
  }, [products]);

  const availableThicknesses = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const thickGroup = p.variantOptionGroups?.find((g) => g.optionName === "Thickness");
      thickGroup?.optionValues.forEach((v) => set.add(v));
    }
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const key = categoryKey.toLowerCase();

    const list = products.filter((product) => {
      // 1. Category pill match
      if (key !== "all") {
        const matchesCat =
          String(product.categoryId ?? "") === key ||
          slugify(product.category) === key ||
          (key === "acrylic-cutouts" && product.categoryId === 1) ||
          (key === "phone-cases" && product.categoryId === 2) ||
          (key === "mugs-drinkware" && product.categoryId === 3) ||
          (key === "clocks-decor" && product.categoryId === 4) ||
          (key === "keychains-accessories" && product.categoryId === 5) ||
          (key === "nameplates-desk" && product.categoryId === 6);
        if (!matchesCat) return false;
      }

      // 2. URL search query
      if (searchQuery) {
        const matchesSearch =
          product.title.toLowerCase().includes(searchQuery) ||
          product.description.toLowerCase().includes(searchQuery) ||
          product.category.toLowerCase().includes(searchQuery);
        if (!matchesSearch) return false;
      }

      // 3. Material & Finish pill match
      if (selectedMaterial !== "All") {
        const matLower = selectedMaterial.toLowerCase();
        const hasMat =
          product.materials.some((m) => m.toLowerCase().includes(matLower)) ||
          product.tags.some((t) => t.toLowerCase().includes(matLower)) ||
          product.title.toLowerCase().includes(matLower);
        if (!hasMat) return false;
      }

      // 4. Size pill match
      if (selectedSize !== "All") {
        const sizeGroup = product.variantOptionGroups?.find((g) => g.optionName === "Size");
        const hasSize =
          sizeGroup?.optionValues.includes(selectedSize) ||
          product.variants.some((v) => v.name.includes(selectedSize));
        if (!hasSize) return false;
      }

      // 5. Thickness pill match
      if (selectedThickness !== "All") {
        const thickGroup = product.variantOptionGroups?.find((g) => g.optionName === "Thickness");
        const hasThickness =
          thickGroup?.optionValues.includes(selectedThickness) ||
          product.materials.some((m) => m.toLowerCase().includes(selectedThickness.toLowerCase()));
        if (!hasThickness) return false;
      }

      // 6. Price range pill match
      if (selectedPriceRange === "under-500" && product.basePrice >= 500) return false;
      if (selectedPriceRange === "500-999" && (product.basePrice < 500 || product.basePrice > 999))
        return false;
      if (selectedPriceRange === "1000-plus" && product.basePrice < 1000) return false;

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "price-asc") return a.basePrice - b.basePrice;
      if (sortBy === "price-desc") return b.basePrice - a.basePrice;
      if (sortBy === "name-asc") return a.title.localeCompare(b.title);
      return Number(b.featured) - Number(a.featured);
    });
  }, [
    categoryKey,
    products,
    searchQuery,
    selectedMaterial,
    selectedSize,
    selectedThickness,
    selectedPriceRange,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSelectedMaterial("All");
    setSelectedSize("All");
    setSelectedThickness("All");
    setSelectedPriceRange("all");
    setSortBy("featured");
    if (searchParams.has("q")) setSearchParams({});
    if (categoryKey !== "all") navigate("/category/all");
  };

  const hasActiveFilters =
    categoryKey.toLowerCase() !== "all" ||
    selectedMaterial !== "All" ||
    selectedSize !== "All" ||
    selectedThickness !== "All" ||
    selectedPriceRange !== "all" ||
    Boolean(searchQuery);

  const activeCategoryPill = CATEGORY_PILLS.find((c) => c.key === categoryKey.toLowerCase());
  const title = searchQuery
    ? `Search results for “${searchParams.get("q") || ""}”`
    : categoryKey.toLowerCase() === "all"
      ? "All Products"
      : activeCategoryPill?.label || filtered[0]?.category || categoryKey.replaceAll("-", " ");

  const pillClass = (isActive: boolean) =>
    `px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 border ${
      isActive
        ? "bg-primary text-primary-foreground border-primary shadow-brand font-semibold"
        : "bg-background text-foreground/80 border-foreground/20 hover:border-primary hover:text-primary hover:bg-primary/5"
    }`;

  return (
    <Layout>
      <main className="container mx-auto px-4 py-10 min-h-[70vh]">
        {/* Header Row */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link to="/" className="text-sm font-medium text-primary hover:underline">
              ← Back to home
            </Link>
            <h1 className="mt-2 text-3xl md:text-4xl font-heading font-bold text-foreground capitalize">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-medium text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "Product" : "Products"}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-full border border-foreground/20 bg-background px-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* 12-Column Layout: Clean Pill Sidebar (Left) + Product Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT SIDEBAR: Minimalist Pill Filter Groups (matching reference screenshot) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-8 pr-2">
            {/* 1. Category */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Category
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORY_PILLS.map((cat) => {
                  const isActive = categoryKey.toLowerCase() === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => navigate(`/category/${cat.key}`)}
                      className={pillClass(isActive)}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Material & Finish */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Material & Finish
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {MATERIAL_PILLS.map((mat) => {
                  const isActive = selectedMaterial === mat;
                  return (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setSelectedMaterial(mat)}
                      className={pillClass(isActive)}
                    >
                      {mat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Size */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Size
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={pillClass(isActive)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Thickness */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Thickness
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {availableThicknesses.map((thick) => {
                  const isActive = selectedThickness === thick;
                  return (
                    <button
                      key={thick}
                      type="button"
                      onClick={() => setSelectedThickness(thick)}
                      className={pillClass(isActive)}
                    >
                      {thick}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Price Range */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">
                Price Range
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {PRICE_PILLS.map((price) => {
                  const isActive = selectedPriceRange === price.id;
                  return (
                    <button
                      key={price.id}
                      type="button"
                      onClick={() => setSelectedPriceRange(price.id)}
                      className={pillClass(isActive)}
                    >
                      {price.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-sm font-heading font-semibold text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </aside>

          {/* RIGHT PRODUCT GRID */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-96 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <p className="text-muted-foreground">{error}</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
                <p className="text-lg font-heading font-semibold text-foreground">
                  No matching products found
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Try selecting a different Category, Material, Size, or Price filter on the left.
                </p>
                <Button variant="brand-outline" size="sm" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
