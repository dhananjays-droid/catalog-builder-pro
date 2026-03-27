import { useState, useCallback, useRef, useEffect } from "react";
import {
  createJob,
  getJobStatus,
  startScrape,
  startSegregate,
  startGenerateImages,
  startTitleUpdate,
  type JobStatus,
} from "@/lib/api";

const POLL_INTERVAL = 2500;

export function usePipelineJob() {
  const [jobId, setJobId] = useState<string | null>(() =>
    localStorage.getItem("pipeline_job_id")
  );
  const [job, setJob] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(
    (id: string) => {
      stopPolling();
      const poll = async () => {
        try {
          const status = await getJobStatus(id);
          setJob(status);
          if (status.status !== "running") {
            stopPolling();
            setLoading(false);
            if (status.status === "failed") {
              setError(status.error || "Step failed");
            }
          }
        } catch (e: any) {
          setError(e.message);
          stopPolling();
          setLoading(false);
        }
      };
      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
    },
    [stopPolling]
  );

  const initJob = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { job_id } = await createJob();
      setJobId(job_id);
      localStorage.setItem("pipeline_job_id", job_id);
      const status = await getJobStatus(job_id);
      setJob(status);
      setLoading(false);
      return job_id;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const resumeJob = useCallback(
    async (id: string) => {
      setError(null);
      setJobId(id);
      localStorage.setItem("pipeline_job_id", id);
      try {
        const status = await getJobStatus(id);
        setJob(status);
        if (status.status === "running") {
          setLoading(true);
          pollJob(id);
        }
      } catch (e: any) {
        setError(e.message);
      }
    },
    [pollJob]
  );

  const runStep = useCallback(
    async (
      step: "scrape" | "segregate" | "generate" | "title",
      opts?: { file?: File; replicateToken?: string; concurrency?: number }
    ) => {
      if (!jobId) return;
      setError(null);
      setLoading(true);
      try {
        switch (step) {
          case "scrape":
            await startScrape(jobId, opts?.file);
            break;
          case "segregate":
            await startSegregate(jobId);
            break;
          case "generate":
            await startGenerateImages(jobId, opts?.replicateToken);
            break;
          case "title":
            await startTitleUpdate(jobId, opts?.concurrency ?? 10);
            break;
        }
        pollJob(jobId);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    },
    [jobId, pollJob]
  );

  // On mount, try to resume existing job
  useEffect(() => {
    const stored = localStorage.getItem("pipeline_job_id");
    if (stored) {
      resumeJob(stored);
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearJob = useCallback(() => {
    stopPolling();
    setJobId(null);
    setJob(null);
    setError(null);
    setLoading(false);
    localStorage.removeItem("pipeline_job_id");
  }, [stopPolling]);

  return { jobId, job, loading, error, setError, initJob, resumeJob, runStep, clearJob };
}
