import { Check, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  key: string;
  label: string;
  description: string;
}

export const STEPS: StepDef[] = [
  { key: "scrape", label: "Scrape", description: "Enrich rows from course URLs" },
  { key: "segregate", label: "Segregate", description: "Split real-face vs graphic rows" },
  { key: "generate", label: "Generate images", description: "AI-generated instructor portraits" },
  { key: "title", label: "Title update", description: "Rewrite titles into ad copy" },
];

interface Props {
  completedSteps: Record<string, boolean>;
  currentStep: string | null;
  isRunning: boolean;
}

export default function PipelineStepper({ completedSteps, currentStep, isRunning }: Props) {
  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => {
        const done = completedSteps[step.key];
        const active = isRunning && currentStep === step.key;
        const unlocked = i === 0 || completedSteps[STEPS[i - 1].key];

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shrink-0",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && unlocked && "bg-secondary text-secondary-foreground",
                  !done && !active && !unlocked && "bg-muted text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !unlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-xs font-medium text-center truncate w-full">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-4 mx-1 rounded-full transition-colors mt-[-1rem]",
                  done ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
