import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Frame } from "lucide-react";
import { storefrontApi } from "@/lib/api/storefrontApi";

interface StoreCategory {
  id: number;
  name: string;
  description?: string | null;
  slug?: string;
}

const CategoryGrid = () => {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await storefrontApi.products.categories<StoreCategory[]>();
        if (!cancelled) setCategories(result);
      } catch {
        if (!cancelled) setError("Categories are temporarily unavailable.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  if (!isLoading && categories.length === 0 && !error) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">Explore Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover products grouped by category.</p>
        </div>

        {error ? (
          <p className="text-center text-sm text-muted-foreground">{error}</p>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug || category.id}`} className="group card-elegant hover:shadow-brand transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Frame className="h-8 w-8 text-foreground/80" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="text-muted-foreground mb-3">{category.description || "Browse personalized products in this category."}</p>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Explore →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
