import { useState, useCallback, useRef } from "react";
import { Camera, Upload, X, Loader2, Image, Scan, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { convertToJpeg } from "@/lib/image-utils";
import { convertPdfToImages, isPdfFile, PDFConversionProgress } from "@/lib/pdf-utils";

interface RecipeScannerProps {
  onScanComplete: (images: string[]) => void;
  isProcessing?: boolean;
}

type UploadedFile = {
  id: string;
  file: File;
  preview: string;
  isPdf?: boolean;
  pageNumber?: number;
};

export function RecipeScanner({ onScanComplete, isProcessing = false }: RecipeScannerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PDFConversionProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const validFiles = Array.from(fileList).filter((file) => {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();
        return (
          type.startsWith("image/") ||
          name.endsWith(".heic") ||
          name.endsWith(".heif") ||
          isPdfFile(file)
        );
      });

      if (validFiles.length === 0) return;

      setIsConverting(true);
      try {
        const allProcessedFiles: UploadedFile[] = [];

        for (const file of validFiles) {
          if (isPdfFile(file)) {
            const pdfImages = await convertPdfToImages(file, (progress) => {
              setPdfProgress(progress);
            });
            
            pdfImages.forEach((preview, index) => {
              allProcessedFiles.push({
                id: crypto.randomUUID(),
                file,
                preview,
                isPdf: true,
                pageNumber: index + 1,
              });
            });
            setPdfProgress(null);
          } else {
            const preview = await convertToJpeg(file);
            allProcessedFiles.push({
              id: crypto.randomUUID(),
              file,
              preview,
            });
          }
        }

        setFiles((prev) => [...prev, ...allProcessedFiles]);
      } catch (error) {
        console.error("File processing error:", error);
        setPdfProgress(null);
      }
      setIsConverting(false);
    },
    []
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

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const handleProcess = () => {
    const previews = files.map((f) => f.preview);
    onScanComplete(previews);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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
        <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {isConverting || isProcessing ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Scan className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">
              {isConverting
                ? pdfProgress
                  ? `Converting PDF page ${pdfProgress.currentPage} of ${pdfProgress.totalPages}...`
                  : "Processing files..."
                : isProcessing
                ? "Extracting recipe..."
                : "Scan a Recipe"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Take a photo, upload images, or upload a PDF of a recipe
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleInputChange}
              disabled={isProcessing || isConverting}
              data-testid="input-camera-capture"
            />
            <Button
              variant="outline"
              onClick={openCamera}
              disabled={isProcessing || isConverting}
              data-testid="button-camera"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.pdf,application/pdf"
              multiple
              className="hidden"
              onChange={handleInputChange}
              disabled={isProcessing || isConverting}
              data-testid="input-file-upload"
            />
            <Button
              variant="outline"
              onClick={openFilePicker}
              disabled={isProcessing || isConverting}
              data-testid="button-upload-files"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((f) => (
              <div
                key={f.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                data-testid={`file-preview-${f.id}`}
              >
                <img
                  src={f.preview}
                  alt="Recipe page"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(f.id)}
                  disabled={isProcessing}
                  data-testid={`button-remove-file-${f.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  {f.isPdf ? (
                    <>
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        p.{f.pageNumber}
                      </span>
                    </>
                  ) : (
                    <Image className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleProcess}
            disabled={isProcessing || isConverting || files.length === 0}
            data-testid="button-process-recipe"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting Recipe...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Extract Recipe from {files.length} {files.length === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
