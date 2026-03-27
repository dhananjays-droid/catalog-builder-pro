import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadArtifact, type DownloadStep } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  jobId: string;
  step: DownloadStep;
  label?: string;
}

async function triggerDownload(jobId: string, step: DownloadStep, format: "csv" | "xlsx") {
  try {
    const res = await downloadArtifact(jobId, step, format);
    const disposition = res.headers.get("content-disposition");
    let filename = `${step}.${format}`;
    if (disposition) {
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1];
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    toast.error(e.message);
  }
}

export default function DownloadButtons({ jobId, step, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Button variant="outline" size="sm" onClick={() => triggerDownload(jobId, step, "csv")}>
        <Download className="w-3.5 h-3.5 mr-1.5" />CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => triggerDownload(jobId, step, "xlsx")}>
        <Download className="w-3.5 h-3.5 mr-1.5" />Excel
      </Button>
    </div>
  );
}
