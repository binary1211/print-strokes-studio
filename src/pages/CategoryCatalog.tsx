import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/home/ProductCard";
import { storefrontApi } from "@/lib/api/storefrontApi";
import type { Product } from "@/types";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function CategoryCatalog() {
  const { categoryKey = "all" } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim().toLowerCase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const key = categoryKey.toLowerCase();
    const categoryProducts = key === "all"
      ? products
      : products.filter((product) =>
          String(product.categoryId ?? "") === key ||
          slugify(product.category) === key,
        );
    if (!searchQuery) return categoryProducts;
    return categoryProducts.filter((product) =>
      product.title.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery),
    );
  }, [categoryKey, products, searchQuery]);

  const title = searchQuery
    ? `Search results for “${searchParams.get("q") || ""}”`
    : categoryKey === "all"
      ? "All Products"
      : filtered[0]?.category || categoryKey.replaceAll("-", " ");

  return (
    <Layout>
      <main className="container mx-auto px-4 py-12 min-h-[60vh]">
        <div className="mb-8">
          <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
          <h1 className="mt-3 text-3xl font-heading font-bold capitalize">{title}</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-96 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No active products are available in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
    </Layout>
  );
}
