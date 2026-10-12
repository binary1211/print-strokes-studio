import { useState, useEffect } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { Product, ProductVariant } from "@/types";
import { cn } from "@/lib/utils";

interface ProductInfoProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  hideQuantity?: boolean;
}

// Fallback legacy parser for statically defined products in JSON mock list
const parseVariantName = (name: string) => {
  const clean = name.replace("Option: ", "").trim();
  const partsOrientation = clean.split("/");
  const orientation = partsOrientation[1] ? partsOrientation[1].trim() : "";
  const partsSizeThickness = partsOrientation[0].split("+");
  const size = partsSizeThickness[0] ? partsSizeThickness[0].trim() : clean;
  const thickness = partsSizeThickness[1] ? partsSizeThickness[1].trim() : "";
  return { size, thickness, orientation };
};

const ProductInfo = ({
  product,
  selectedVariant,
  onVariantChange,
  quantity,
  onQuantityChange,
  hideQuantity = false,
}: ProductInfoProps) => {
  const optionGroups = product.variantOptionGroups || [];
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  // Sync state selections when parent passes selectedVariant
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.optionValues && Object.keys(selectedVariant.optionValues).length > 0) {
        setSelectedValues(selectedVariant.optionValues);
      } else {
        const attrs = parseVariantName(selectedVariant.dimensions || selectedVariant.name);
        const fallbackValues: Record<string, string> = {};
        if (attrs.size) fallbackValues["Size"] = attrs.size;
        if (attrs.thickness) fallbackValues["Thickness"] = attrs.thickness;
        if (attrs.orientation) fallbackValues["Orientation"] = attrs.orientation;
        setSelectedValues(fallbackValues);
      }
    }
  }, [selectedVariant]);

  const handleSelectValue = (optionName: string, value: string) => {
    const nextValues = { ...selectedValues, [optionName]: value };
    setSelectedValues(nextValues);

    // Try finding a matching variant combining all options
    let match = product.variants.find((v) => {
      if (v.optionValues && Object.keys(v.optionValues).length > 0) {
        return Object.entries(nextValues).every(([name, val]) => v.optionValues?.[name] === val);
      }
      const { size, thickness, orientation } = parseVariantName(v.dimensions || v.name);
      const sizeMatch = !nextValues["Size"] || size === nextValues["Size"];
      const thicknessMatch = !nextValues["Thickness"] || thickness === nextValues["Thickness"];
      const orientationMatch = !nextValues["Orientation"] || orientation === nextValues["Orientation"];
      return sizeMatch && thicknessMatch && orientationMatch;
    });

    // Fallback: If no absolute match, match on the updated attribute first
    if (!match) {
      match = product.variants.find((v) => {
        if (v.optionValues && Object.keys(v.optionValues).length > 0) {
          return v.optionValues[optionName] === value;
        }
        const { size, thickness, orientation } = parseVariantName(v.dimensions || v.name);
        if (optionName === "Size") return size === value;
        if (optionName === "Thickness") return thickness === value;
        if (optionName === "Orientation") return orientation === value;
        return false;
      });
    }

    if (match) {
      onVariantChange(match);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    onQuantityChange(newQuantity);
  };

  const hasMultipleVariants = product.variants.length > 1;

  return (
    <div className="space-y-6">
      {/* Variant Option Groups rendering */}
      {hasMultipleVariants && optionGroups.length > 0 && (
        <div className="space-y-5 border-t border-b border-slate-100 py-5">
          {optionGroups.map((group) => {
            const hasImages = Boolean(group.optionImages && Object.keys(group.optionImages).length > 0);
            const activeValue = selectedValues[group.optionName];

            return (
              <div key={group.optionName} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {group.optionName}
                  </label>
                  {activeValue && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {activeValue}
                    </span>
                  )}
                </div>

                {hasImages ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {group.optionValues.map((value) => {
                      const isSelected = activeValue === value;
                      const imgSrc = group.optionImages?.[value];
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleSelectValue(group.optionName, value)}
                          className={cn(
                            "group relative flex flex-col items-center rounded-2xl border p-2 text-center transition-all duration-200",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                          )}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          {imgSrc && (
                            <div className="w-full aspect-square rounded-xl bg-slate-100/80 p-1.5 mb-2 flex items-center justify-center overflow-hidden">
                              <img
                                src={imgSrc}
                                alt={value}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          )}
                          <span
                            className={cn(
                              "text-[11px] font-bold leading-tight line-clamp-2",
                              isSelected ? "text-primary" : "text-slate-700"
                            )}
                          >
                            {value}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.optionValues.map((value) => {
                      const isSelected = activeValue === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleSelectValue(group.optionName, value)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200",
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback Variant Selector when product has multiple variants without optionGroups */}
      {hasMultipleVariants && optionGroups.length === 0 && (
        <div className="space-y-2.5 border-t border-b border-slate-100 py-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Select Option
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onVariantChange(variant)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200",
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  {variant.name} — ₹{variant.price.toLocaleString("en-IN")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {!hideQuantity && (
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm h-11">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="px-3.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors h-full flex items-center justify-center border-r border-slate-100"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center text-sm font-bold text-slate-800">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="px-3.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors h-full flex items-center justify-center border-l border-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
