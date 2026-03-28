import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { fetchCsvText } from "@/lib/api";
import { Loader2, ExternalLink, Copy, ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CatalogItem {
  id: string;
  title: string;
  originalTitle: string;
  headline: string;
  description: string;
  instructorName: string;
  imageUrl: string;
  courseUrl: string;
  [key: string]: string;
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().trim() === c.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

export default function CatalogGallery({ jobId }: { jobId: string }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    fetchCsvText(jobId, "final")
      .then((text) => {
        const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
        const rows = result.data;
        if (rows.length < 2) return;
        const h = rows[0];
        const idIdx = findCol(h, "id", "product_id");
        const titleIdx = findCol(h, "title", "updated_title");
        const origTitleIdx = findCol(h, "original_title");
        const headlineIdx = findCol(h, "headline");
        const descIdx = findCol(h, "description");
        const instrIdx = findCol(h, "instructor name", "instructor_name");
        const imgIdx = findCol(h, "updated_instructor_image", "instructor image", "instructor_image");
        const urlIdx = findCol(h, "course_regular_url", "url");

        const mapped: CatalogItem[] = rows.slice(1).map((r) => {
          const base: CatalogItem = {
            id: r[idIdx] || "",
            title: r[titleIdx] || "",
            originalTitle: origTitleIdx >= 0 ? r[origTitleIdx] || "" : "",
            headline: headlineIdx >= 0 ? r[headlineIdx] || "" : "",
            description: descIdx >= 0 ? r[descIdx] || "" : "",
            instructorName: instrIdx >= 0 ? r[instrIdx] || "" : "",
            imageUrl: imgIdx >= 0 ? r[imgIdx] || "" : "",
            courseUrl: urlIdx >= 0 ? r[urlIdx] || "" : "",
          };
          // Store all extra columns
          h.forEach((header, ci) => {
            const key = header.trim();
            if (key && !(key in base)) {
              base[key] = r[ci] || "";
            }
          });
          return base;
        });
        setItems(mapped);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [jobId]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.instructorName.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  const knownKeys = new Set(["id", "title", "originalTitle", "headline", "description", "instructorName", "imageUrl", "courseUrl"]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by title, ID, or instructor…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <p className="text-xs text-muted-foreground">{filtered.length} items</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => (
          <div
            key={i}
            className="bg-card border rounded-lg overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-primary/40 transition-shadow"
            onClick={() => setSelectedItem(item)}
          >
            <div className="aspect-[4/3] bg-muted relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.instructorName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col flex-1 gap-1.5">
              <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</h3>
              {item.headline && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.headline}</p>
              )}
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.instructorName}</p>
                  {item.id && <p className="text-[10px] text-muted-foreground font-mono">#{item.id}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.courseUrl && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); }} asChild>
                      <a href={item.courseUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.title);
                      toast.success("Title copied");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base leading-snug">{selectedItem.title}</DialogTitle>
                {selectedItem.originalTitle && selectedItem.originalTitle !== selectedItem.title && (
                  <DialogDescription className="text-xs">
                    Original: {selectedItem.originalTitle}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Image */}
                {selectedItem.imageUrl && (
                  <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.instructorName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                {/* Key fields */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Instructor" value={selectedItem.instructorName} />
                  <Field label="ID" value={selectedItem.id} mono />
                  {selectedItem.headline && <Field label="Headline" value={selectedItem.headline} span />}
                  {selectedItem.description && <Field label="Description" value={selectedItem.description} span />}
                </div>

                {/* Extra columns */}
                {(() => {
                  const extras = Object.entries(selectedItem).filter(
                    ([k, v]) => !knownKeys.has(k) && v
                  );
                  if (!extras.length) return null;
                  return (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional fields</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {extras.map(([k, v]) => (
                          <Field key={k} label={k} value={v} span={v.length > 60} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {selectedItem.courseUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedItem.courseUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Open course
                      </a>
                    </Button>
                  )}
                  {selectedItem.imageUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedItem.imageUrl} target="_blank" rel="noopener noreferrer">
                        Open image
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.title);
                      toast.success("Title copied");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy title
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono, span }: { label: string; value: string; mono?: boolean; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm leading-relaxed ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
