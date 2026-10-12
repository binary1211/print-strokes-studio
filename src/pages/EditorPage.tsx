// ponytail: All editor tools (photo, text, stickers, borders, background) share the single Konva Slot/PreviewState pipeline.
// Ceiling: Client-side 2D canvas export. Upgrade path: Server-side print PDF/TIFF rendering if 300-DPI CMYK output is needed.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Konva from "konva";
import {
  ArrowLeft,
  Bold,
  FlipHorizontal,
  Frame,
  ImagePlus,
  Italic,
  Layers,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ShoppingCart,
  Smile,
  Sparkles,
  Trash2,
  Type,
  Upload,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button-enhanced";
import { useAuth } from "@/contexts/AppContext";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { storefrontApi } from "@/lib/api/storefrontApi";
import type { KonvaTemplate, Product } from "@/types";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import type { BorderStyleConfig, PreviewState, Slot, Template } from "@/components/editor/types";
import { parseTemplatePayload } from "@/components/editor/templateValidation";

interface EditorLocationState {
  uploadedImageUrl?: string;
  previewState?: PreviewState;
  customization?: {
    template: Template;
    slots: Slot[];
    previewData: Record<string, PreviewState>;
    borderConfig?: BorderStyleConfig;
    canvasBg?: string;
  };
}

type ToolTab = "photo" | "text" | "stickers" | "borders" | "background";

const SAMPLE_PHOTOS = [
  {
    label: "Couple Portrait",
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Family Moment",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Golden Retriever",
    url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Travel Sunset",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
  },
];

const BORDER_PRESETS: BorderStyleConfig[] = [
  { id: "none", name: "Frameless Cutout", stroke: "#000000", strokeWidth: 0, cornerRadius: 0, inset: 0 },
  { id: "classic-white", name: "Classic White Gallery", stroke: "#ffffff", strokeWidth: 16, cornerRadius: 0, inset: 8, innerStroke: "#e2e8f0" },
  { id: "matte-black", name: "Sleek Matte Black", stroke: "#0f172a", strokeWidth: 14, cornerRadius: 0, inset: 7 },
  { id: "royal-gold", name: "Royal Gold Double", stroke: "#d97706", strokeWidth: 14, cornerRadius: 8, inset: 8, innerStroke: "#fef3c7" },
  { id: "walnut-wood", name: "Warm Walnut Wood", stroke: "#78350f", strokeWidth: 18, cornerRadius: 4, inset: 9, innerStroke: "#b45309" },
  { id: "rose-blush", name: "Rose Gold Blush", stroke: "#e11d48", strokeWidth: 12, cornerRadius: 16, inset: 6, innerStroke: "#ffe4e6" },
  { id: "indigo-modern", name: "Modern Indigo Glow", stroke: "#4f46e5", strokeWidth: 12, cornerRadius: 14, inset: 6 },
  { id: "vintage-cream", name: "Vintage Polaroid", stroke: "#fef3c7", strokeWidth: 22, cornerRadius: 6, inset: 11 },
];

const FONT_OPTIONS = [
  { label: "Modern Sans", value: "Inter, sans-serif" },
  { label: "Classic Serif", value: "Georgia, serif" },
  { label: "Handwritten", value: "cursive" },
  { label: "Bold Poster", value: "Impact, sans-serif" },
  { label: "Typewriter", value: "Courier New, monospace" },
];

const COLOR_SWATCHES = [
  "#ffffff",
  "#0f172a",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#4f46e5",
  "#ec4899",
  "#8b5cf6",
];

const EMOJI_LIST = [
  "❤️", "💖", "✨", "🎉", "🎂", "👑", "💍", "🌹",
  "🥰", "😎", "🔥", "🌟", "🦋", "🌈", "🎈", "🥂",
  "🎁", "📸", "🎵", "🐾", "🏆", "🍀", "☀️", "🌙",
];

const STICKER_BADGES = [
  { text: "✨ BEST MEMORIES", color: "#ffffff", bgColor: "#0f172a" },
  { text: "❤️ FOREVER & ALWAYS", color: "#ffffff", bgColor: "#e11d48" },
  { text: "🎂 HAPPY BIRTHDAY", color: "#0f172a", bgColor: "#fbbf24" },
  { text: "👑 KING & QUEEN", color: "#fef3c7", bgColor: "#78350f" },
  { text: "💍 JUST MARRIED", color: "#881337", bgColor: "#ffe4e6" },
  { text: "🔥 GOOD VIBES ONLY", color: "#ffffff", bgColor: "#4f46e5" },
];

const CANVAS_BG_SWATCHES = [
  { name: "Pure White", color: "#ffffff" },
  { name: "Warm Ivory", color: "#fdfbf7" },
  { name: "Soft Blush", color: "#fff1f2" },
  { name: "Mint Frost", color: "#f0fdf4" },
  { name: "Sky Mist", color: "#f0f9ff" },
  { name: "Lavender", color: "#f5f3ff" },
  { name: "Charcoal", color: "#1e293b" },
  { name: "Midnight", color: "#0f172a" },
];

const defaultPreviewForText = (slot: Slot): PreviewState => ({
  url: "",
  x: slot.x,
  y: slot.y,
  scaleX: 1,
  scaleY: 1,
  rotation: slot.rotation ?? 0,
  text: slot.text ?? "",
  color: slot.color ?? "#1e293b",
  fontFamily: slot.fontFamily ?? "Inter, sans-serif",
  fontSize: slot.fontSize ?? 28,
  fontStyle: slot.fontStyle ?? "bold",
  bgColor: slot.bgColor ?? "transparent",
});

const EditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as EditorLocationState | null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const { state: authState } = useAuth();

  const [activeTab, setActiveTab] = useState<ToolTab>("photo");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate] = useState<Template | null>(stateData?.customization?.template ?? null);
  const [slots, setSlots] = useState<Slot[]>(stateData?.customization?.slots ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [borderConfig, setBorderConfig] = useState<BorderStyleConfig>(
    stateData?.customization?.borderConfig ?? BORDER_PRESETS[0],
  );
  const [canvasBg, setCanvasBg] = useState<string>(stateData?.customization?.canvasBg ?? "#ffffff");

  const [previewData, setPreviewData] = useState<Record<string, PreviewState>>(() => {
    if (stateData?.customization?.previewData) return stateData.customization.previewData;
    if (stateData?.uploadedImageUrl && stateData.previewState) return { "slot-1": stateData.previewState };
    return {};
  });
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(
    stateData?.uploadedImageUrl && stateData.previewState ? "slot-1" : null,
  );

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
        if (cancelled) return;
        setProduct(productData);

        if (stateData?.customization?.template && stateData.customization.slots.length > 0) return;

        const templates = productData.konvaTemplates ?? [];
        const activeTemplate =
          templates.find((item: KonvaTemplate) => item.isActive && item.orientation === "PORTRAIT") ??
          templates.find((item: KonvaTemplate) => item.isActive);

        if (productData.customizationType === "ADVANCED_DESIGNER" && activeTemplate?.templateJson) {
          try {
            const parsed = parseTemplatePayload(activeTemplate.templateJson);
            setTemplate(parsed.template);
            setSlots(parsed.slots);
            setPreviewData((current) => {
              const next = { ...current };
              parsed.slots
                .filter((slot) => slot.type === "text")
                .forEach((slot) => {
                  if (!next[slot.id]) next[slot.id] = defaultPreviewForText(slot);
                });
              return next;
            });
            return;
          } catch {
            toast.error("Loaded safe fallback editor.");
          }
        }

        const fallbackTemplate: Template = { src: "", width: 600, height: 600 };
        const fallbackSlots: Slot[] = [
          { id: "slot-1", type: "photo", x: 50, y: 50, width: 500, height: 500, rotation: 0 },
        ];
        if (productData.personalization?.supportsText) {
          fallbackSlots.push({
            id: "text-slot-1",
            type: "text",
            x: 100,
            y: 460,
            width: 400,
            height: 60,
            text: "Your Custom Text",
            color: "#ffffff",
            bgColor: "#0f172a",
            fontSize: 26,
            fontFamily: "Inter, sans-serif",
            fontStyle: "bold",
            rotation: 0,
          });
        }
        setTemplate(fallbackTemplate);
        setSlots(fallbackSlots);
        setPreviewData((current) => {
          const next = { ...current };
          fallbackSlots
            .filter((slot) => slot.type === "text")
            .forEach((slot) => {
              if (!next[slot.id]) next[slot.id] = defaultPreviewForText(slot);
            });
          return next;
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load product"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, stateData?.customization]);

  const photoSlots = useMemo(() => slots.filter((slot) => slot.type === "photo"), [slots]);
  const textSlots = useMemo(() => slots.filter((slot) => slot.type === "text"), [slots]);
  const stickerSlots = useMemo(() => slots.filter((slot) => slot.type === "sticker"), [slots]);

  const activePhotoSlotId = useMemo(() => {
    if (selectedPreviewId && photoSlots.some((s) => s.id === selectedPreviewId)) return selectedPreviewId;
    return photoSlots[0]?.id ?? null;
  }, [photoSlots, selectedPreviewId]);

  const activePhotoPreview = activePhotoSlotId ? previewData[activePhotoSlotId] : undefined;

  const selectedTextSlot = useMemo(
    () => textSlots.find((slot) => slot.id === selectedPreviewId) ?? textSlots[textSlots.length - 1] ?? null,
    [selectedPreviewId, textSlots],
  );

  // Switch sidebar tab automatically when user clicks a text or sticker on canvas
  const handleSelectPreview = (slotId: string | null) => {
    setSelectedPreviewId(slotId);
    if (!slotId) return;
    const target = slots.find((s) => s.id === slotId);
    if (target?.type === "text") setActiveTab("text");
    else if (target?.type === "sticker") setActiveTab("stickers");
  };

  const handlePreviewUpload = useCallback(
    (slotId: string, url: string) => {
      const slot = slots.find((item) => item.id === slotId);
      if (!slot) return;
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const scale = Math.max(slot.width / image.width, slot.height / image.height);
        setPreviewData((current) => ({
          ...current,
          [slotId]: {
            url,
            x: (slot.width - image.width * scale) / 2,
            y: (slot.height - image.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            rotation: 0,
          },
        }));
        setSelectedPreviewId(slotId);
      };
      image.onerror = () => toast.error("Unable to preview the selected image");
      image.src = url;
    },
    [slots],
  );

  const processImageFile = useCallback(
    async (file: File): Promise<string> => {
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
        throw new Error("Upload a PNG, JPG, JPEG, or WebP image");
      }
      if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");

      if (product?.backgroundRemovalRequired) {
        return storefrontApi.customization.removeBackground(product.id, file);
      }
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });
    },
    [product],
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const targetSlot = photoSlots.find((slot) => slot.id === selectedPreviewId) ?? photoSlots[0];
    if (!targetSlot) {
      toast.error("No photo slot available");
      return;
    }
    try {
      setUploading(true);
      const imageUrl = await processImageFile(file);
      handlePreviewUpload(targetSlot.id, imageUrl);
      toast.success("Photo added to canvas!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to process image"));
    } finally {
      setUploading(false);
    }
  };

  // Add Text Layer
  const handleAddText = (presetText = "Your Custom Text", bgColor = "transparent", color = "#ffffff") => {
    const id = `text-${Date.now()}`;
    const newSlot: Slot = {
      id,
      type: "text",
      x: 130,
      y: 260,
      width: 340,
      height: 64,
      text: presetText,
      color,
      bgColor,
      fontFamily: "Inter, sans-serif",
      fontSize: 28,
      fontStyle: "bold",
      rotation: 0,
    };
    setSlots((prev) => [...prev, newSlot]);
    setPreviewData((prev) => ({
      ...prev,
      [id]: defaultPreviewForText(newSlot),
    }));
    setSelectedPreviewId(id);
    setActiveTab("text");
    toast.success("Text layer added");
  };

  // Add Emoji or Sticker Badge
  const handleAddSticker = (content: string, bgColor = "transparent", color = "#ffffff", isBadge = false) => {
    const id = `sticker-${Date.now()}`;
    const width = isBadge ? 260 : 90;
    const height = isBadge ? 52 : 90;
    const fontSize = isBadge ? 20 : 56;
    const offset = (stickerSlots.length % 4) * 24;
    const newSlot: Slot = {
      id,
      type: "sticker",
      x: 200 + offset,
      y: 200 + offset,
      width,
      height,
      text: content,
      color,
      bgColor,
      fontSize,
      fontFamily: "Inter, sans-serif",
      fontStyle: "bold",
      rotation: 0,
    };
    setSlots((prev) => [...prev, newSlot]);
    setPreviewData((prev) => ({
      ...prev,
      [id]: {
        url: "",
        x: newSlot.x,
        y: newSlot.y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        text: content,
        color,
        bgColor,
        fontSize,
        fontFamily: "Inter, sans-serif",
        fontStyle: "bold",
      },
    }));
    setSelectedPreviewId(id);
    toast.success(isBadge ? "Sticker badge added!" : `Added ${content} to canvas!`);
  };

  // Delete selected layer (text/sticker) or clear photo
  const handleDeleteSelected = () => {
    if (!selectedPreviewId) return;
    const target = slots.find((s) => s.id === selectedPreviewId);
    if (!target) return;

    if (target.type === "photo") {
      setPreviewData((prev) => {
        const next = { ...prev };
        delete next[selectedPreviewId];
        return next;
      });
      toast.info("Photo removed from slot");
    } else {
      setSlots((prev) => prev.filter((s) => s.id !== selectedPreviewId));
      setPreviewData((prev) => {
        const next = { ...prev };
        delete next[selectedPreviewId];
        return next;
      });
      setSelectedPreviewId(null);
      toast.info("Layer deleted");
    }
  };

  // Photo transform helpers
  const updateActivePhoto = (updater: (current: PreviewState) => PreviewState) => {
    if (!activePhotoSlotId || !activePhotoPreview) {
      toast.error("Upload or select a photo first");
      return;
    }
    setPreviewData((prev) => ({
      ...prev,
      [activePhotoSlotId]: updater(prev[activePhotoSlotId]),
    }));
  };

  const updateSelectedText = (patch: Partial<PreviewState>) => {
    if (!selectedTextSlot) return;
    const slotId = selectedTextSlot.id;
    setPreviewData((prev) => ({
      ...prev,
      [slotId]: {
        ...(prev[slotId] || defaultPreviewForText(selectedTextSlot)),
        ...patch,
      },
    }));
  };

  const handleSaveAndRedirect = () => {
    if (!product || !template) return;
    const firstPhoto = photoSlots.map((slot) => previewData[slot.id]).find((value) => value?.url);
    if (!firstPhoto?.url && product.personalization?.supportsImage) {
      toast.error("Please upload a photo or pick a sample photo first!");
      setActiveTab("photo");
      return;
    }

    // Export composite canvas (including border, text, emojis, stickers)
    let compositeDataUrl = firstPhoto?.url;
    setSelectedPreviewId(null);
    setSelectedId(null);

    setTimeout(() => {
      try {
        if (stageRef.current) {
          const exported = stageRef.current.toDataURL({ pixelRatio: 2 });
          if (exported && exported.startsWith("data:image/")) {
            compositeDataUrl = exported;
          }
        }
      } catch {
        // Fallback to raw uploaded photo URL if cross-origin canvas export is restricted
      }

      navigate(`/product/${id}`, {
        state: {
          uploadedImageUrl: compositeDataUrl || firstPhoto?.url,
          previewState: firstPhoto,
          customization: { template, slots, previewData, borderConfig, canvasBg },
        } satisfies EditorLocationState,
      });
    }, 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-9 h-9 text-primary animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Loading Photo Studio…</p>
        </div>
      </div>
    );
  }

  const currentTextState = selectedTextSlot
    ? previewData[selectedTextSlot.id] || defaultPreviewForText(selectedTextSlot)
    : null;

  const NAV_TABS: Array<{ id: ToolTab; label: string; icon: typeof ImagePlus }> = [
    { id: "photo", label: "Photo", icon: ImagePlus },
    { id: "text", label: "Text Edit", icon: Type },
    { id: "stickers", label: "Emojis & Stickers", icon: Smile },
    { id: "borders", label: "Borders", icon: Frame },
    { id: "background", label: "Backdrop", icon: Palette },
  ];

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 flex flex-col font-sans">
      {/* Top Studio Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 h-14 px-4 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/product/${id}`)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 h-9 px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
          <Link to="/" className="hidden sm:flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-heading font-bold text-sm tracking-wide">Print Strokes Studio</span>
          </Link>
          {product && (
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium truncate max-w-[200px] sm:max-w-xs">
              {product.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(authState.isAuthenticated ? "/" : "/login")}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1"
          >
            <User className="w-3.5 h-3.5" />
            {authState.isAuthenticated ? authState.user?.name : "Account"}
          </button>
          <button
            type="button"
            aria-label="Open cart"
            onClick={() => navigate("/cart")}
            className="p-2 text-slate-300 hover:text-white hidden sm:inline-flex"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <Button
            onClick={handleSaveAndRedirect}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 h-9 rounded-lg shadow-sm"
          >
            Save & Select Size →
          </Button>
        </div>
      </header>

      {/* Main Studio Body: Left Tool Rail + Tool Drawer + Center Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Icon Rail */}
        <aside className="bg-slate-900 text-slate-400 flex lg:flex-col items-center justify-around lg:justify-start py-2 lg:py-4 px-2 lg:w-20 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0 gap-1 z-20 overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-16 h-14 lg:h-16 rounded-xl text-[10px] font-bold transition-all gap-1 flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-center leading-tight px-1">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Left Expandable Tool Options Panel */}
        <section className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col flex-shrink-0 max-h-[42vh] lg:max-h-none overflow-y-auto">
          <div className="p-5 space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* TAB 1: PHOTO UPLOAD & ADJUST */}
            {activeTab === "photo" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-heading font-bold text-slate-800">Photo & Adjustments</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload your high-resolution photo or try a sample.</p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {activePhotoPreview?.url ? "Change Uploaded Photo" : "Upload Photo from Device"}
                </Button>

                {/* Transform Controls when photo is loaded */}
                {activePhotoPreview?.url && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Photo Controls</span>
                      <button
                        type="button"
                        onClick={() => activePhotoSlotId && handlePreviewUpload(activePhotoSlotId, activePhotoPreview.url)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Reset Fit
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Zoom / Scale</span>
                        <span>{Math.round(Math.abs(activePhotoPreview.scaleX) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.05"
                          value={Math.abs(activePhotoPreview.scaleX)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateActivePhoto((cur) => ({
                              ...cur,
                              scaleX: cur.scaleX < 0 ? -val : val,
                              scaleY: val,
                            }));
                          }}
                          className="flex-1 accent-primary"
                        />
                        <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateActivePhoto((cur) => ({ ...cur, rotation: (cur.rotation - 90) % 360 }))
                        }
                        className="text-xs h-8 font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> -90°
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateActivePhoto((cur) => ({ ...cur, rotation: (cur.rotation + 90) % 360 }))
                        }
                        className="text-xs h-8 font-semibold"
                      >
                        <RotateCw className="w-3.5 h-3.5 mr-1" /> +90°
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateActivePhoto((cur) => ({
                            ...cur,
                            scaleX: -cur.scaleX,
                            x: cur.x + (cur.scaleX > 0 ? 250 : -250),
                          }))
                        }
                        className="text-xs h-8 font-semibold"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5 mr-1" /> Flip
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Sample Photos */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Or Try Sample Photos
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SAMPLE_PHOTOS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          const targetId = activePhotoSlotId || photoSlots[0]?.id;
                          if (targetId) {
                            handlePreviewUpload(targetId, sample.url);
                            toast.success(`Loaded "${sample.label}"`);
                          }
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-primary transition-all"
                      >
                        <img
                          src={sample.url}
                          alt={sample.label}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[10px] font-semibold p-1.5 text-left truncate">
                          {sample.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEXT EDIT */}
            {activeTab === "text" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-heading font-bold text-slate-800">Text & Typography</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Add custom names, dates, or quotes.</p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => handleAddText("Your Custom Text", "transparent", "#1e293b")}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add New Text Box
                </Button>

                {/* Active Text Editor */}
                {selectedTextSlot && currentTextState ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Editing Selected Text
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Text Content</label>
                      <input
                        type="text"
                        value={currentTextState.text ?? ""}
                        onChange={(e) => updateSelectedText({ text: e.target.value })}
                        placeholder="Enter your text..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Font Style</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {FONT_OPTIONS.map((font) => (
                          <button
                            key={font.value}
                            type="button"
                            onClick={() => updateSelectedText({ fontFamily: font.value })}
                            style={{ fontFamily: font.value }}
                            className={`px-3 py-1.5 rounded-lg text-left text-xs border transition-all ${
                              currentTextState.fontFamily === font.value
                                ? "border-primary bg-primary/10 text-primary font-bold"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>Font Size</span>
                        <span>{currentTextState.fontSize ?? 28}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="14"
                          max="72"
                          value={currentTextState.fontSize ?? 28}
                          onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })}
                          className="flex-1 accent-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = currentTextState.fontStyle || "normal";
                            updateSelectedText({
                              fontStyle: cur.includes("bold") ? cur.replace("bold", "").trim() || "normal" : `${cur} bold`.trim(),
                            });
                          }}
                          className={`p-1.5 rounded border ${
                            (currentTextState.fontStyle || "").includes("bold")
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = currentTextState.fontStyle || "normal";
                            updateSelectedText({
                              fontStyle: cur.includes("italic") ? cur.replace("italic", "").trim() || "normal" : `${cur} italic`.trim(),
                            });
                          }}
                          className={`p-1.5 rounded border ${
                            (currentTextState.fontStyle || "").includes("italic")
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Text Color</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            onClick={() => updateSelectedText({ color: swatch })}
                            className={`w-6 h-6 rounded-full border ${
                              currentTextState.color === swatch ? "ring-2 ring-primary ring-offset-1" : "border-slate-300"
                            }`}
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                        <input
                          type="color"
                          value={currentTextState.color ?? "#1e293b"}
                          onChange={(e) => updateSelectedText({ color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Text Highlight / Pill Background */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Text Box Background</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateSelectedText({ bgColor: "transparent" })}
                          className={`px-2 py-0.5 text-[10px] rounded border font-semibold ${
                            !currentTextState.bgColor || currentTextState.bgColor === "transparent"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          None
                        </button>
                        {["#0f172a", "#ffffff", "#e11d48", "#4f46e5", "#fbbf24"].map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => updateSelectedText({ bgColor: bg })}
                            className={`w-6 h-6 rounded-full border ${
                              currentTextState.bgColor === bg ? "ring-2 ring-primary ring-offset-1" : "border-slate-300"
                            }`}
                            style={{ backgroundColor: bg }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Click "+ Add New Text Box" or select text on canvas to edit.</p>
                )}

                {/* Quick Text Templates */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Ready Phrases
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { text: "Happy Anniversary ❤️", bg: "#0f172a", fg: "#ffffff" },
                      { text: "Forever & Always ✨", bg: "#ffffff", fg: "#0f172a" },
                      { text: "Best Friends Forever", bg: "#4f46e5", fg: "#ffffff" },
                      { text: "Our Family Memories", bg: "#78350f", fg: "#fef3c7" },
                    ].map((preset) => (
                      <button
                        key={preset.text}
                        type="button"
                        onClick={() => handleAddText(preset.text, preset.bg, preset.fg)}
                        className="text-left px-3 py-2 rounded-xl border border-slate-200 hover:border-primary text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-between"
                      >
                        <span>{preset.text}</span>
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EMOJIS & STICKERS */}
            {activeTab === "stickers" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-heading font-bold text-slate-800">Emojis & Stickers</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tap any emoji or badge to place it on your photo.</p>
                </div>

                {/* Emoji Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Popular Emojis
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddSticker(emoji, "transparent", "#000000", false)}
                        className="aspect-square rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95 bg-slate-50/60"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decorative Sticker Badges */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Decorative Sticker Badges
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {STICKER_BADGES.map((badge) => (
                      <button
                        key={badge.text}
                        type="button"
                        onClick={() => handleAddSticker(badge.text, badge.bgColor, badge.color, true)}
                        className="w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs tracking-wide shadow-sm hover:scale-[1.02] transition-transform text-center"
                        style={{ backgroundColor: badge.bgColor, color: badge.color }}
                      >
                        {badge.text}
                      </button>
                    ))}
                  </div>
                </div>

                {stickerSlots.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Active Stickers ({stickerSlots.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {stickerSlots.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => setSelectedPreviewId(st.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                            selectedPreviewId === st.id
                              ? "border-primary bg-primary/10 font-bold"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <span className="truncate max-w-[110px]">{previewData[st.id]?.text || st.text}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlots((prev) => prev.filter((item) => item.id !== st.id));
                            }}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BORDERS & FRAMES */}
            {activeTab === "borders" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-heading font-bold text-slate-800">Borders & Frames</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose a frame border style and customize thickness.</p>
                </div>

                {/* Preset Frame Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {BORDER_PRESETS.map((preset) => {
                    const isSelected = borderConfig.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBorderConfig(preset)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="w-full h-12 rounded-lg bg-slate-100 flex items-center justify-center p-2">
                          <div
                            className="w-full h-full bg-white shadow-inner"
                            style={{
                              border:
                                preset.strokeWidth > 0
                                  ? `${Math.max(2, Math.round(preset.strokeWidth / 4))}px solid ${preset.stroke}`
                                  : "1px dashed #cbd5e1",
                              borderRadius: `${Math.min(8, preset.cornerRadius / 2)}px`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 leading-tight">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Border Fine-Tuning */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <span className="text-xs font-bold text-slate-700 block">Customize Frame</span>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Border Thickness</span>
                      <span>{borderConfig.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="36"
                      value={borderConfig.strokeWidth}
                      onChange={(e) =>
                        setBorderConfig((prev) => ({
                          ...prev,
                          id: "custom",
                          strokeWidth: Number(e.target.value),
                          inset: Math.round(Number(e.target.value) / 2),
                        }))
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Corner Rounding</span>
                      <span>{borderConfig.cornerRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={borderConfig.cornerRadius}
                      onChange={(e) =>
                        setBorderConfig((prev) => ({
                          ...prev,
                          id: "custom",
                          cornerRadius: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 block">Border Color</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() =>
                            setBorderConfig((prev) => ({
                              ...prev,
                              id: "custom",
                              stroke: swatch,
                              strokeWidth: prev.strokeWidth === 0 ? 14 : prev.strokeWidth,
                              inset: prev.strokeWidth === 0 ? 7 : prev.inset,
                            }))
                          }
                          className={`w-6 h-6 rounded-full border ${
                            borderConfig.stroke === swatch ? "ring-2 ring-primary ring-offset-1" : "border-slate-300"
                          }`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                      <input
                        type="color"
                        value={borderConfig.stroke}
                        onChange={(e) =>
                          setBorderConfig((prev) => ({
                            ...prev,
                            id: "custom",
                            stroke: e.target.value,
                            strokeWidth: prev.strokeWidth === 0 ? 14 : prev.strokeWidth,
                          }))
                        }
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BACKGROUND / BACKDROP */}
            {activeTab === "background" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-heading font-bold text-slate-800">Canvas Backdrop</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select the background fill behind your photo & frame.</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {CANVAS_BG_SWATCHES.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCanvasBg(item.color)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        canvasBg === item.color
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-slate-300 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-slate-700 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Center Studio Canvas Area */}
        <main className="flex-1 flex flex-col bg-slate-100/80 min-w-0 min-h-[420px] relative">
          {/* Top Floating Context Bar */}
          <div className="h-12 bg-white/90 backdrop-blur border-b border-slate-200 px-4 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Layers className="w-4 h-4 text-primary" />
              <span>
                {selectedPreviewId
                  ? `Selected: ${slots.find((s) => s.id === selectedPreviewId)?.type?.toUpperCase() || "Layer"}`
                  : "Click any photo, text, or sticker on canvas to move/resize"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedPreviewId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="h-8 px-3 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Selected
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewData({});
                  setSlots((prev) => prev.filter((s) => s.type === "photo"));
                  setBorderConfig(BORDER_PRESETS[0]);
                  setCanvasBg("#ffffff");
                  setSelectedPreviewId(null);
                  toast.info("Canvas reset");
                }}
                className="h-8 px-3 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset All
              </Button>
            </div>
          </div>

          {/* Interactive Konva Stage Wrapper */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-primary">Processing high-res photo…</p>
              </div>
            ) : (
              <div className="w-full h-full max-w-[640px] max-h-[560px] aspect-square bg-transparent flex items-center justify-center relative">
                <EditorWorkspace
                  stageRef={stageRef}
                  template={template}
                  slots={slots}
                  selectedId={selectedId}
                  onSelectSlot={setSelectedId}
                  onChangeSlot={(updated) =>
                    setSlots((current) => current.map((slot) => (slot.id === updated.id ? updated : slot)))
                  }
                  mode="preview"
                  previewData={previewData}
                  onPreviewUpload={handlePreviewUpload}
                  selectedPreviewId={selectedPreviewId}
                  onSelectPreviewId={handleSelectPreview}
                  onPreviewChange={(slotId, next) =>
                    setPreviewData((current) => ({ ...current, [slotId]: next }))
                  }
                  processPreviewFile={processImageFile}
                  borderConfig={borderConfig}
                  canvasBg={canvasBg}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
