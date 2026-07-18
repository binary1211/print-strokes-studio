import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { RefreshCw, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button-enhanced";
import { useAuth } from "@/contexts/AppContext";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { storefrontApi } from "@/lib/api/storefrontApi";
import type { KonvaTemplate, Product } from "@/types";
import { EditorWorkspace } from "../../../../packages/editor/src/components/EditorWorkspace";
import { PreviewToolbar } from "../../../../packages/editor/src/components/PreviewToolbar";
import type { PreviewState, Slot, Template } from "../../../../packages/editor/src/types";
import { parseTemplatePayload } from "../../../../packages/editor/src/utils/templateValidation";

interface EditorLocationState {
  uploadedImageUrl?: string;
  previewState?: PreviewState;
  customization?: {
    template: Template;
    slots: Slot[];
    previewData: Record<string, PreviewState>;
  };
}

const defaultPreviewForText = (slot: Slot): PreviewState => ({
  url: "",
  x: slot.x,
  y: slot.y,
  scaleX: 1,
  scaleY: 1,
  rotation: slot.rotation ?? 0,
  text: slot.text ?? "",
  color: slot.color ?? "#333333",
});

const EditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as EditorLocationState | null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state: authState } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate] = useState<Template | null>(stateData?.customization?.template ?? null);
  const [slots, setSlots] = useState<Slot[]>(stateData?.customization?.slots ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        const activeTemplate = templates.find((item: KonvaTemplate) => item.isActive && item.orientation === "PORTRAIT")
          ?? templates.find((item: KonvaTemplate) => item.isActive);

        if (productData.customizationType === "ADVANCED_DESIGNER" && activeTemplate?.templateJson) {
          try {
            const parsed = parseTemplatePayload(activeTemplate.templateJson);
            setTemplate(parsed.template);
            setSlots(parsed.slots);
            setPreviewData((current) => {
              const next = { ...current };
              parsed.slots.filter((slot) => slot.type === "text").forEach((slot) => {
                if (!next[slot.id]) next[slot.id] = defaultPreviewForText(slot);
              });
              return next;
            });
            return;
          } catch (error) {
            console.error("Invalid Konva template JSON", error);
            toast.error("This product template is invalid. A safe fallback editor was loaded.");
          }
        }

        const fallbackTemplate: Template = { src: "", width: 800, height: 600 };
        const fallbackSlots: Slot[] = [];
        if (productData.personalization?.supportsImage) {
          fallbackSlots.push({ id: "slot-1", type: "photo", x: 250, y: 50, width: 300, height: 400, rotation: 0 });
        }
        if (productData.personalization?.supportsText) {
          fallbackSlots.push({ id: "text-slot-1", type: "text", x: 200, y: 470, width: 400, height: 70, text: "", color: "#333333", rotation: 0 });
        }
        setTemplate(fallbackTemplate);
        setSlots(fallbackSlots);
        setPreviewData((current) => {
          const next = { ...current };
          fallbackSlots.filter((slot) => slot.type === "text").forEach((slot) => {
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
    return () => { cancelled = true; };
  }, [id, navigate, stateData?.customization]);

  const photoSlots = useMemo(() => slots.filter((slot) => slot.type === "photo"), [slots]);
  const textSlots = useMemo(() => slots.filter((slot) => slot.type === "text"), [slots]);
  const selectedTextSlot = useMemo(
    () => textSlots.find((slot) => slot.id === selectedPreviewId) ?? null,
    [selectedPreviewId, textSlots],
  );
  const backgroundRemovalActive = Boolean(product?.backgroundRemovalRequired);

  const handlePreviewUpload = (slotId: string, url: string) => {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return;
    const image = new Image();
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
  };

  const processImageFile = useCallback(async (file: File): Promise<string> => {
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) throw new Error("Upload a PNG, JPG, JPEG, or WebP image");
    if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");

    if (backgroundRemovalActive) {
      if (!authState.isAuthenticated) {
        navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
        throw new Error("Please sign in before using background removal");
      }
      if (!product?.id) throw new Error("Product is not available");
      return storefrontApi.customization.removeBackground(product.id, file);
    }
    if (!file.type.startsWith("image/")) throw new Error("Only image files are supported");
    if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");
    return URL.createObjectURL(file);
  }, [authState.isAuthenticated, backgroundRemovalActive, location.pathname, location.search, navigate, product?.id]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const targetSlot = photoSlots.find((slot) => slot.id === selectedPreviewId) ?? photoSlots[0];
    if (!targetSlot) {
      toast.error("This product has no photo slot");
      return;
    }
    try {
      setUploading(true);
      const imageUrl = await processImageFile(file);
      handlePreviewUpload(targetSlot.id, imageUrl);
      toast.success(backgroundRemovalActive ? "Background removed successfully" : "Photo uploaded successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to process image"));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAndRedirect = () => {
    if (!product || !template) return;
    if (product.personalization?.supportsImage) {
      const missingPhoto = photoSlots.find((slot) => !previewData[slot.id]?.url);
      if (missingPhoto) {
        toast.error("Please upload all required photos");
        setSelectedPreviewId(missingPhoto.id);
        return;
      }
    }
    if (product.personalization?.supportsText) {
      const missingText = textSlots.find((slot) => !(previewData[slot.id]?.text ?? slot.text ?? "").trim());
      if (missingText) {
        toast.error("Please fill all required text fields");
        setSelectedPreviewId(missingText.id);
        return;
      }
    }

    const firstPhoto = photoSlots.map((slot) => previewData[slot.id]).find((value) => value?.url);
    navigate(`/product/${id}`, {
      state: {
        uploadedImageUrl: firstPhoto?.url,
        previewState: firstPhoto,
        customization: { template, slots, previewData },
      } satisfies EditorLocationState,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-9 h-9 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading customization workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/print%20strokes%20logo.png" alt="Print Strokes" className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
            <button type="button" onClick={() => navigate(authState.isAuthenticated ? "/" : "/login")} className="flex items-center gap-1 hover:text-slate-800">
              <User className="w-3.5 h-3.5" /> {authState.isAuthenticated ? authState.user?.name : "Login / Register"}
            </button>
            <button type="button" aria-label="Open cart" onClick={() => navigate("/cart")} className="p-1 hover:text-slate-800">
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Upload and position the required content, then continue.</div>
          <Button onClick={handleSaveAndRedirect} size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-lg shadow-sm">
            Save & Select Size →
          </Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl flex flex-col justify-center">
        <div className="border border-slate-200 rounded-3xl bg-white shadow-md overflow-hidden flex flex-col">
          <div className="min-h-14 border-b border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/50 gap-4">
            <div className="text-xs font-semibold text-slate-600">
              {photoSlots.length > 0 && `${photoSlots.length} photo slot${photoSlots.length > 1 ? "s" : ""}`}
              {photoSlots.length > 0 && textSlots.length > 0 && " • "}
              {textSlots.length > 0 && `${textSlots.length} text field${textSlots.length > 1 ? "s" : ""}`}
            </div>
            {photoSlots.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPreviewData({}); setSelectedPreviewId(null); }} className="h-8 px-4 text-xs font-bold">
                  ↺ Reset
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} className="h-8 px-4 text-xs font-bold text-white bg-secondary hover:bg-secondary/90">
                  Change Selected Photo
                </Button>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />

          <div className="bg-[#FAF6EB] flex items-center justify-center p-6 sm:p-12 min-h-[480px]">
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-bold text-primary">Processing image…</p>
              </div>
            ) : (
              <div className="w-full max-w-[640px] aspect-[4/3] bg-transparent relative">
                <EditorWorkspace
                  template={template}
                  slots={slots}
                  selectedId={selectedId}
                  onSelectSlot={setSelectedId}
                  onChangeSlot={(updated) => setSlots((current) => current.map((slot) => slot.id === updated.id ? updated : slot))}
                  mode="preview"
                  previewData={previewData}
                  onPreviewUpload={handlePreviewUpload}
                  selectedPreviewId={selectedPreviewId}
                  onSelectPreviewId={setSelectedPreviewId}
                  onPreviewChange={(slotId, next) => setPreviewData((current) => ({ ...current, [slotId]: next }))}
                  processPreviewFile={processImageFile}
                />
              </div>
            )}
          </div>

          {selectedTextSlot && (
            <div className="border-t border-slate-100 p-4 bg-white">
              <PreviewToolbar
                slot={selectedTextSlot}
                previewState={previewData[selectedTextSlot.id]}
                onChange={(next) => setPreviewData((current) => ({ ...current, [selectedTextSlot.id]: next }))}
              />
            </div>
          )}
        </div>
        <p className="text-center mt-4 text-xs text-teal-700 font-semibold">Click a photo slot to upload. Click a text slot to edit its text and colour.</p>
      </main>
    </div>
  );
};

export default EditorPage;
