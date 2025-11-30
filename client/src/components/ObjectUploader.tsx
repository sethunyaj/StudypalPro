import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Check } from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  path: string;
}

interface ObjectUploaderProps {
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadComplete: (file: UploadedFile) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
}

export function ObjectUploader({
  maxFileSize = 52428800,
  allowedFileTypes,
  onUploadComplete,
  buttonClassName,
  buttonVariant = "outline",
  buttonSize = "default",
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    if (allowedFileTypes && allowedFileTypes.length > 0) {
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedFileTypes.some(t => t.includes(fileExt) || t === file.type)) {
        setError(`File type not allowed. Allowed: ${allowedFileTypes.join(', ')}`);
        return;
      }
    }

    setError(null);
    setSelectedFile(file);
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create FormData for server-side upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 90;
          setUploadProgress(Math.round(progress));
        }
      });

      const result = await new Promise<{ objectPath: string; fileName: string; fileSize: number }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const errResponse = JSON.parse(xhr.responseText);
              reject(new Error(errResponse.error || `Upload failed: ${xhr.statusText}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed - network error'));
        xhr.open('POST', '/api/objects/upload');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      setUploadProgress(100);
      setUploadComplete(true);

      onUploadComplete({
        name: selectedFile.name,
        size: selectedFile.size,
        path: result.objectPath,
      });

      setTimeout(() => {
        setShowModal(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadComplete(false);
      }, 1000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <Button 
        type="button"
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant={buttonVariant}
        size={buttonSize}
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={(open) => {
        if (!uploading) {
          setShowModal(open);
          if (!open) {
            setSelectedFile(null);
            setError(null);
            setUploadProgress(0);
            setUploadComplete(false);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept={allowedFileTypes?.join(',')}
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!uploading && !uploadComplete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {uploadComplete && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {uploading && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || uploadComplete}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
