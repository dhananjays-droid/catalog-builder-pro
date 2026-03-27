import { useState, useEffect } from "react";
import Papa from "papaparse";
import { fetchCsvText, type DownloadStep } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;
const IMAGE_COLS = ["instructor image", "updated_instructor_image", "instructor_image"];
const HIGHLIGHT_COLS = ["title", "original_title", "headline", "instructor name", "description", "id", "course_regular_url"];

function isImageCol(col: string) {
  return IMAGE_COLS.some((c) => col.toLowerCase().includes(c.toLowerCase()));
}

function isHighlightCol(col: string) {
  return HIGHLIGHT_COLS.some((c) => col.toLowerCase() === c.toLowerCase());
}

interface Props {
  jobId: string;
  step: DownloadStep;
}

export default function PreviewTable({ jobId, step }: Props) {
  const [data, setData] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCsvText(jobId, step)
      .then((text) => {
        if (cancelled) return;
        const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
        const rows = result.data;
        if (rows.length > 0) {
          setHeaders(rows[0]);
          setData(rows.slice(1));
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [jobId, step]);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="text-sm text-destructive py-4">{error}</p>;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground py-4">No data available.</p>;

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{data.length} rows · Page {page + 1} of {totalPages}</p>
      <div className="overflow-x-auto border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className={cn("whitespace-nowrap text-xs", isHighlightCol(h) && "font-bold text-foreground")}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row, ri) => (
              <TableRow key={ri}>
                {row.map((cell, ci) => (
                  <TableCell key={ci} className="text-xs max-w-[200px] truncate">
                    {isImageCol(headers[ci]) && cell ? (
                      <img
                        src={cell}
                        alt="instructor"
                        className="w-10 h-10 rounded object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : (
                      cell
                    )}
                    {isImageCol(headers[ci]) && cell && <ImageOff className="w-4 h-4 text-muted-foreground hidden" />}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
