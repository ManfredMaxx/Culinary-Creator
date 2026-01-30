import { useState, useCallback } from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { convertToJpeg } from "@/lib/image-utils";

interface ImageUploaderProps {
  onImagesUploaded: (images: { file: File; preview: string }[]) => void;
  existingImages?: { url: string; description?: string }[];
  maxImages?: number;
  isAnalyzing?: boolean;
}

export function ImageUploader({
  onImagesUploaded,
  existingImages = [],
  maxImages = 10,
  isAnalyzing = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [isConverting, setIsConverting] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();
        return (
          type.startsWith("image/") ||
          name.endsWith(".heic") ||
          name.endsWith(".heif")
        );
      });

      if (validFiles.length === 0) return;

      setIsConverting(true);
      try {
        const processedImages = await Promise.all(
          validFiles.map(async (file) => {
            const preview = await convertToJpeg(file);
            return { file, preview };
          })
        );

        const combined = [...images, ...processedImages].slice(0, maxImages);
        setImages(combined);
        onImagesUploaded(combined);
      } catch (error) {
        console.error("Image processing error:", error);
      }
      setIsConverting(false);
    },
    [images, maxImages, onImagesUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesUploaded(newImages);
    },
    [images, onImagesUploaded]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isAnalyzing || isConverting ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">
              {isConverting ? "Processing images..." : isAnalyzing ? "Analyzing cooking stages..." : "Add cooking stage photos"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop or click to upload images
            </p>
          </div>
          <label>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleInputChange}
              disabled={isAnalyzing || isConverting}
              data-testid="input-image-upload"
            />
            <Button variant="outline" asChild disabled={isAnalyzing || isConverting}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {(images.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages.map((img, index) => (
            <div
              key={`existing-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              data-testid={`image-existing-${index}`}
            >
              <img
                src={img.url}
                alt={img.description || `Cooking stage ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {img.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <p className="text-xs text-white truncate">{img.description}</p>
                </div>
              )}
            </div>
          ))}
          {images.map((img, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              data-testid={`image-new-${index}`}
            >
              <img
                src={img.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                data-testid={`button-remove-image-${index}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
