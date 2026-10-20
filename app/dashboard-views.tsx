"use client";

import {
  AlertTriangle, Archive, ArrowRight, ArrowUpDown, Bot, Camera, ChevronLeft, ChevronRight, Copy,
  CheckCircle2, Cloud, FileClock, FolderHeart, Globe2, HardDrive, Loader2, Pencil,
  Heart, LockKeyhole, MessageCircle, MoreHorizontal, Play, RefreshCw,
  Search, Send, Server, TrendingUp, UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type PageKey = "overview" | "content" | "ugc_content" | "published" | "ugc" | "team" | "settings";

export type ReviewItem = {
  id: string;
  title: string;
  type: "Reel" | "Carousel" | "Image" | "UGC";
  status: string;
  mediaType?: string;
  driveFileId?: string | null;
  driveFileIds?: string[];
  images?: string[];
  capturedAt: string;
  capturedLabel: string;
  source: string;
  market?: string;
  markets: string[];
  image: string;
  caption: string;
  kind?: "owned" | "ugc";
  localizations?: {
    market: string;
    caption: string;
    status: string;
    approved_by: string | null;
    approved_at: string | null;
    published_at: string | null;
    meta_media_id: string | null;
  }[];
};

type OverviewStats = {
  capturedContent: number;
  pendingApproval: number;
  published7d: number;
  publishedTotal: number;
  openFailures: number;
  publishingAccounts: { market: string | null; accountName: string | null; status: string | null }[];
};

export const contentItems: ReviewItem[] = [
  { id: "MJ-0248", title: "Golden hour stacking set", type: "Reel", status: "Needs localization", capturedAt: "2026-09-20T10:42:00", capturedLabel: "20 Sep 2026 · 10:42", source: "@mamajewels.nl", markets: ["NL"], image: "/content/mamajewels-product-post.png", caption: "Golden details, made for everyday moments. ✨", kind: "owned" },
  { id: "MJ-0247", title: "Three ways to style pearls", type: "Carousel", status: "Ready for approval", capturedAt: "2026-09-20T10:18:00", capturedLabel: "20 Sep 2026 · 10:18", source: "@mamajewels.nl", markets: ["NL, DE, FR, US"], image: "/content/mamajewels-product-post.png", caption: "Three effortless ways to make pearls part of your everyday stack.", kind: "owned" },
  { id: "MJ-0246", title: "Behind the scenes: Utrecht", type: "Reel", status: "Dutch speech detected", capturedAt: "2026-09-20T09:41:00", capturedLabel: "20 Sep 2026 · 09:41", source: "@mamajewels.nl", markets: ["NL"], image: "/content/mamajewels-product-post.png", caption: "A quiet look behind the scenes with our team in Utrecht.", kind: "owned" },
  { id: "MJ-0245", title: "Minimal hoops — launch edit", type: "Image", status: "Ready for approval", capturedAt: "2026-09-20T08:12:00", capturedLabel: "20 Sep 2026 · 08:12", source: "@mamajewels.nl", markets: ["NL, DE, FR, US"], image: "/content/mamajewels-product-post.png", caption: "Our lightest hoops yet—simple, polished and easy to wear.", kind: "owned" },
  { id: "MJ-0244", title: "The everyday chain", type: "Carousel", status: "Published", capturedAt: "2026-09-19T16:30:00", capturedLabel: "19 Sep 2026 · 16:30", source: "@mamajewels.nl", markets: ["NL, DE, FR, US"], image: "/content/mamajewels-product-post.png", caption: "The chain you never need to take off.", kind: "owned" },
  { id: "MJ-0243", title: "Packing your weekend jewelry", type: "Reel", status: "Partial failure", capturedAt: "2026-09-19T12:05:00", capturedLabel: "19 Sep 2026 · 12:05", source: "@mamajewels.nl", markets: ["NL, DE, FR"], image: "/content/mamajewels-product-post.png", caption: "A small edit for the perfect weekend away.", kind: "owned" },
];

export const ugcItems: ReviewItem[] = [
  { id: "UGC-0189", title: "Anniversary stack by @lena.rose", type: "UGC", status: "Permission not requested", capturedAt: "2026-09-20T10:48:00", capturedLabel: "20 Sep 2026 · 10:48", source: "Instagram mention", markets: ["NL"], image: "/content/mamajewels-ugc-post.png", caption: "The sweetest anniversary coffee with my everyday MamaJewels stack.", kind: "ugc" },
  { id: "UGC-0188", title: "Pearl edit by @sofievanbeek", type: "UGC", status: "Permission requested", capturedAt: "2026-09-20T09:50:00", capturedLabel: "20 Sep 2026 · 09:50", source: "Tagged content", markets: ["NL"], image: "/content/mamajewels-ugc-post.png", caption: "Pearls, coffee and a slow Sunday morning.", kind: "ugc" },
  { id: "UGC-0187", title: "Unboxing by @mariejolie", type: "UGC", status: "Permission approved", capturedAt: "2026-09-20T07:28:00", capturedLabel: "20 Sep 2026 · 07:28", source: "Instagram mention", markets: ["FR"], image: "/content/mamajewels-ugc-post.png", caption: "Unboxing the most delicate gold pieces.", kind: "ugc" },
  { id: "UGC-0186", title: "Daily layers by @elise.jpg", type: "UGC", status: "Permission declined", capturedAt: "2026-09-19T14:16:00", capturedLabel: "19 Sep 2026 · 14:16", source: "Apify fallback", markets: ["DE"], image: "/content/mamajewels-ugc-post.png", caption: "My current daily layers.", kind: "ugc" },
];

const publicationData = [
  { market: "NL", published: 68 },
  { market: "DE", published: 61 },
  { market: "FR", published: 55 },
  { market: "US", published: 58 },
];

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("published") || normalized.includes("approved") || normalized === "healthy") return "bg-[#e8f7ee] text-[#257048]";
  if (normalized.includes("failure") || normalized.includes("failed") || normalized.includes("declined")) return "bg-[#fdebec] text-[#a33442]";
  if (normalized.includes("localization") || normalized.includes("speech") || normalized.includes("manual") || normalized.includes("publishing")) return "bg-[#fff2d5] text-[#87600f]";
  return "bg-[#eaf1ff] text-[#315f9f]";
};

const marketNames: Record<string, string> = {
  DE: "Germany",
  FR: "France",
  US: "USA",
  NL: "Netherlands",
};

function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>{eyebrow ? <p className="mb-1 text-sm font-medium text-[#8a6578]">{eyebrow}</p> : null}<h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-[15px] text-[#756e79]">{description}</p></div>
    {action}
  </div>;
}

import { Download, Maximize2, X } from "lucide-react";

export function CarouselMediaViewer({ images, title, className = "" }: { images: string[]; title: string; className?: string }) {
  const media = images.filter(Boolean);
  const mediaKey = media.join("|");
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => setIndex(0), [mediaKey]);

  // Preload next and previous images for instant switching
  useEffect(() => {
    if (media.length > 1) {
      const nextImg = new Image();
      nextImg.src = media[(index + 1) % media.length];
      const prevImg = new Image();
      prevImg.src = media[(index - 1 + media.length) % media.length];
    }
  }, [index, media]);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "ArrowRight") setIndex((current) => (current + 1) % media.length);
      if (e.key === "ArrowLeft") setIndex((current) => (current - 1 + media.length) % media.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, media.length]);

  const downloadCurrentImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-image-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  if (!media.length) {
    return <div className={`grid aspect-square place-items-center bg-[#f3eff3] text-sm text-[#827a84] ${className}`}>Media unavailable</div>;
  }

  const currentUrl = media[index % media.length];

  return (
    <>
      <div className={`group relative aspect-square overflow-hidden bg-black ${className}`}>
        <img
          src={currentUrl}
          alt={`${title} image ${index + 1}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />

        {/* Top-right Action Buttons: Fullscreen & Download */}
        <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => downloadCurrentImage(currentUrl)}
            aria-label="Download image"
            title="Download image"
            className="grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            aria-label="Full screen"
            title="Full screen"
            className="grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>

        {media.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setIndex((current) => (current - 1 + media.length) % media.length)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % media.length)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
              {index + 1} / {media.length}
            </span>
          </>
        ) : null}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          {/* Top Controls */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCurrentImage(currentUrl)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            >
              <Download className="size-4" /> Download
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="grid size-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <img
            src={currentUrl}
            alt={`${title} fullscreen image`}
            decoding="async"
            referrerPolicy="no-referrer"
            className="max-h-[90vh] max-w-[90vw] select-none object-contain"
          />

          {media.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((current) => (current - 1 + media.length) % media.length)}
                className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
              >
                <ChevronLeft className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((current) => (current + 1) % media.length)}
                className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
              >
                <ChevronRight className="size-7" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs text-white">
                {index + 1} / {media.length}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}


function MetricCard({ label, value, note, icon: Icon, dark = false }: { label: string; value: string; note: string; icon: React.ComponentType<{ className?: string }>; dark?: boolean }) {
  return <article className={`rounded-2xl border p-5 shadow-[0_3px_16px_rgba(39,24,48,.035)] ${dark ? "border-[#2d1c36] bg-[#2d1c36] text-white" : "border-[#e8e4ea] bg-white"}`}>
    <div className="flex items-start justify-between"><div><p className={`text-sm font-medium ${dark ? "text-white/55" : "text-[#746c78]"}`}>{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${dark ? "bg-white/10 text-[#f7a8c4]" : "bg-[#f8edf2] text-[#8a3f63]"}`}><Icon className="size-[18px]" /></span></div>
    <p className={`mt-3 text-xs ${dark ? "text-white/45" : "text-[#9a939d]"}`}>{note}</p>
  </article>;
}

export function OverviewView({
  onNavigate,
  userName,
}: {
  onNavigate: (page: PageKey) => void;
  onOpen?: (item: ReviewItem) => void;
  items?: ReviewItem[];
  userName: string;
}) {
  const [overview, setOverview] = useState<OverviewStats | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/overview", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load overview");
        return response.json();
      })
      .then((data) => { if (active) setOverview(data as OverviewStats); })
      .catch((error) => console.error("Overview error:", error));
    return () => { active = false; };
  }, []);

  const stats = [
    {
      label: "Captured content",
      value: String(overview?.capturedContent ?? 0),
      note: "Content captured by the system",
      icon: Archive,
    },
    {
      label: "Published this week",
      value: String(overview?.published7d ?? 0),
      note: "Across all markets",
      icon: CheckCircle2,
    },
    {
      label: "Total published",
      value: String(overview?.publishedTotal ?? 0),
      note: "Published through this system",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <PageTitle
        title={`Good morning, ${userName || "there"}`}
      description="Publishing activity and connected account status."
        action={
          <Button
            onClick={() => onNavigate("content")}
            className="h-11 rounded-xl bg-[#632b4a] px-5 text-white hover:bg-[#4e203a]"
          >
            Review content
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      
    </>
  );
}

type SortKey = "title" | "source" | "status" | "markets" | "type" | "capturedAt";

export function ContentView({
  title = "NL Content",
  description = "Review, edit and track NL content across Germany, France and the USA.",
  items = contentItems,
  onOpen,
  mode = "nl",
}: {
  title?: string;
  description?: string;
  items?: ReviewItem[];
  onOpen: (item: ReviewItem) => void;
  mode?: "nl" | "ugc";
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [market, setMarket] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("capturedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((value) => value === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("asc"); }
  };
  const filtered = useMemo(() => items
    .filter((item) => mode === "nl"
      ? item.source.toLowerCase().includes("@mamajewels.nl")
      : !item.source.toLowerCase().includes("@mamajewels.nl"))
    .filter((item) => !["published", "selected"].includes(item.status.trim().toLowerCase()))
    .filter((item) => `${item.title} ${item.id} ${item.source}`.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => status === "all" || (status === "review" ? item.status.toLowerCase().replace(/[\s-]+/g, "_") === "ready_for_approval" : item.status.toLowerCase().includes("failure")))
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => market === "all" || item.markets.includes(market))
    .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])) * (sortDirection === "asc" ? 1 : -1)), [items, market, mode, search, sortDirection, sortKey, status, type]);
  const SortHead = ({ label, column, className = "" }: { label: string; column: SortKey; className?: string }) => <TableHead className={className}><button onClick={() => toggleSort(column)} className="flex items-center gap-1.5 font-medium">{label}<ArrowUpDown className={`size-3.5 ${sortKey === column ? "text-[#6f3150]" : "text-[#aaa3ac]"}`} /></button></TableHead>;
  return <>
    <PageTitle title={title} description={description} />
    <article className="mt-7 overflow-hidden rounded-2xl border border-[#e8e4ea] bg-white shadow-[0_3px_16px_rgba(39,24,48,.035)]">
      <div className="grid gap-3 border-b border-[#eeeaf0] p-4 md:grid-cols-2 xl:grid-cols-[160px_minmax(200px,1fr)_repeat(3,150px)]">
        {/* Markets filter in 1st position */}
        <Select value={market} onValueChange={setMarket}>
          <SelectTrigger className="h-10 rounded-xl bg-[#faf9fb] font-medium">
            <SelectValue placeholder="All markets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All markets</SelectItem>
            <SelectItem value="NL">Netherlands (NL)</SelectItem>
            <SelectItem value="DE">Germany (DE)</SelectItem>
            <SelectItem value="FR">France (FR)</SelectItem>
            <SelectItem value="US">USA (US)</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#978f9a]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search content, ID or source"
            className="h-10 rounded-xl border-[#e5e1e7] bg-[#faf9fb] pl-10"
          />
        </div>

        

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="review">Needs Review</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Image">Image</SelectItem>
            <SelectItem value="Carousel">Carousel</SelectItem>
            <SelectItem value="Reel">Reel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#faf9fb]"><TableHead className="pl-5">ID</TableHead><TableHead>Image</TableHead><SortHead label="Source" column="source" /><SortHead label="Status" column="status" /><SortHead label="Markets" column="markets" /><SortHead label="Type" column="type" /><SortHead label="Captured" column="capturedAt" /></TableRow></TableHeader><TableBody>{filtered.map((item) => { const rawStatus = item.status.toLowerCase().replace(/[\s-]+/g, "_"); const shownStatus = rawStatus === "tag_new" ? "new" : rawStatus === "ready_for_approval_tagged" ? "ready_for_approval" : item.status; const thumbnail = item.images?.[0] || item.image; return <TableRow key={item.id} className="cursor-pointer" onClick={() => onOpen(item)}><TableCell className="pl-5 text-xs font-medium text-[#958e98]">{item.id}</TableCell><TableCell>{thumbnail ? item.mediaType?.toLowerCase() === "video" || item.mediaType?.toLowerCase() === "reel" ? <video src={thumbnail} muted playsInline preload="metadata" className="size-12 rounded-lg bg-black object-cover" /> : <img src={thumbnail} alt="" className="size-12 rounded-lg object-cover" /> : <span className="block size-12 rounded-lg bg-[#f3eff3]" />}</TableCell><TableCell className="text-[#6f6873]">{item.source}</TableCell><TableCell><Badge className={`${statusClass(item.status)} border-0 font-medium`}>{shownStatus}</Badge></TableCell><TableCell><div className="flex -space-x-1">{["NL","DE","FR","US"].map((code) => <span key={code} className={`grid size-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold ${item.markets.includes(code) ? "bg-[#dcefe4] text-[#286342]" : "bg-[#f1eef2] text-[#a099a2]"}`}>{code}</span>)}</div></TableCell><TableCell className="text-[#77707a]">{item.type}</TableCell><TableCell className="min-w-[170px] text-[#77707a]">{item.capturedLabel}</TableCell></TableRow>; })}</TableBody></Table></div>
      {filtered.length === 0 ? <div className="p-12 text-center"><Search className="mx-auto size-6 text-[#9b949e]" /><p className="mt-3 font-medium">No content found</p><p className="mt-1 text-sm text-[#8c8490]">Change or clear one of the filters.</p></div> : null}
    </article>
  </>;
}

export function PublishedView({
  items,
  loadError,
  onOpen,
}: {
  items: any[];
  loadError?: string | null;
  onOpen: (item: any) => void;
}) {
  const [marketFilter, setMarketFilter] = useState<string>("ALL");
  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter((item) => {
    if (marketFilter === "ALL") return true;
    const market = String(item.market || item.markets?.[0] || "").toUpperCase();
    return market === marketFilter;
  });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle title="Published content" description="Published posts by market." />
      </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#716a75]">Filter by Market:</label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="rounded-lg border border-[#e8e4ea] bg-white px-3 py-1.5 text-xs font-medium text-[#17121c] focus:outline-none focus:ring-1 focus:ring-[#703650]"
          >
            <option value="ALL">All Markets</option>
            <option value="DE">Germany (DE)</option>
            <option value="FR">France (FR)</option>
            <option value="US">USA (US)</option>
          </select>
        </div>
      </div>

      <article className="mt-7 overflow-hidden rounded-2xl border border-[#e8e4ea] bg-white shadow-[0_12px_28px_rgba(23,18,28,0.04)]">
        {loadError ? <div role="alert" className="border-b border-[#f2c6c9] bg-[#fff4f4] px-5 py-3 text-sm text-[#91343e]">{loadError}</div> : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#faf9fb]">
                <TableHead className="pl-5">ID</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Markets</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Captured</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredItems.map((item) => (

                <TableRow key={item.id} className="cursor-pointer hover:bg-[#faf9fb]" onClick={() => onOpen(item)}>
                  <TableCell className="pl-5 text-xs font-medium text-[#703650]">{item.contentId}</TableCell>
                  <TableCell>{(item.images?.[0] || item.image) ? item.mediaType?.toLowerCase() === "video" || item.mediaType?.toLowerCase() === "reel" ? <video src={item.images?.[0] || item.image} muted playsInline preload="metadata" className="size-12 rounded-lg bg-black object-cover" /> : <img src={item.images?.[0] || item.image} alt="" className="size-12 rounded-lg object-cover" /> : <span className="block size-12 rounded-lg bg-[#f3eff3]" />}</TableCell>

                  <TableCell className="text-[#6f6873]">{item.source || "—"}</TableCell>

                                    <TableCell>
                    <Badge
                      className={`border-0 font-medium ${
                        item.status?.toLowerCase() === "selected"
                          ? "bg-[#f3e8ff] text-[#6b21a8]"
                          : "bg-[#e8f7ee] text-[#257048]"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs font-medium capitalize text-[#554d58]">
                    {String(item.platform || "Meta").toLowerCase()}{item.slideIndex ? ` · Image ${item.slideIndex}` : ""}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{item.market}</Badge>
                  </TableCell>
                  <TableCell className="text-[#77707a]">{item.type?.toLowerCase() === "reel" || item.type?.toLowerCase() === "video" ? "Reel" : item.type?.toLowerCase() === "carousel" ? "Carousel" : item.type ? "Image" : "—"}</TableCell>
                  <TableCell className="min-w-[170px] text-[#77707a]">{item.capturedLabel || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!loadError && safeItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto size-6 text-[#9b949e]" />

            <p className="mt-3 font-medium">
              No published content
            </p>

            <p className="mt-1 text-sm text-[#8c8490]">
              Published posts will appear here after they are
              published through the system.
            </p>
          </div>
        ) : null}
      </article>
    </>
  );
}

export function UgcView({
  items = ugcItems,
  onOpen,
}: {
  items?: ReviewItem[];
  onOpen: (item: ReviewItem) => void;
}) {
  const [selectedMarket, setSelectedMarket] = useState<string>("ALL");

  const filteredItems = items.filter((item) => {
    if (selectedMarket === "ALL") return true;
    const market = (item.market || item.markets?.[0] || "").toUpperCase();
    return market === selectedMarket;
  });

  return <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <PageTitle title="UGC library" description="Tagged and mentioned customer content. Every item reflects authentic customer usage." />
    </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-[#716a75]">Filter by Market:</label>
        <select
          value={selectedMarket}
          onChange={(e) => setSelectedMarket(e.target.value)}
          className="rounded-lg border border-[#e8e4ea] bg-white px-3 py-1.5 text-xs font-medium text-[#17121c] focus:outline-none focus:ring-1 focus:ring-[#703650]"
        >
          <option value="ALL">All Markets</option>
          <option value="DE">Germany (DE)</option>
          <option value="FR">France (FR)</option>
          <option value="US">USA (US)</option>
        </select>
      </div>
    </div>
    <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {filteredItems.length === 0 ? <p className="text-sm text-[#827a84]">No UGC items match the selected market filter.</p> : null}
      {filteredItems.map((item) => {

        const marketCode = (item.market || item.markets?.[0] || "").toUpperCase();
        const marketName = marketNames[marketCode] || marketCode || "Unknown";
        const isVideo = item.mediaType?.toLowerCase() === "video" || item.mediaType?.toLowerCase() === "reel";
        return <article key={item.id} className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-[#e8e4ea] bg-white shadow-[0_3px_16px_rgba(39,24,48,.035)]">
          <div className="flex shrink-0 items-center gap-2.5 p-3">
            <span className="grid size-8 place-items-center rounded-full bg-[#f2dce6] text-[10px] font-bold text-[#713751]">MJ</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title.split("by ")[1] || "MamaJewels creator"}</p><p className="text-[11px] text-[#918a94]">{item.source}</p></div>
            <MoreHorizontal className="size-4" />
          </div>
                {isVideo ? (
            <video
              src={item.image}
              controls
              playsInline
              preload="metadata"
              className="aspect-square w-full shrink-0 bg-black object-contain"
              aria-label={item.title}
            />
          ) : (
            <CarouselMediaViewer
              images={item.images?.length ? item.images : item.image ? [item.image] : []}
              title={item.title}
              className="w-full shrink-0"
            />
          )}
    <div className="flex flex-col p-3">
            <div className="flex items-center gap-4"><Heart className="size-5" /><MessageCircle className="size-5" /><Send className="size-5" /></div>
            <p className="mt-3 h-10 overflow-hidden text-sm leading-5 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"><span className="font-semibold">creator</span> {item.caption}</p>
            <p className="mt-2 text-xs font-medium text-[#716a75]">Market: {marketName}</p>
            {(item.driveFileIds?.length ? item.driveFileIds : item.driveFileId ? [item.driveFileId] : []).length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{(item.driveFileIds?.length ? item.driveFileIds : item.driveFileId ? [item.driveFileId] : []).map((fileId, index) => <a key={fileId} href={`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#703650] hover:underline"><HardDrive className="size-3.5" />{item.mediaType?.toLowerCase() === "carousel" ? `Image ${index + 1}` : "Open Drive file"}</a>)}</div> : null}
            <p className="mt-2 text-[11px] text-[#9b949d]">DISCOVERED {item.capturedLabel.toUpperCase()}</p>
            <Badge className={`${statusClass(item.status)} mt-3 border-0 font-medium`}>{item.status}</Badge>
            <Button onClick={() => onOpen(item)} variant="outline" className="mt-4 w-full rounded-xl">Review and edit<ArrowRight className="size-4" /></Button>
          </div>
        </article>;
      })}
    </div>
  </>;
}

export function FailuresView({ items = [], onRetry }: { items?: any[]; onRetry?: () => void | Promise<void> }) {
  const failures = items.map((failure) => ({
    id: `ERR-${failure.id}`,
    title: failure.message || "Workflow failure",
    workflow: failure.workflow_name || "Unknown workflow",
    attempts: failure.repeat_count || 1,
    time: failure.occurred_at
      ? new Date(failure.occurred_at).toLocaleString()
      : "Unknown time",
    severity:
      failure.status === "resolved"
        ? "Fixed"
        : failure.status === "retry_requested"
          ? "Retry requested"
          : "Manual review",
  }));

  return (
    <>
      <PageTitle
        title="Failures"
        description="Only the items that need attention, with safe retry actions."
      />

      <div className="mt-7 grid gap-4">
        {failures.length === 0 ? (
          <Card className="rounded-2xl border-[#e8e4ea] shadow-none">
            <CardContent className="p-6 text-sm text-[#7b747e]">
              No workflow failures recorded.
            </CardContent>
          </Card>
        ) : (
          failures.map((failure) => (
            <Card
              key={failure.id}
              className="rounded-2xl border-[#e8e4ea] shadow-none"
            >
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    failure.severity === "Fixed"
                      ? "bg-[#e8f7ee] text-[#257048]"
                      : "bg-[#fdebec] text-[#a33442]"
                  }`}
                >
                  {failure.severity === "Fixed" ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <AlertTriangle className="size-5" />
                  )}
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{failure.title}</p>
                    <Badge variant="outline">{failure.id}</Badge>
                  </div>

                  <p className="mt-1 text-sm text-[#7b747e]">
                    {failure.workflow} · {failure.attempts} attempts ·{" "}
                    {failure.time}
                  </p>
                </div>

                <Badge
                  className={`${statusClass(failure.severity)} border-0`}
                >
                  {failure.severity}
                </Badge>

                {failure.severity === "Manual review" ? (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/failures/retry", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            id: failure.id.replace("ERR-", ""),
                          }),
                        });

                        const data = (await response.json()) as { error?: string };
                        if (!response.ok) throw new Error(data.error || "Retry failed");

                        toast.success(`${failure.id} retry accepted by n8n`);
                        if (onRetry) await onRetry();
                      } catch (error) {
                        console.error("Retry error:", error);
                        toast.error(error instanceof Error ? error.message : "Retry failed");
                      }
                    }}
                  >
                    <Play className="size-3.5" />
                    Retry
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

export function AnalyticsView() {
  const [analytics, setAnalytics] = useState<{
    published: number;
    publishedPeriod: number;
    waitingApproval: number;
    internationalWaiting: number;
    newUgc: number;
    approvedUgc: number;
    failureResolutionRate: number | null;
    publishedByMarket: { market: string; published: number }[];
  } | null>(null);

  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetch(`/api/analytics?days=${period}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load analytics");
        return response.json();
      })
      .then((data) => setAnalytics(data as {
        published: number;
        publishedPeriod: number;
        waitingApproval: number;
        internationalWaiting: number;
        newUgc: number;
        approvedUgc: number;
        failureResolutionRate: number | null;
        publishedByMarket: { market: string; published: number }[];
      }))
      .catch((error) => console.error("Analytics error:", error));
  }, [period]);

  const publicationData = analytics?.publishedByMarket || [];

  return (
    <>
      <PageTitle
        title="Analytics"
        description="The key numbers for publishing, approvals and UGC—without unnecessary detail."
        action={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Published"
          value={String(analytics?.publishedPeriod ?? 0)}
          note={`Last ${period} days`}
          icon={CheckCircle2}
        />

        <MetricCard
          label="Waiting for approval"
          value={String(analytics?.waitingApproval ?? 0)}
          note={`${analytics?.internationalWaiting ?? 0} need localization`}
          icon={FileClock}
        />

        <MetricCard
          label="New UGC"
          value={String(analytics?.newUgc ?? 0)}
          note={`${analytics?.approvedUgc ?? 0} permissions approved`}
          icon={FolderHeart}
        />

        <MetricCard
          label="Failure resolution"
          value={analytics?.failureResolutionRate == null ? "—" : `${analytics.failureResolutionRate}%`}
          note={`Resolved failures in last ${period} days`}
          icon={TrendingUp}
          dark
        />
      </div>

      <Card className="mt-5 rounded-2xl border-[#e8e4ea] shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Published by market</CardTitle>
          <CardDescription>
            Completed posts in the selected period
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ChartContainer
            config={{
              published: {
                label: "Published",
                color: "#7e3f5d",
              },
            }}
            className="h-[300px] w-full aspect-auto"
          >
            <BarChart
              data={publicationData}
              margin={{ left: 0, right: 8, top: 12, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="market"
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="published"
                fill="var(--color-published)"
                radius={[7, 7, 0, 0]}
              />
            </BarChart>
          </ChartContainer>

          <div className="grid content-center gap-3">
            {publicationData.map((row) => (
              <div
                key={row.market}
                className="flex items-center rounded-xl bg-[#faf9fb] p-4"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-[#f1e6eb] text-xs font-semibold text-[#703650]">
                  {row.market}
                </span>

                <span className="ml-3 flex-1 text-sm text-[#756e78]">
                  Published posts
                </span>

                <span className="text-lg font-semibold">
                  {row.published}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

type UserRecord = {
  id: number | string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  setupExpiresAt: string | null;
};

const baseRoleOptions = [
  { value: "Administrator", label: "Administrator" },
  { value: "Editor and approver", label: "Editor & approver" },
  { value: "Reviewer", label: "Reviewer" },
  { value: "Viewer", label: "Viewer" },
];

export function TeamView({ isOwner }: { isOwner: boolean }) {
  const roleOptions = isOwner
    ? [{ value: "Owner", label: "Owner" }, ...baseRoleOptions]
    : baseRoleOptions;
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Reviewer");
  const [setupUrl, setSetupUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/team/users", { cache: "no-store" });
      const data = (await response.json()) as { users?: UserRecord[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load users");
      setUsers(data.users || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const createUser = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = (await response.json()) as { user?: UserRecord; setupUrl?: string; error?: string };
      if (!response.ok || !data.user || !data.setupUrl) throw new Error(data.error || "Unable to create user");
      setUsers((current) => [...current, data.user!]);
      setSetupUrl(data.setupUrl);
      setName("");
      setEmail("");
      setOpen(false);
      setLinkOpen(true);
      toast.success("Account created. Share the setup link securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create user");
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user: UserRecord, update: { role?: string; isActive?: boolean }) => {
    try {
      const response = await fetch("/api/team/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, ...update }),
      });
      const data = (await response.json()) as { user?: UserRecord; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error || "Unable to update user");
      setUsers((current) => current.map((entry) => entry.id === user.id ? data.user! : entry));
      toast.success("Team access updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user");
      await loadUsers();
    }
  };

  const regenerateLink = async (user: UserRecord) => {
    try {
      const response = await fetch("/api/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = (await response.json()) as { setupUrl?: string; error?: string };
      if (!response.ok || !data.setupUrl) throw new Error(data.error || "Unable to create setup link");
      setSetupUrl(data.setupUrl);
      setLinkOpen(true);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create setup link");
    }
  };

  const copySetupUrl = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      toast.success("Setup link copied");
    } catch {
      toast.error("Could not copy link. Select and copy it manually.");
    }
  };

  return <>
    <PageTitle title="Team and access" description="Add users and control who can review, approve and manage the system." action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="h-11 rounded-xl"><UserPlus className="size-4" />Add user</Button></DialogTrigger><DialogContent className="rounded-xl"><DialogHeader><DialogTitle>Add a team member</DialogTitle><DialogDescription>They will set their own password using a one-time link that expires after 24 hours.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-2"><Label htmlFor="new-user-name">Name</Label><Input id="new-user-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></div><div className="grid gap-2"><Label htmlFor="new-user-email">Email address</Label><Input id="new-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></div><div className="grid gap-2"><Label>Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{isOwner ? <SelectItem value="Owner">Owner</SelectItem> : null}{roleOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving} onClick={() => void createUser()}>{saving ? "Creating…" : "Create setup link"}</Button></DialogFooter></DialogContent></Dialog>} />
    <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent className="rounded-xl"><DialogHeader><DialogTitle>Share the setup link</DialogTitle><DialogDescription>This link works once and expires in 24 hours. Share it directly with the invited team member.</DialogDescription></DialogHeader><div className="flex gap-2"><Input readOnly value={setupUrl} aria-label="One-time setup link" /><Button size="icon" variant="outline" title="Copy setup link" aria-label="Copy setup link" onClick={() => void copySetupUrl()}><Copy className="size-4" /></Button></div><DialogFooter><Button onClick={() => setLinkOpen(false)}>Done</Button></DialogFooter></DialogContent></Dialog>
    <Card className="mt-7 overflow-hidden rounded-xl border-[#e8e4ea] shadow-none"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#faf9fb]"><TableHead className="pl-5">User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last active</TableHead><TableHead className="w-44" /></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="p-8 text-center text-sm text-[#77707a]">Loading team…</TableCell></TableRow> : users.map((user) => {
      const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      const status = user.isActive ? "Active" : user.setupExpiresAt ? "Setup pending" : "Inactive";
      return <TableRow key={user.id}><TableCell className="pl-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#f2dce6] text-xs font-semibold text-[#713751]">{initials}</span><div><p className="font-medium">{user.name}</p><p className="mt-0.5 text-xs text-[#918a94]">{user.email}</p></div></div></TableCell><TableCell><Select disabled={user.role === "Owner"} value={user.role} onValueChange={(value) => void updateUser(user, { role: value })}><SelectTrigger className="w-[180px] border-0 bg-transparent shadow-none"><SelectValue /></SelectTrigger><SelectContent>{user.role === "Owner" ? <SelectItem value="Owner">Owner</SelectItem> : null}{roleOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Badge className={`${status === "Active" ? "bg-[#e8f7ee] text-[#257048]" : status === "Inactive" ? "bg-[#fdebec] text-[#a33442]" : "bg-[#fff2d5] text-[#87600f]"} border-0`}>{status}</Badge></TableCell><TableCell className="text-sm text-[#77707a]">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}</TableCell><TableCell className="text-right">{!user.isActive ? <Button size="sm" variant="outline" onClick={() => void regenerateLink(user)}>New setup link</Button> : user.role !== "Owner" ? <Button size="sm" variant="ghost" onClick={() => void updateUser(user, { isActive: false })}>Deactivate</Button> : <span className="pr-3 text-xs text-[#918a94]">Protected</span>}</TableCell></TableRow>;
    })}</TableBody></Table></div></Card>
  </>;
}

const integrationCards = [
  { title: "Meta / Instagram", note: "Account status and token expiry", detail: "Status from integrations", icon: Camera },
  { title: "Self-hosted n8n", note: "Self-hosted workflow endpoint", detail: "Health check available", icon: Server },
  { title: "Apify", note: "Content discovery and UGC monitoring", detail: "Used for Instagram data collection", icon: Cloud },
  { title: "OpenAI", note: "OpenAI production key", detail: "Localization and monthly spend", icon: Bot },
];

export function SettingsView() {
  const [pinterestConfig, setPinterestConfig] = useState({
    id: undefined as number | undefined,
    appId: "",
    appSecret: "",
    accessToken: "",
    boardId: "",
    status: "active",
    expiry: null as string | null,
  });
  const [tiktokConfig, setTiktokConfig] = useState({
    id: undefined as number | undefined,
    clientKey: "",
    clientSecret: "",
    accessToken: "",
    status: "active",
    expiry: null as string | null,
  });
  const saveProvider = async (provider: "pinterest" | "tiktok", config: any) => {
    try {
      const payload = provider === "pinterest"
        ? {
            id: config.id,
            provider: "pinterest",
            configuration: {
              app_id: config.appId,
              ...(config.appSecret ? { app_secret: config.appSecret } : {}),
              ...(config.accessToken ? { access_token: config.accessToken } : {}),
              board_id: config.boardId,
            },
          }
        : {
            id: config.id,
            provider: "tiktok",
            configuration: {
              client_key: config.clientKey,
              ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
              ...(config.accessToken ? { access_token: config.accessToken } : {}),
            },
          };
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`${provider.toUpperCase()} credentials saved`);
      } else {
        toast.error(`Failed to save ${provider} credentials`);
      }
    } catch (err) {
      toast.error("Error saving credentials");
    }
  };

  const [apifyToken, setApifyToken] = useState("");

  const [editingApifyToken, setEditingApifyToken] = useState(false);
  const [apifyConfigured, setApifyConfigured] = useState(false);
  const [savingApify, setSavingApify] = useState(false);

  const [apifyHealth, setApifyHealth] = useState<{
    healthy: boolean;
    monthlyUsageUsd: number | null;
    monthlyLimitUsd: number | null;
    monthlyRemainingUsd: number | null;
    usageCycleStart: string | null;
    usageCycleEnd: string | null;
  } | null>(null);
  const [checkingApify, setCheckingApify] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [editingOpenaiApiKey, setEditingOpenaiApiKey] = useState(false);
  const [openaiKeyConfigured, setOpenaiKeyConfigured] = useState(false);
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [savingOpenai, setSavingOpenai] = useState(false);
  const [openaiHealth, setOpenaiHealth] = useState<{
    healthy: boolean;
    lastHealthCheck: string | null;
    monthlySpendUsd: number | null;
    spendPeriodStart: string | null;
    spendError: string | null;
  } | null>(null);
  const [checkingOpenai, setCheckingOpenai] = useState(false);
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
const [n8nApiKey, setN8nApiKey] = useState("");
const [editingN8nBaseUrl, setEditingN8nBaseUrl] = useState(false);
const [editingN8nApiKey, setEditingN8nApiKey] = useState(false);
const [n8nConfigured, setN8nConfigured] = useState(false);
const [n8nApiKeyConfigured, setN8nApiKeyConfigured] = useState(false);
const [savingN8n, setSavingN8n] = useState(false);
const [checkingN8n, setCheckingN8n] = useState(false);
const [n8nHealth, setN8nHealth] = useState<{
  healthy: boolean;
  workflowCount: number;
  lastHealthCheck: string | null;
} | null>(null);
  const [metaAccounts, setMetaAccounts] = useState<{
    id: number;
    market: string;
    name: string;
    status: string;
    username: string | null;
    tokenExpiry: string | null;
    daysUntilExpiry: number | null;
    lastHealthCheck: string | null;
    pageId: string;
    hasAccessToken: boolean;
    accessTokenDraft: string;
  }[]>([]);
  const [refreshingMeta, setRefreshingMeta] = useState(false);

  const [metaConfigurations, setMetaConfigurations] = useState<
    Record<
      number,
      {
        configured: boolean;
        appId: string;
        igUserId: string;
        editingAppId: boolean;
        editingUserId: boolean;
        editingToken: boolean;
        editingAppSecret: boolean;
        token: string;
        appSecret: string;
        health: {
          healthy: boolean;
          username: string | null;
          expiresAt: string | null;
          dataAccessExpiresAt: string | null;
          lastHealthCheck: string | null;
        } | null;
        saving: boolean;
        checking: boolean;
      }
    >
  >({});
  const [metaEditPopup, setMetaEditPopup] = useState<{
    accountId: number;
    field: "appId" | "igUserId" | "token" | "appSecret";
  } | null>(null);
  useEffect(() => {
    const loadApify = async () => {
      try {
        const response = await fetch("/api/integrations", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          integrations?: Array<{
            id: number;
            provider: string;
            market: string | null;
            account_name: string | null;
            configuration?: {
              has_api_token?: boolean;
              has_api_key?: boolean;
              has_app_id?: boolean;
              has_app_secret?: boolean;
              has_access_token?: boolean;
              has_ig_user_id?: boolean;
              app_id?: string;
              ig_user_id?: string;
              base_url?: string;
              token_expiry?: string | null;
              days_until_expiry?: number | string | null;
              token_health?: string | null;
              page_id?: string;
            };
            status?: string | null;
            token_expires_at?: string | null;
            last_health_check?: string | null;
            health_details?: { username?: string | null; token_valid?: boolean | null };
          }>;
        };

        const apify = data.integrations?.find(
          (integration) => integration.provider === "apify"
        );

        if (apify) {
          setApifyConfigured(
            Boolean(apify.configuration?.has_api_token)
          );
        }

        const openai = data.integrations?.find(
          (integration) => integration.provider === "openai"
        );

        if (openai) {
          const configured = Boolean(openai.configuration?.has_api_key);
          setOpenaiConfigured(configured);
          setOpenaiKeyConfigured(configured);
        }

        const n8n = data.integrations?.find(
          (integration) => integration.provider === "n8n"
        );

        if (n8n) {
          const configured = Boolean(
            n8n.configuration?.base_url &&
            n8n.configuration?.has_api_key
          );

          setN8nConfigured(configured);
          setN8nApiKeyConfigured(
            Boolean(n8n.configuration?.has_api_key)
          );

          setN8nBaseUrl(
            typeof n8n.configuration?.base_url === "string"
              ? n8n.configuration.base_url
              : ""
          );
        }

        const metaConfigs = (data.integrations || []).filter(
          (integration) => integration.provider === "meta"
        );
        setMetaAccounts(metaConfigs.map((integration) => {
          const expiry = integration.configuration?.token_expiry || integration.token_expires_at || null;
          const configuredDays = integration.configuration?.days_until_expiry;
          const parsedDays = configuredDays === null || configuredDays === undefined || configuredDays === ""
            ? expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000) : null
            : Number(configuredDays);
          return {
            id: integration.id,
            market: integration.market || "—",
            name: integration.account_name || `MamaJewels ${integration.market || "account"}`,
            status: integration.status || integration.configuration?.token_health || "unknown",
            username: integration.health_details?.username || null,
            tokenExpiry: expiry,
            daysUntilExpiry: parsedDays !== null && Number.isFinite(parsedDays) ? parsedDays : null,
            lastHealthCheck: integration.last_health_check || null,
            pageId: integration.configuration?.page_id || "",
            hasAccessToken: Boolean(integration.configuration?.has_access_token),
            accessTokenDraft: "",
          };
        }));

        const metaState: Record<number, any> = {};

        for (const meta of metaConfigs) {
          metaState[meta.id] = {
            configured: Boolean(
              meta.configuration?.has_app_id &&
              meta.configuration?.has_access_token &&
              meta.configuration?.has_app_secret &&
              meta.configuration?.has_ig_user_id
            ),
            appId:
              typeof meta.configuration?.app_id === "string"
                ? meta.configuration.app_id
                : "",
            igUserId:
              typeof meta.configuration?.ig_user_id === "string"
                ? meta.configuration.ig_user_id
                : "",
            editingAppId: false,
            editingUserId: false,
            editingToken: false,
            editingAppSecret: false,
            token: "",
            appSecret: "",
            health: null,
            saving: false,
            checking: false,
          };
        }

        setMetaConfigurations(metaState);
      } catch {
        // Keep the existing Settings UI available if the API is unavailable.
      }
    };

    loadApify();
  }, []);
  const saveApify = async () => {
    if (!apifyToken.trim() && !apifyConfigured) {
      toast.error("Enter the Apify API token");
      return;
    }

    setSavingApify(true);

    try {
      const configuration: Record<string, string> = {};

      if (apifyToken.trim()) {
        configuration.api_token = apifyToken.trim();
      }

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          configuration,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error || "Unable to save Apify settings");
        return;
      }

      setApifyConfigured(true);
      setApifyToken("");
      toast.success("Apify settings saved");
    } catch {
      toast.error("Unable to save Apify settings");
    } finally {
      setSavingApify(false);
    }
  };
    const saveOpenai = async () => {
    if (!openaiApiKey.trim() && !openaiConfigured) {
      toast.error("Enter the OpenAI API key");
      return;
    }

    setSavingOpenai(true);

    try {
      const configuration: Record<string, string> = {};

      if (openaiApiKey.trim()) {
        configuration.api_key = openaiApiKey.trim();
      }

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 2,
          configuration,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error || "Unable to save OpenAI settings");
        return;
      }

      setOpenaiConfigured(true);
      setOpenaiApiKey("");
      toast.success("OpenAI settings saved");
    } catch {
      toast.error("Unable to save OpenAI settings");
    } finally {
      setSavingOpenai(false);
    }
  };
  const saveN8n = async () => {
    if (!n8nBaseUrl.trim()) {
      toast.error("Enter the n8n base URL");
      return false;
    }

    if (!n8nApiKey.trim() && !n8nApiKeyConfigured) {
      toast.error("Enter the n8n API key");
      return false;
    }

    setSavingN8n(true);

    try {
      const configuration: Record<string, string> = {
        base_url: n8nBaseUrl.trim(),
      };

      if (n8nApiKey.trim()) {
        configuration.api_key = n8nApiKey.trim();
      }

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 7,
          configuration,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error || "Unable to save n8n settings");
        return false;
      }

      setN8nConfigured(true);
      setN8nApiKeyConfigured(true);
      setN8nApiKey("");
      setEditingN8nApiKey(false);

      toast.success("n8n settings saved");
      return true;
    } catch {
      toast.error("Unable to save n8n settings");
      return false;
    } finally {
      setSavingN8n(false);
    }
  };
  const checkN8n = async () => {
    setCheckingN8n(true);

    try {
      const response = await fetch("/api/integrations/n8n/health", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        healthy?: boolean;
        workflowCount?: number;
        error?: string;
      };

      setN8nHealth({
        healthy: Boolean(data.healthy),
        workflowCount: data.workflowCount ?? 0,
        lastHealthCheck: new Date().toISOString(),
      });

      if (!response.ok || !data.healthy) {
        toast.error(data.error || "n8n connection is not working");
        return;
      }

      toast.success("n8n connection is working");
    } catch {
      setN8nHealth({
        healthy: false,
        workflowCount: 0,
        lastHealthCheck: new Date().toISOString(),
      });

      toast.error("Unable to check n8n");
    } finally {
      setCheckingN8n(false);
    }
  };
  const checkOpenai = async () => {
    setCheckingOpenai(true);

    try {
      const response = await fetch("/api/integrations/openai/health", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        healthy?: boolean;
        error?: string;
        monthlySpendUsd?: number | null;
        spendPeriodStart?: string | null;
        spendError?: string | null;
      };

      if (!response.ok || !data.healthy) {
        setOpenaiHealth({
          healthy: false,
          lastHealthCheck: new Date().toISOString(),
          monthlySpendUsd: null,
          spendPeriodStart: null,
          spendError: data.spendError || null,
        });

        toast.error(data.error || "OpenAI API key is not working");
        return;
      }

      setOpenaiHealth({
        healthy: true,
        lastHealthCheck: new Date().toISOString(),
        monthlySpendUsd: data.monthlySpendUsd ?? null,
        spendPeriodStart: data.spendPeriodStart ?? null,
        spendError: data.spendError ?? null,
      });

      toast.success(data.spendError ? "OpenAI connected; spend is unavailable" : "OpenAI status and spend refreshed");
    } catch {
      setOpenaiHealth({
        healthy: false,
        lastHealthCheck: new Date().toISOString(),
        monthlySpendUsd: null,
        spendPeriodStart: null,
        spendError: "Unable to retrieve OpenAI costs",
      });

      toast.error("Unable to check OpenAI");
    } finally {
      setCheckingOpenai(false);
    }
  };
  const checkMeta = async (id: number) => {
    const integrationsResponse = await fetch("/api/integrations", {
      cache: "no-store",
    });

    const integrationsData = (await integrationsResponse.json()) as {
      integrations?: Array<{
        id: number;
        configuration?: {
          has_app_id?: boolean;
          has_app_secret?: boolean;
          has_access_token?: boolean;
          has_ig_user_id?: boolean;
          app_id?: string;
          ig_user_id?: string;
        };
      }>;
    };

    const savedIntegration = integrationsData.integrations?.find(
      (integration) => integration.id === id
    );

    const savedConfiguration = savedIntegration?.configuration;

    setMetaConfigurations((current) => ({
      ...current,
      [id]: {
        ...current[id],
        configured: Boolean(
          savedConfiguration?.has_app_id &&
          savedConfiguration?.has_app_secret &&
          savedConfiguration?.has_access_token &&
          savedConfiguration?.has_ig_user_id
        ),
        appId:
          typeof savedConfiguration?.app_id === "string"
            ? savedConfiguration.app_id
            : current[id].appId,
        igUserId:
          typeof savedConfiguration?.ig_user_id === "string"
            ? savedConfiguration.ig_user_id
            : current[id].igUserId,
        token: "",
        appSecret: "",
        editingToken: false,
        editingAppSecret: false,
      },
    }));

    try {
      const response = await fetch(
        "/api/integrations",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = (await response.json()) as {
        healthy?: boolean;
        error?: string;
        username?: string | null;
        expiresAt?: string | null;
        dataAccessExpiresAt?: string | null;
      };

      setMetaConfigurations((current) => ({
        ...current,
        [id]: {
          ...(current[id] || {
            configured: false,
            appId: "",
            igUserId: "",
            editingAppId: false,
            editingUserId: false,
            editingToken: false,
            editingAppSecret: false,
            token: "",
            appSecret: "",
            health: null,
            saving: false,
          }),
          checking: false,
          health: {
            healthy: Boolean(data.healthy),
            username: data.username || null,
            expiresAt: data.expiresAt || null,
            dataAccessExpiresAt: data.dataAccessExpiresAt || null,
            lastHealthCheck: new Date().toISOString(),
          },
        },
      }));

      if (!response.ok || !data.healthy) {
        
        return;
      }

      
    } catch {
      setMetaConfigurations((current) => ({
        ...current,
        [id]: {
          ...(current[id] || {
            configured: false,
            appId: "",
            igUserId: "",
            editingAppId: false,
            editingUserId: false,
            editingToken: false,
            editingAppSecret: false,
            token: "",
            appSecret: "",
            health: null,
            saving: false,
          }),
          checking: false,
          health: {
            healthy: false,
            username: null,
            expiresAt: null,
            dataAccessExpiresAt: null,
            lastHealthCheck: new Date().toISOString(),
          },
        },
      }));

      
    }
  };
  const saveMeta = async (id: number) => {
    const account = metaConfigurations[id];

    if (!account) return false;

    const configuration: Record<string, string> = {};

    if (account.appId.trim()) {
      configuration.app_id = account.appId.trim();
    }

    if (account.igUserId.trim()) {
      configuration.ig_user_id = account.igUserId.trim();
    }

    if (account.token.trim()) {
      configuration.access_token = account.token.trim();
    }

    if (account.appSecret.trim()) {
      configuration.app_secret = account.appSecret.trim();
    }

    if (Object.keys(configuration).length === 0) {
      toast.error("Enter a value");
      return false;
    }

    setMetaConfigurations((current) => ({
      ...current,
      [id]: {
        ...current[id],
        saving: true,
      },
    }));

    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          configuration,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error || "Unable to save Meta settings");
        return false;
      }

      setMetaConfigurations((current) => ({
        ...current,
        [id]: {
          ...current[id],
          configured: Boolean(
            current[id].appId.trim() &&
            current[id].igUserId.trim()
          ),
          token: "",
          appSecret: "",
          editingToken: false,
          editingAppSecret: false,
        },
      }));

      toast.success("Meta settings saved");
      return true;
    } catch {
      toast.error("Unable to save Meta settings");
      return false;
    } finally {
      setMetaConfigurations((current) => ({
        ...current,
        [id]: {
          ...current[id],
          saving: false,
        },
      }));
    }
  };
  const checkApify = async () => {
      setCheckingApify(true);

      try {
        const response = await fetch("/api/integrations/apify/health", {
          cache: "no-store",
        });

        const data = (await response.json()) as {
          error?: string;
          healthy?: boolean;
          monthlyUsageUsd?: number | null;
          monthlyLimitUsd?: number | null;
          monthlyRemainingUsd?: number | null;
          usageCycleStart?: string | null;
          usageCycleEnd?: string | null;
        };

        if (!response.ok) {
          toast.error(data.error || "Unable to check Apify");
          return;
        }

        setApifyHealth({
          healthy: Boolean(data.healthy),
          monthlyUsageUsd: data.monthlyUsageUsd ?? null,
          monthlyLimitUsd: data.monthlyLimitUsd ?? null,
          monthlyRemainingUsd: data.monthlyRemainingUsd ?? null,
          usageCycleStart: data.usageCycleStart ?? null,
          usageCycleEnd: data.usageCycleEnd ?? null,
        });

        setApifyConfigured(true);
        toast.success("Apify connection checked");
      } catch {
        toast.error("Unable to check Apify");
      } finally {
        setCheckingApify(false);
      }
    };
  const saveMetaCredentials = async (account: (typeof metaAccounts)[number]) => {
    if (!account.pageId.trim()) {
      toast.error("Enter the Meta Page ID");
      return;
    }
    if (!account.accessTokenDraft.trim() && !account.hasAccessToken) {
      toast.error("Enter the Meta access token");
      return;
    }

    try {
      const configuration: Record<string, string> = { page_id: account.pageId.trim() };
      if (account.accessTokenDraft.trim()) configuration.access_token = account.accessTokenDraft.trim();
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, configuration }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to save Meta settings");
      setMetaAccounts((current) => current.map((entry) => entry.id === account.id
        ? { ...entry, pageId: account.pageId.trim(), hasAccessToken: true, accessTokenDraft: "" }
        : entry));
      toast.success(`${account.market.toUpperCase()} Meta settings saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save Meta settings");
    }
  };

  const refreshMeta = async () => {
    setRefreshingMeta(true);
    try {
      const triggerResponse = await fetch("/api/integrations/meta/refresh", { method: "POST" });
      const triggerData = await triggerResponse.json() as { error?: string };
      if (!triggerResponse.ok) throw new Error(triggerData.error || "Meta health refresh failed");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await fetch("/api/integrations", { cache: "no-store" });
      const data = await response.json() as { integrations?: Array<{ id: number; provider: string; market: string | null; account_name: string | null; status?: string | null; token_expires_at?: string | null; last_health_check?: string | null; health_details?: { username?: string | null }; configuration?: { token_expiry?: string | null; days_until_expiry?: number | string | null; token_health?: string | null; page_id?: string; has_access_token?: boolean } }>; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to reload Meta status");

      setMetaAccounts((data.integrations || []).filter((entry) => entry.provider === "meta").map((entry) => {
        const expiry = entry.configuration?.token_expiry || entry.token_expires_at || null;
        const rawDays = entry.configuration?.days_until_expiry;
        const days = rawDays === null || rawDays === undefined || rawDays === "" ? expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000) : null : Number(rawDays);
        return { id: entry.id, market: entry.market || "—", name: entry.account_name || `MamaJewels ${entry.market || "account"}`, status: entry.status || entry.configuration?.token_health || "unknown", username: entry.health_details?.username || null, tokenExpiry: expiry, daysUntilExpiry: days !== null && Number.isFinite(days) ? days : null, lastHealthCheck: entry.last_health_check || null, pageId: entry.configuration?.page_id || "", hasAccessToken: Boolean(entry.configuration?.has_access_token), accessTokenDraft: "" };
      }));
      toast.success("Meta status refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Meta health refresh failed");
    } finally {
      setRefreshingMeta(false);
    }
  };
  return <>
    <style>{`.integration-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(250px,1fr);max-width:64rem}.integration-meta-grid>div{height:100%;display:flex;flex-direction:column}.integration-meta-grid>div>div:last-child{flex:1}.integration-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(250px,1fr);max-width:64rem}.integration-card-grid>div{height:100%;min-height:250px!important;display:flex;flex-direction:column;border-radius:.5rem!important}.integration-card-grid>div>div{height:100%;padding:.75rem!important}.integration-card-grid input{height:2rem;border-radius:.375rem}.integration-card-grid button{min-height:2rem;border-radius:.375rem}.integration-card-grid [class*=rounded-xl]{border-radius:.5rem}.integration-card-grid [class*=p-3]{padding:.5rem}.integration-card-grid [class*=p-4]{padding:.75rem}.integration-card-grid [class*=size-12]{width:2.25rem;height:2.25rem;border-radius:.5rem}.integration-meta-grid>div>div:last-child{padding:.75rem!important}.integration-meta-grid [class*=size-11]{width:2.25rem;height:2.25rem}.integration-meta-grid input{height:1.875rem}.integration-meta-grid label{gap:.25rem}.integration-meta-grid button{min-height:1.875rem;height:1.875rem}.integration-meta-grid .text-sm{line-height:1.25rem}@media(max-width:767px){.integration-meta-grid,.integration-card-grid{grid-template-columns:1fr}}`}</style>
    <Tabs defaultValue="platforms" className="mt-7">
      <TabsList variant="line" className="w-full justify-start border-b border-[#e5e1e7] pb-0">
        <TabsTrigger value="platforms" className="px-4 pb-3">Social Platforms</TabsTrigger>
        <TabsTrigger value="api-keys" className="px-4 pb-3">API Keys</TabsTrigger>
      </TabsList>

      <TabsContent value="platforms" className="pt-5">
        <div className="mb-4">
          <p className="text-sm text-[#827a84]">
            Manage Pinterest and TikTok credentials and verify token health.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pinterest Card */}
          <Card className="flex flex-col rounded-xl border border-[#e8e4ea] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#271830]">Pinterest</h3>
                <p className="text-xs text-[#827a84]">Direct publishing & board posting</p>
              </div>
              <Badge className="border-0 bg-emerald-100 text-emerald-800 text-xs">
                Active
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-[#554d58]">App ID</Label>
                <Input
                  value={pinterestConfig.appId}
                  onChange={(e) => setPinterestConfig({ ...pinterestConfig, appId: e.target.value })}
                  placeholder="Enter Pinterest App ID"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#554d58]">App Secret</Label>
                <Input
                  type="password"
                  value={pinterestConfig.appSecret}
                  onChange={(e) => setPinterestConfig({ ...pinterestConfig, appSecret: e.target.value })}
                  placeholder="Enter App Secret"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#554d58]">Access Token</Label>
                <Input
                  type="password"
                  value={pinterestConfig.accessToken}
                  onChange={(e) => setPinterestConfig({ ...pinterestConfig, accessToken: e.target.value })}
                  placeholder="Enter Access Token"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#554d58]">Default Board ID</Label>
                <Input
                  value={pinterestConfig.boardId}
                  onChange={(e) => setPinterestConfig({ ...pinterestConfig, boardId: e.target.value })}
                  placeholder="Enter Board ID"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={() => void saveProvider("pinterest", pinterestConfig)}
                className="mt-2 w-full bg-[#e60023] text-white hover:bg-[#ad081b]"
              >
                Save Pinterest Credentials
              </Button>
            </div>
          </Card>

          {/* TikTok Card */}
          <Card className="flex flex-col rounded-xl border border-[#e8e4ea] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#271830]">TikTok</h3>
                <p className="text-xs text-[#827a84]">Direct video publishing</p>
              </div>
              <Badge className="border-0 bg-emerald-100 text-emerald-800 text-xs">
                Active
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-[#554d58]">Client Key</Label>
                <Input
                  value={tiktokConfig.clientKey}
                  onChange={(e) => setTiktokConfig({ ...tiktokConfig, clientKey: e.target.value })}
                  placeholder="Enter TikTok Client Key"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#554d58]">Client Secret</Label>
                <Input
                  type="password"
                  value={tiktokConfig.clientSecret}
                  onChange={(e) => setTiktokConfig({ ...tiktokConfig, clientSecret: e.target.value })}
                  placeholder="Enter Client Secret"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-[#554d58]">Access Token</Label>
                <Input
                  type="password"
                  value={tiktokConfig.accessToken}
                  onChange={(e) => setTiktokConfig({ ...tiktokConfig, accessToken: e.target.value })}
                  placeholder="Enter Access Token"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={() => void saveProvider("tiktok", tiktokConfig)}
                className="mt-2 w-full bg-black text-white hover:bg-neutral-800"
              >
                Save TikTok Credentials
              </Button>
            </div>
          </Card>
        </div>
      </TabsContent>

     <TabsContent value="meta" className="pt-5">
        <div className="mb-4 flex items-center justify-between"><p className="text-sm text-[#827a84]">{metaAccounts.length} connected account{metaAccounts.length === 1 ? "" : "s"}</p><Button variant="outline" size="sm" onClick={() => void refreshMeta()} disabled={refreshingMeta}>{refreshingMeta ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Refresh Meta</Button></div>
        <div className="integration-meta-grid grid items-stretch gap-4">
          {metaAccounts.map((account) => {
            const market = account.market.toUpperCase();
            const marketStyle = market === "DE" ? "bg-[#e9edf0] text-[#35424b]" : market === "FR" ? "bg-[#eaf1ff] text-[#315f9f]" : market === "US" ? "bg-[#fdebec] text-[#a33442]" : "bg-[#fff2d5] text-[#87600f]";
            const expiringSoon = account.daysUntilExpiry !== null && account.daysUntilExpiry < 14;
            return <Card key={account.id} className="flex h-full min-h-[290px] flex-col overflow-hidden rounded-lg border-[#e2dee4] bg-white shadow-none">
              <div className={`h-1.5 shrink-0 ${market === "DE" ? "bg-[#34424d]" : market === "FR" ? "bg-[#5275bd]" : market === "US" ? "bg-[#bf5860]" : "bg-[#d18a39]"}`} />
              <CardContent className="flex flex-1 flex-col p-3">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${marketStyle}`}>{market}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#332c35]">{account.name}</p><p className="mt-0.5 truncate text-xs text-[#827a84]">{account.username ? `@${account.username}` : "Instagram account"}</p></div>
                  <Camera className="size-4 shrink-0 text-[#817883]" />
                </div>
                <div className={`mt-2 rounded-lg border p-2 ${expiringSoon ? "border-[#f0cdd0] bg-[#fff6f6]" : "border-[#d9eadf] bg-[#f5faf6]"}`}>
                  <div className="flex items-center justify-between gap-2"><Badge className={`border-0 px-2 py-0.5 text-[10px] ${account.status.toLowerCase() === "healthy" ? "bg-[#dff3e7] text-[#286b46]" : "bg-[#fde1e3] text-[#9b3340]"}`}>{account.status}</Badge><span className="text-[10px] text-[#827a84]">{account.tokenExpiry ? new Date(account.tokenExpiry).toLocaleDateString() : "Expiry date unavailable"}</span></div>
                  <p className={`mt-2 text-sm font-semibold ${expiringSoon ? "text-[#9b3340]" : "text-[#286b46]"}`}>{account.daysUntilExpiry === null ? "Expiry unavailable" : account.daysUntilExpiry < 0 ? `Expired ${Math.abs(account.daysUntilExpiry)} days ago` : `Expires in ${account.daysUntilExpiry} days`}</p>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Label className="grid min-w-0 gap-1 text-[11px] text-[#716a75]">Meta Page ID<Input value={account.pageId} onChange={(event) => setMetaAccounts((current) => current.map((entry) => entry.id === account.id ? { ...entry, pageId: event.target.value } : entry))} placeholder="Enter Page ID" className="h-8 min-w-0 rounded-md text-xs" /></Label>
                  <Label className="grid min-w-0 gap-1 text-[11px] text-[#716a75]">Access token<Input type="password" value={account.accessTokenDraft} onChange={(event) => setMetaAccounts((current) => current.map((entry) => entry.id === account.id ? { ...entry, accessTokenDraft: event.target.value } : entry))} placeholder={account.hasAccessToken ? "Saved; enter to replace" : "Enter token"} className="h-8 min-w-0 rounded-md text-xs" /></Label>
                </div>
                <Button size="sm" variant="outline" className="mt-auto h-8 w-full rounded-md" onClick={() => void saveMetaCredentials(account)}>Save account credentials</Button>
              </CardContent>
            </Card>;
          })}
          {!metaAccounts.length ? <p className="text-sm text-[#827a84]">No Meta accounts found in integrations.</p> : null}
        </div>
      </TabsContent>
      <TabsContent value="api-keys" className="pt-5"><div className="integration-card-grid grid items-stretch gap-4">{integrationCards.filter((integration) => integration.title !== "Meta / Instagram").map((integration) => { const Icon = integration.icon; if (integration.title === "OpenAI")
  return (
    <Card
      key={integration.title}
      className="flex h-full min-h-[250px] flex-col rounded-lg border-[#e2dee4] bg-white shadow-none"
    >
      <CardContent className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]">
            <Icon className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">OpenAI</p>

              <Badge
                className={`border-0 ${
                  openaiConfigured
                    ? "bg-[#e8f7ee] text-[#257048]"
                    : "bg-[#fff2d5] text-[#87600f]"
                }`}
              >
                {openaiConfigured ? "Configured" : "Not configured"}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-[#827a84]">
              OpenAI production key
            </p>

            <p className="mt-1 text-xs font-medium text-[#98788a]">
              German, French and US English
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={checkOpenai}
            disabled={checkingOpenai}
          >
            {checkingOpenai ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>

        {openaiHealth && (
          <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#faf8fa] p-2">
              <p className="text-xs text-[#827a84]">Connection status</p>
              <p className={`mt-1 font-semibold ${openaiHealth.healthy ? "text-[#257048]" : "text-[#a33442]"}`}>
                {openaiHealth.healthy ? "Connected" : "Error"}
              </p>
            </div>
                <div className="rounded-lg bg-[#faf8fa] p-2">
              <p className="text-xs text-[#827a84]">Spend this month</p>
              <p className="mt-1 font-semibold text-[#332c35]">
                {openaiHealth.monthlySpendUsd === null ? openaiHealth.spendError || "Not refreshed" : `$${openaiHealth.monthlySpendUsd.toFixed(2)} USD`}
              </p>
              {openaiHealth.spendPeriodStart && openaiHealth.monthlySpendUsd !== null ? (
                <p className="mt-1 text-xs text-[#827a84]">Since {new Date(openaiHealth.spendPeriodStart).toLocaleDateString()}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-auto grid gap-3 pt-5">
          {openaiConfigured && !editingOpenaiApiKey ? (
            <Button
              variant="outline"
              onClick={() => {
                setOpenaiApiKey("");
                setEditingOpenaiApiKey(true);
              }}
              className="h-9 rounded-lg"
            >
              Change API key
            </Button>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="openai-api-key">API key</Label>

                <Input
                  id="openai-api-key"
                  type="password"
                  value={openaiApiKey}
                  onChange={(event) =>
                    setOpenaiApiKey(event.target.value)
                  }
                  placeholder="Enter new OpenAI API key"
                  className="h-9 rounded-lg"
                />
              </div>

              <Button
                onClick={async () => {
                  await saveOpenai();
                  setEditingOpenaiApiKey(false);
                }}
                disabled={savingOpenai}
                className="h-9 rounded-lg"
              >
                {savingOpenai ? "Saving..." : "Save API key"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
  if (integration.title === "Meta / Instagram") {
    return (
      <Card key={integration.title} className="rounded-2xl border-[#e8e4ea] shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]"><Icon className="size-5" /></span>
              <div>
                <p className="font-semibold">Meta / Instagram</p>
                <p className="mt-1 text-sm text-[#827a84]">{metaAccounts.length} connected account{metaAccounts.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" title="Refresh Meta status" aria-label="Refresh Meta status" disabled={refreshingMeta} onClick={() => void refreshMeta()}><RefreshCw className={refreshingMeta ? "size-4 animate-spin" : "size-4"} /></Button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {metaAccounts.map((account) => {
              const normalizedStatus = account.status.toLowerCase();
              const healthy = ["healthy", "active", "connected"].includes(normalizedStatus);
              const expiryClass = account.daysUntilExpiry === null ? "text-[#827a84]" : account.daysUntilExpiry > 14 ? "text-[#257048]" : "text-[#a33442]";
              return <div key={account.id} className="rounded-xl border border-[#e8e4ea] bg-[#fcfbfc] p-3">
                <div><p className="text-sm font-semibold">{account.market.toUpperCase()}</p><p className="mt-0.5 text-xs text-[#827a84]">{account.name}</p>{account.username ? <p className="mt-1 text-xs text-[#554d58]">@{account.username}</p> : null}</div>
                <div className={`mt-3 rounded-md px-2 py-1 text-xs font-medium ${healthy ? "bg-[#e8f7ee] text-[#257048]" : normalizedStatus === "error" || normalizedStatus === "expired" ? "bg-[#fdebec] text-[#a33442]" : "bg-[#f1eff2] text-[#716a75]"}`}>{account.status}</div>
                <div className={`mt-2 text-xs font-medium ${expiryClass}`}>{account.daysUntilExpiry === null ? "Expiry unavailable" : account.daysUntilExpiry < 0 ? `Expired ${Math.abs(account.daysUntilExpiry)} days ago` : `Expires in ${account.daysUntilExpiry} days`}</div>
                {account.tokenExpiry ? <p className="mt-1 text-[11px] text-[#827a84]">{new Date(account.tokenExpiry).toLocaleDateString()}</p> : null}
                {account.lastHealthCheck ? <p className="mt-2 text-[10px] text-[#918a94]">Checked {new Date(account.lastHealthCheck).toLocaleString()}</p> : null}
                <div className="mt-4 grid gap-2 border-t border-[#e8e4ea] pt-3">
                  <Label className="grid gap-1 text-xs text-[#716a75]">Meta Page ID<Input value={account.pageId} onChange={(event) => setMetaAccounts((current) => current.map((entry) => entry.id === account.id ? { ...entry, pageId: event.target.value } : entry))} placeholder="Enter Page ID" className="h-9" /></Label>
                  <Label className="grid gap-1 text-xs text-[#716a75]">Access token<Input type="password" value={account.accessTokenDraft} onChange={(event) => setMetaAccounts((current) => current.map((entry) => entry.id === account.id ? { ...entry, accessTokenDraft: event.target.value } : entry))} placeholder={account.hasAccessToken ? "Saved; enter to replace" : "Enter access token"} className="h-9" /></Label>
                  <Button size="sm" variant="outline" onClick={() => void saveMetaCredentials(account)}>Save Meta credentials</Button>
                </div>
              </div>;
            })}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (integration.title === "Meta / Instagram") {
  return (
    <Card
      key={integration.title}
      className="rounded-2xl border-[#e8e4ea] shadow-none"
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]">
              <Icon className="size-5" />
            </span>

            <div>
              <p className="font-semibold">Meta / Instagram</p>
              <p className="mt-1 text-sm text-[#827a84]">
                {metaAccounts.length} professional account{metaAccounts.length === 1 ? "" : "s"} configured
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await Promise.all(
                metaAccounts.map((account) => checkMeta(account.id))
              );

              const results = metaAccounts.map((account) => {
                const meta = metaConfigurations[account.id];

                return `${account.market}: ${
                  meta?.health?.healthy ? "Active" : "Inactive"
                }`;
              });

              toast.info(results.join(" • "));
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {metaAccounts.map((account) => {
            const meta = metaConfigurations[account.id];

            return (
              <div
                key={account.id}
                className="rounded-xl border border-[#e8e4ea] bg-[#fcfbfc] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{account.market}</p>
                    <p className="mt-0.5 text-xs text-[#827a84]">
                      {account.name}
                    </p>
                  </div>

                  <span
                    className={`size-2 rounded-full ${
                      meta?.health?.healthy
                        ? "bg-[#257048]"
                        : meta?.configured
                          ? "bg-[#d69e2e]"
                          : "bg-[#c8c3c8]"
                    }`}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827a84]">App ID</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setMetaEditPopup({
                          accountId: account.id,
                          field: "appId",
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827a84]">
                      Instagram User ID
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setMetaEditPopup({
                          accountId: account.id,
                          field: "igUserId",
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827a84]">
                      Access Token
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setMetaConfigurations((current) => ({
                          ...current,
                          [account.id]: {
                            ...current[account.id],
                            token: "",
                          },
                        }));

                        setMetaEditPopup({
                          accountId: account.id,
                          field: "token",
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827a84]">
                      App Secret
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setMetaConfigurations((current) => ({
                          ...current,
                          [account.id]: {
                            ...current[account.id],
                            appSecret: "",
                          },
                        }));

                        setMetaEditPopup({
                          accountId: account.id,
                          field: "appSecret",
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-[#f7f5f7] p-2">
                  <p
                    className={`text-xs font-medium ${
                      meta?.health
                        ? meta.health.healthy
                          ? "text-[#257048]"
                          : "text-[#9d3340]"
                        : meta?.configured
                          ? "text-[#87600f]"
                          : "text-[#827a84]"
                    }`}
                  >
                    {meta?.health
                      ? meta.health.healthy
                        ? "Active"
                        : "Inactive"
                      : meta?.configured
                        ? "Not checked"
                        : "Not configured"}
                  </p>

                  {meta?.health?.expiresAt && (
                    <p className="mt-1 text-[10px] text-[#827a84]">
                      Expires{" "}
                      {new Date(meta.health.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
  if (integration.title === "Self-hosted n8n") {
    return (
      <Card
        key={integration.title}
      className="flex h-full min-h-[250px] flex-col rounded-lg border-[#e2dee4] bg-white shadow-none"
      >
        <CardContent className="flex flex-1 flex-col p-3">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]">
              <Icon className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Self-hosted n8n</p>

                <Badge
                  className={`border-0 ${
                    n8nHealth?.healthy
                      ? "bg-[#e8f7ee] text-[#257048]"
                      : n8nConfigured
                        ? "bg-[#fff2d5] text-[#87600f]"
                        : "bg-[#fff2d5] text-[#87600f]"
                  }`}
                >
                  {n8nHealth?.healthy
                    ? "Healthy"
                    : n8nConfigured
                      ? "Configured"
                      : "Not configured"}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-[#827a84]">
                Self-hosted n8n automation platform
              </p>

              {n8nHealth && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#faf8fa] p-3">
                    <p className="text-xs text-[#827a84]">
                      Workflows
                    </p>
                    <p className="mt-1 font-semibold">
                      {n8nHealth.workflowCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#faf8fa] p-3">
                    <p className="text-xs text-[#827a84]">
                      Last check
                    </p>
                    <p className="mt-1 font-semibold">
                      {new Date(
                        n8nHealth.lastHealthCheck || ""
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={checkN8n}
              disabled={checkingN8n}
            >
              {checkingN8n ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>

          <div className="mt-auto grid gap-3 pt-5">
            <div className="rounded-xl bg-[#faf8fa] p-3">
              <p className="text-xs text-[#827a84]">n8n URL</p>
              <p className="mt-1 text-sm font-medium">
                https://n8n.mamajewels.nl
              </p>
            </div>

            {n8nApiKeyConfigured && !editingN8nApiKey ? (
              <Button
                variant="outline"
                onClick={() => {
                  setN8nApiKey("");
                  setEditingN8nApiKey(true);
                }}
                className="h-9 rounded-lg"
              >
                Change API key
              </Button>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="n8n-api-key">
                    API key
                  </Label>

                  <Input
                    id="n8n-api-key"
                    type="password"
                    value={n8nApiKey}
                    onChange={(event) =>
                      setN8nApiKey(event.target.value)
                    }
                    placeholder="Enter new n8n API key"
                    className="h-9 rounded-lg"
                  />
                </div>

                <Button
                  onClick={async () => {
                    const saved = await saveN8n();

                    if (saved) {
                      setEditingN8nApiKey(false);
                    }
                  }}
                  disabled={savingN8n}
                  className="h-9 rounded-lg"
                >
                  {savingN8n ? "Saving..." : "Save API key"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (integration.title !== "Apify") return <Card key={integration.title} className="rounded-2xl border-[#e8e4ea] shadow-none"><CardContent className="flex items-center gap-4 p-5"><span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{integration.title}</p><Badge className="border-0 bg-[#e8f7ee] text-[#257048]">Healthy</Badge></div><p className="mt-1 truncate text-sm text-[#827a84]">{integration.note}</p><p className="mt-1 text-xs font-medium text-[#98788a]">{integration.detail}</p></div><Button variant="ghost" size="icon" onClick={() => toast.success(`${integration.title} connection checked`)}><RefreshCw className="size-4" /></Button></CardContent></Card>; return <Card key={integration.title} className="rounded-2xl border-[#e8e4ea] shadow-none"><CardContent className="p-5"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[#f6edf2] text-[#7c3b5a]"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold">Apify</p><Badge className={`border-0 ${apifyHealth?.healthy ? "bg-[#e8f7ee] text-[#257048]" : apifyConfigured ? "bg-[#fff2d5] text-[#87600f]" : "bg-[#fff2d5] text-[#87600f]"}`}>{apifyHealth?.healthy ? "Healthy" : apifyConfigured ? "Configured" : "Not configured"}</Badge></div><p className="mt-1 text-sm text-[#827a84]">Content discovery and UGC monitoring</p>{apifyHealth && <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-[#faf8fa] p-3"><p className="text-xs text-[#827a84]">Used</p><p className="mt-1 font-semibold">${apifyHealth.monthlyUsageUsd?.toFixed(2) ?? "—"}</p></div><div className="rounded-xl bg-[#faf8fa] p-3"><p className="text-xs text-[#827a84]">Monthly limit</p><p className="mt-1 font-semibold">${apifyHealth.monthlyLimitUsd?.toFixed(2) ?? "—"}</p></div><div className="rounded-xl bg-[#faf8fa] p-3"><p className="text-xs text-[#827a84]">Remaining</p><p className="mt-1 font-semibold">${apifyHealth.monthlyRemainingUsd?.toFixed(2) ?? "—"}</p></div></div>}{apifyHealth?.usageCycleStart && apifyHealth?.usageCycleEnd && <p className="mt-3 text-xs text-[#827a84]">Billing cycle: {new Date(apifyHealth.usageCycleStart).toLocaleDateString()} – {new Date(apifyHealth.usageCycleEnd).toLocaleDateString()}</p>}</div><Button variant="ghost" size="icon" onClick={checkApify} disabled={checkingApify}>{checkingApify ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}</Button></div><div className="mt-5 grid gap-4">
  {apifyConfigured && !editingApifyToken ? (
    <Button
      variant="outline"
      onClick={() => {
        setApifyToken("");
        setEditingApifyToken(true);
      }}
      className="h-11 rounded-xl"
    >
      Change API token
    </Button>
  ) : (
    <>
      <div className="grid gap-2">
        <Label htmlFor="apify-token">API token</Label>

        <Input
          id="apify-token"
          type="password"
          value={apifyToken}
          onChange={(event) => setApifyToken(event.target.value)}
          placeholder="Enter new Apify API token"
          className="h-11 rounded-xl"
        />
      </div>

      <Button
        onClick={async () => {
          await saveApify();
          setEditingApifyToken(false);
        }}
        disabled={savingApify}
        className="h-11 rounded-xl"
      >
        {savingApify ? "Saving..." : "Save API token"}
      </Button>
    </>
  )}
</div></CardContent></Card>; })}</div>

{metaEditPopup && (
  <Dialog
    open={true}
    onOpenChange={(open) => {
      if (!open) setMetaEditPopup(null);
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Edit{" "}
          {metaEditPopup.field === "appId"
            ? "App ID"
            : metaEditPopup.field === "igUserId"
              ? "Instagram User ID"
              : metaEditPopup.field === "token"
                ? "Access Token"
                : "App Secret"}
        </DialogTitle>

        <DialogDescription>
          Enter the new value for this Meta account.
        </DialogDescription>
      </DialogHeader>

      <Input
        type={
          metaEditPopup.field === "token" ||
          metaEditPopup.field === "appSecret"
            ? "password"
            : "text"
        }
        value={
          metaEditPopup.field === "appId"
            ? metaConfigurations[metaEditPopup.accountId]?.appId || ""
            : metaEditPopup.field === "igUserId"
              ? metaConfigurations[metaEditPopup.accountId]?.igUserId || ""
              : metaEditPopup.field === "token"
                ? metaConfigurations[metaEditPopup.accountId]?.token || ""
                : metaConfigurations[metaEditPopup.accountId]?.appSecret || ""
        }
        onChange={(event) => {
          const value = event.target.value;

          setMetaConfigurations((current) => ({
            ...current,
            [metaEditPopup.accountId]: {
              ...current[metaEditPopup.accountId],
              ...(metaEditPopup.field === "appId"
                ? { appId: value }
                : metaEditPopup.field === "igUserId"
                  ? { igUserId: value }
                  : metaEditPopup.field === "token"
                    ? { token: value }
                    : { appSecret: value }),
            },
          }));
        }}
        placeholder="Enter value"
      />

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setMetaEditPopup(null)}
        >
          Cancel
        </Button>

        <Button
          onClick={async () => {
            const saved = await saveMeta(metaEditPopup.accountId);

            if (saved) {
              setMetaEditPopup(null);
            }
          }}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}

</TabsContent>     </Tabs>
  </>;
}
