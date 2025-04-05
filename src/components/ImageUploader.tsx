import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export default function ImageUploader({
  onUpload,
  isLoading = false,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/dicom': ['.dcm'],
    'application/octet-stream': ['.nii', '.nii.gz']
  },
  maxSize = 4 * 1024 * 1024, // 4MB limit for Gemini API
  className
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const selectedFile = acceptedFiles[0];
    
    if (selectedFile) {
      // Check if file is under 10MB (Gemini API limit is around 4MB, but we'll warn at 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Warning: File is very large and may exceed Gemini API limits. Consider using a smaller image.");
      }
      
      setFile(selectedFile);
      
      // Only create preview for image files
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadstart = () => setProgress(0);
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        reader.onload = () => {
          setPreview(reader.result as string);
          setProgress(100);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For non-image files like DICOM
        setPreview(null);
        setProgress(100);
      }
    }
  }, []);
  
  const onDropRejected = useCallback((fileRejections: any[]) => {
    const rejection = fileRejections[0];
    if (rejection) {
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload a JPEG, PNG, DICOM, or NIfTI file.');
      } else {
        setError('Invalid file. Please try another.');
      }
    }
  }, [maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    multiple: false,
    disabled: isLoading
  });
  
  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
  };
  
  const handleAnalyze = () => {
    if (file && typeof onUpload === 'function') {
      onUpload(file);
    } else if (file) {
      console.error('onUpload is not a function. Please provide a valid callback function.');
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      {!file ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-gray-300 hover:border-primary/50 hover:bg-primary/5",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the file here..." : "Drag & drop medical image here"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, DICOM, NIfTI
              </p>
              <p className="text-xs text-gray-500">
                Maximum file size: {maxSize / (1024 * 1024)}MB (Gemini API limit)
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading}
            >
              Browse Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileImage className="h-5 w-5 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-1 mb-2" />
          
          {preview && (
            <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}
          
          {!preview && progress === 100 && (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg mt-3">
              <div className="text-center">
                <FileImage className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {file.type || 'File'} preview not available
                </p>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleAnalyze}
            className="w-full mt-3"
            disabled={isLoading || !file}
          >
            {isLoading ? "Analyzing..." : "Analyze Image"}
          </Button>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 