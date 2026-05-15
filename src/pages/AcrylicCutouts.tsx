import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, Upload, Loader2, Sparkles, ShoppingCart } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button-enhanced";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FileUploader from "@/components/FileUploader";
import { useCart } from "@/contexts/AppContext";
import { mockApi } from "@/utils/mockApi";
import { toast } from "sonner";
import { Product, ProductVariant } from "@/types";

const AcrylicCutouts = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedThickness, setSelectedThickness] = useState<string>("3mm");
  const [quantity, setQuantity] = useState(1);
  
  // File upload & processing states
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string } | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        // We'll hardcode 'acrylic-cutouts' to fetch this specific product
        const productData = await mockApi.getProduct('acrylic-cutouts');
        
        if (productData) {
          setProduct(productData);
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        } else {
          toast.error('Acrylic Cutouts product not found');
          navigate('/');
        }
      } catch (error) {
        toast.error('Failed to load product');
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [navigate]);

  const handleFileUpload = (file: File, url: string) => {
    setUploadedImage({ file, url });
    setProcessedImage(null); // Reset if new image is uploaded
  };

  const removeFile = () => {
    setUploadedImage(null);
    setProcessedImage(null);
  };

  const handleRemoveBg = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedImage.file);

      const response = await fetch('http://localhost:8080/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);
      setProcessedImage(previewUrl);
      toast.success('Background removed successfully!');
      
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background. Please ensure the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (!product || !selectedVariant || !processedImage) return;

    try {
      setIsAddingToCart(true);
      
      const customizationData = {
        processedImage: processedImage,
        thickness: selectedThickness
      };
      
      addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
        price: selectedVariant.price,
        design: customizationData,
        personalizationSummary: `Acrylic Cutout - ${selectedThickness}`,
      });
      
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Image Area */}
          <div className="lg:col-span-7">
            <div className="bg-muted/30 border rounded-2xl p-6 lg:p-10 flex flex-col items-center justify-center min-h-[500px]">
              
              {!uploadedImage ? (
                <div className="w-full max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Upload Your Photo</h2>
                    <p className="text-muted-foreground">We'll automatically remove the background to create a perfect cutout shape.</p>
                  </div>
                  <FileUploader
                    onFile={handleFileUpload}
                    accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
                    maxSizeMB={10}
                  />
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Image Preview</h3>
                    <Button variant="ghost" size="sm" onClick={removeFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Replace Image
                    </Button>
                  </div>
                  
                  <div className="relative aspect-square w-full max-w-lg mx-auto bg-grid-pattern rounded-xl overflow-hidden border-2 border-dashed border-border/50 flex items-center justify-center">
                    {/* Background Grid Pattern (to show transparency) */}
                    <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAuSURBVHgB7cwxAQAAAMIg+1c+jXADd4YgMzMzMzMzMzMzMzMzMzMzMzMzMz/XBoDZAJ9rO4rWAAAAAElFTkSuQmCC')] opacity-20"></div>
                    
                    {isProcessing ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-printStrokes-primary mb-4" />
                        <p className="font-medium animate-pulse">Removing Background...</p>
                        <p className="text-sm text-muted-foreground mt-2">Powered by AI</p>
                      </div>
                    ) : (
                      <img
                        src={processedImage || uploadedImage.url}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain relative z-10 drop-shadow-xl"
                      />
                    )}
                  </div>
                  
                  {!processedImage && !isProcessing && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        size="lg" 
                        onClick={handleRemoveBg}
                        className="bg-printStrokes-primary hover:bg-printStrokes-primary/90 text-white rounded-full px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Proceed to Remove Background
                      </Button>
                    </div>
                  )}
                  
                  {processedImage && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full inline-flex mx-auto border border-green-200">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Background removed successfully!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Options */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  {product.title}
                </h1>
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                {product.description}
              </p>
              
              <div className="text-4xl font-heading font-bold text-printStrokes-primary mb-6">
                ₹{selectedVariant?.price.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-6 border-t border-b py-6">
              
              {/* Size Selector */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  Select Size <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {product.variants?.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        selectedVariant?.id === variant.id
                          ? 'border-printStrokes-primary bg-printStrokes-primary/5 text-printStrokes-primary font-medium shadow-sm'
                          : 'border-border hover:border-border/80 bg-background text-muted-foreground hover:bg-muted/30'
                      }`}
                    >
                      <div className="text-sm font-semibold">{variant.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Thickness Selector */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  Select Thickness <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex gap-3">
                  {['3mm', '5mm'].map((thickness) => (
                    <button
                      key={thickness}
                      onClick={() => setSelectedThickness(thickness)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                        selectedThickness === thickness
                          ? 'border-printStrokes-secondary bg-printStrokes-secondary/5 text-printStrokes-secondary font-medium shadow-sm'
                          : 'border-border hover:border-border/80 bg-background text-muted-foreground hover:bg-muted/30'
                      }`}
                    >
                      {thickness}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quantity */}
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded-lg p-1 bg-background">
                    <button 
                      className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted text-lg font-medium transition-colors"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button 
                      className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted text-lg font-medium transition-colors"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <Button
                variant="brand"
                size="lg"
                onClick={handleNext}
                disabled={!processedImage || isAddingToCart}
                className="w-full py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isAddingToCart ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding to Cart...</>
                ) : (
                  <>Next Step <ShoppingCart className="ml-2 h-5 w-5" /></>
                )}
              </Button>
              {!processedImage && (
                <p className="text-sm text-center text-muted-foreground mt-3">
                  Please upload and process an image to continue
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AcrylicCutouts;
