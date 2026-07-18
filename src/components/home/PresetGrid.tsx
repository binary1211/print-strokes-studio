import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { Sparkles, ArrowRight } from "lucide-react";
import type { ProductTypeSummary } from "@/types";

export default function PresetGrid() {
  const [presets, setPresets] = useState<ProductTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await storefrontApi.products.homepagePresets();
        if (data && data.length > 0) {
          // Filter: only showOnHomepage, sort by sortOrder
          const filtered = data
            .filter((preset) => preset.isActive !== false && preset.showOnHomepage)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setPresets(filtered);
        }
      } catch (e) {
        console.error("Failed to load product presets", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (presets.length === 0) {
    return null; // Don't render section if empty
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Best Selling Formats
          </div>
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4 text-slate-800">
            Personalize Your Way
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Choose your customized format preset and start personalizing with templates, custom text or layouts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => navigate(`/preset/${preset.id}`)}
              className="group cursor-pointer bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Preview Container */}
              <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                <img
                  src={
                    preset.imageUrl || "/placeholder.svg"
                  }
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Info Block */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-slate-800 group-hover:text-primary transition-colors text-base">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {preset.shortDescription || "Create beautiful custom prints using this preset."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Customize
                  </span>
                  <span className="text-xs font-bold text-primary group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1">
                    Design Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
