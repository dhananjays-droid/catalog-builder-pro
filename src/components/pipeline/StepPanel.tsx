import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import DownloadButtons from "./DownloadButtons";
import PreviewTable from "./PreviewTable";
import FileUpload from "./FileUpload";
import type { DownloadStep } from "@/lib/api";

interface Props {
  stepKey: string;
  label: string;
  description: string;
  hint: string;
  isCompleted: boolean;
  isRunning: boolean;
  isLocked: boolean;
  error: string | null;
  jobId: string;
  onRun: (opts?: any) => void;
  downloads: { step: DownloadStep; label: string }[];
  showUpload?: boolean;
  showReplicateToken?: boolean;
  showConcurrency?: boolean;
  onFileSelect?: (file: File) => void;
}

export default function StepPanel({
  stepKey,
  label,
  description,
  hint,
  isCompleted,
  isRunning,
  isLocked,
  error,
  jobId,
  onRun,
  downloads,
  showUpload,
  showReplicateToken,
  showConcurrency,
  onFileSelect,
}: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [replicateToken, setReplicateToken] = useState("");
  const [concurrency, setConcurrency] = useState(10);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleRun = () => {
    const opts: any = {};
    if (showUpload && selectedFile) opts.file = selectedFile;
    if (showReplicateToken && replicateToken) opts.replicateToken = replicateToken;
    if (showConcurrency) opts.concurrency = concurrency;
    onRun(opts);
  };

  return (
    <div className={cn("bg-card border rounded-lg p-4 space-y-3 transition-opacity", isLocked && "opacity-50")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {isCompleted && (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full shrink-0">
            Done
          </span>
        )}
      </div>

      {showUpload && !isCompleted && (
        <FileUpload
          disabled={isLocked || isRunning}
          onFileSelect={(f) => {
            setSelectedFile(f);
            onFileSelect?.(f);
          }}
        />
      )}

      {showReplicateToken && !isCompleted && (
        <Input
          type="password"
          placeholder="Replicate token (optional, uses server default)"
          value={replicateToken}
          onChange={(e) => setReplicateToken(e.target.value)}
          disabled={isLocked || isRunning}
          className="text-sm"
        />
      )}

      {showConcurrency && !isCompleted && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Concurrency:</label>
          <Input
            type="number"
            min={1}
            max={50}
            value={concurrency}
            onChange={(e) => setConcurrency(Math.max(1, Math.min(50, Number(e.target.value))))}
            disabled={isLocked || isRunning}
            className="w-20 text-sm"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">{hint}</p>

      {error && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-md p-3" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {!isCompleted && (
          <Button
            size="sm"
            disabled={isLocked || isRunning || (showUpload && !selectedFile && stepKey === "scrape")}
            onClick={handleRun}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Run {label.toLowerCase()}
              </>
            )}
          </Button>
        )}

        {isCompleted && downloads.map((d) => (
          <DownloadButtons key={d.step} jobId={jobId} step={d.step} label={d.label} />
        ))}

        {isCompleted && (
          <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            {showPreview ? "Hide" : "Preview"}
          </Button>
        )}
      </div>

      {showPreview && isCompleted && (
        <PreviewTable jobId={jobId} step={downloads[0]?.step || ("scrape" as DownloadStep)} />
      )}
    </div>
  );
}
