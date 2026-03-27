const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const PIPELINE_BASE = `${API_BASE}/catalog/pipeline`;

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent("auth-expired"));
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const body = await res.text();
    let msg = `Request failed (${res.status})`;
    try { msg = JSON.parse(body).detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export interface JobStatus {
  job_id: string;
  status: "idle" | "running" | "completed" | "failed";
  current_step?: string | null;
  error?: string | null;
  completed_steps: {
    scrape: boolean;
    segregate: boolean;
    generate: boolean;
    title: boolean;
  };
  paths?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export async function createJob(): Promise<{ job_id: string; message: string }> {
  const res = await fetch(`${PIPELINE_BASE}/jobs`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${PIPELINE_BASE}/jobs/${jobId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function uploadInput(jobId: string, file: File): Promise<any> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${PIPELINE_BASE}/jobs/${jobId}/upload-input`, {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
  return handleResponse(res);
}

export async function startScrape(jobId: string, file?: File): Promise<any> {
  const headers: HeadersInit = { ...authHeaders() };
  let body: BodyInit | undefined;
  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    body = fd;
  }
  const res = await fetch(`${PIPELINE_BASE}/jobs/${jobId}/scrape`, {
    method: "POST",
    headers,
    body,
  });
  return handleResponse(res);
}

export async function startSegregate(jobId: string): Promise<any> {
  const res = await fetch(`${PIPELINE_BASE}/jobs/${jobId}/segregate`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function startGenerateImages(jobId: string, replicateToken?: string): Promise<any> {
  const url = new URL(`${PIPELINE_BASE}/jobs/${jobId}/generate-instructor-images`);
  if (replicateToken) url.searchParams.set("replicate_token", replicateToken);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function startTitleUpdate(jobId: string, concurrency = 10): Promise<any> {
  const url = new URL(`${PIPELINE_BASE}/jobs/${jobId}/title-update`);
  url.searchParams.set("concurrency", String(concurrency));
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export type DownloadStep = "scrape" | "person" | "graphic" | "generated" | "final";

export async function downloadArtifact(
  jobId: string,
  step: DownloadStep,
  format: "csv" | "xlsx" = "csv"
): Promise<Response> {
  const url = `${PIPELINE_BASE}/jobs/${jobId}/download/${step}?format=${format}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res;
}

export async function fetchCsvText(jobId: string, step: DownloadStep): Promise<string> {
  const res = await downloadArtifact(jobId, step, "csv");
  return res.text();
}
