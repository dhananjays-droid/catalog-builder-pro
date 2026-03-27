import { useState, useRef, type DragEvent } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT = ".csv,.xlsx,.xls";

export default function FileUpload({ onFileSelect, disabled }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    onFileSelect(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drop a CSV or Excel file here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
      </div>

      {file && (
        <div className="flex items-center gap-2 bg-card rounded-md p-2 border">
          <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
