import { useState } from "react";
import { usePipelineJob } from "@/hooks/usePipelineJob";
import PipelineStepper, { STEPS } from "@/components/pipeline/PipelineStepper";
import StepPanel from "@/components/pipeline/StepPanel";
import CatalogGallery from "@/components/pipeline/CatalogGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, RotateCw, AlertTriangle, LayoutGrid, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { DownloadStep } from "@/lib/api";

export default function Index() {
  const { jobId, job, loading, error, setError, initJob, resumeJob, runStep, clearJob } = usePipelineJob();
  const [resumeInput, setResumeInput] = useState("");
  const [view, setView] = useState<"steps" | "gallery">("steps");

  const completedSteps = job?.completed_steps || { scrape: false, segregate: false, generate: false, title: false };
  const isRunning = job?.status === "running";
  const isFailed = job?.status === "failed";

  const stepError = (key: string) => {
    if (isFailed && job?.current_step === key) return job.error || "Step failed";
    return null;
  };

  const showGallery = completedSteps.title;

  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catalog Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a course feed, scrape, segregate, generate images, and rewrite titles.
            </p>
          </div>
          <Button size="lg" onClick={initJob} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Start new pipeline
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or resume</span></div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Paste Job ID…"
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button variant="outline" disabled={!resumeInput.trim()} onClick={() => resumeJob(resumeInput.trim())}>
              Resume
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-start gap-2 bg-warning/10 text-warning rounded-md p-3 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs">Refreshing the server loses active jobs. Save your Job ID to resume later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Catalog Pipeline</h1>
              <p className="text-xs text-muted-foreground">Scrape → Segregate → Generate images → Title update</p>
            </div>
            <div className="flex items-center gap-2">
              {showGallery && (
                <div className="flex items-center border rounded-md overflow-hidden">
                  <Button
                    variant={view === "steps" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setView("steps")}
                  >
                    <Table2 className="w-3.5 h-3.5 mr-1" />Steps
                  </Button>
                  <Button
                    variant={view === "gallery" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setView("gallery")}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 mr-1" />Gallery
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={clearJob}>
                <RotateCw className="w-3.5 h-3.5 mr-1" />New job
              </Button>
            </div>
          </div>

          {/* Job info bar */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded font-mono">
              {jobId.slice(0, 8)}…
              <button
                onClick={() => { navigator.clipboard.writeText(jobId); toast.success("Job ID copied"); }}
                className="hover:text-primary"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              job?.status === "completed" ? "bg-success/10 text-success" :
              job?.status === "running" ? "bg-primary/10 text-primary animate-pulse-soft" :
              job?.status === "failed" ? "bg-destructive/10 text-destructive" :
              "bg-muted text-muted-foreground"
            }`}>
              {job?.status || "idle"}
            </span>
            {job?.updated_at && (
              <span className="text-muted-foreground">
                Updated {new Date(job.updated_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          <PipelineStepper
            completedSteps={completedSteps}
            currentStep={job?.current_step || null}
            isRunning={isRunning}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {error && !isFailed && (
          <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-md p-3" role="alert">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {view === "gallery" && showGallery ? (
          <CatalogGallery jobId={jobId} />
        ) : (
          <>
            <StepPanel
              stepKey="scrape"
              label="Scrape"
              description="Enrich rows from course URLs: instructor name, image, description."
              hint="May take several minutes depending on the number of rows."
              isCompleted={completedSteps.scrape}
              isRunning={isRunning && job?.current_step === "scrape"}
              isLocked={false}
              error={stepError("scrape")}
              jobId={jobId}
              onRun={(opts) => runStep("scrape", opts)}
              downloads={[{ step: "scrape" as DownloadStep, label: "Scraped" }]}
              showUpload
              onFileSelect={() => setError(null)}
            />
            <StepPanel
              stepKey="segregate"
              label="Segregate"
              description="Split rows into real-face (person) vs graphic/logo rows."
              hint="Usually completes in under a minute."
              isCompleted={completedSteps.segregate}
              isRunning={isRunning && job?.current_step === "segregate"}
              isLocked={!completedSteps.scrape}
              error={stepError("segregate")}
              jobId={jobId}
              onRun={() => runStep("segregate")}
              downloads={[
                { step: "person" as DownloadStep, label: "Person rows" },
                { step: "graphic" as DownloadStep, label: "Graphic rows" },
              ]}
            />
            <StepPanel
              stepKey="generate"
              label="Generate images"
              description="AI-generated catalog-style instructor portraits."
              hint="Takes a few minutes. Uses Replicate API."
              isCompleted={completedSteps.generate}
              isRunning={isRunning && job?.current_step === "generate"}
              isLocked={!completedSteps.segregate}
              error={stepError("generate")}
              jobId={jobId}
              onRun={(opts) => runStep("generate", opts)}
              downloads={[{ step: "generated" as DownloadStep, label: "Generated" }]}
              showReplicateToken
            />
            <StepPanel
              stepKey="title"
              label="Title update"
              description="Rewrite titles into short ad-copy format."
              hint="Processing time depends on concurrency setting."
              isCompleted={completedSteps.title}
              isRunning={isRunning && job?.current_step === "title"}
              isLocked={!completedSteps.generate}
              error={stepError("title")}
              jobId={jobId}
              onRun={(opts) => runStep("title", opts)}
              downloads={[{ step: "final" as DownloadStep, label: "Final feed" }]}
              showConcurrency
            />
          </>
        )}
      </main>
    </div>
  );
}
