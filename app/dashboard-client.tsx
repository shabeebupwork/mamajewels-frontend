"use client";

import {
  AlertTriangle, Bookmark, CheckCircle2, ChevronDown, Eye, EyeOff,
  FolderHeart, Gauge, HardDrive, Heart, Images, KeyRound, LogOut, Copy,
  MessageCircle, Send, Settings, ShieldAlert, ShieldCheck, Sparkles,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import {
  CarouselMediaViewer, ContentView, FailuresView, OverviewView, PageKey, PublishedView,
  ReviewItem, SettingsView, TeamView, UgcView,
} from "./dashboard-views";

const workspaceNavigation: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "content", label: "Content", icon: Images },
  { key: "ugc_content", label: "UGC content", icon: Sparkles },
  { key: "ugc", label: "UGC library", icon: FolderHeart },
  { key: "published", label: "Published", icon: CheckCircle2 },
];


const manageNavigation: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "team", label: "Team & access", icon: Users },
  { key: "settings", label: "Integrations", icon: Settings },
];

const pageLabels: Partial<Record<PageKey, string>> = {
  overview: "Overview",
  content: "Content",
  ugc_content: "UGC content",
  published: "Published",
  ugc: "UGC library",
  team: "Team & access",
  settings: "Integrations",
};


type DashboardUser = { id: number | string; name: string; email: string; role: string };

function LoginScreen({ onSignIn }: { onSignIn: (user: DashboardUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }

    if (resetMode) {
      toast.info("Password reset is not available yet.");
      return;
    }

    if (!password) {
      toast.error("Enter your password");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: DashboardUser;
      };

      if (!response.ok) {
        toast.error(data.error || "Invalid email or password");
        return;
      }

      toast.success(`Welcome, ${data.user?.name ?? "back"}`);
      if (data.user) onSignIn(data.user);
    } catch {
      toast.error("Unable to sign in. Please try again.");
    }
  };
  return <main className="grid min-h-screen bg-[#f6f4f7] lg:grid-cols-[.86fr_1.14fr]">
    <style>{`@media(min-width:1024px){main>section:first-of-type{display:flex;flex-direction:column;align-items:center;justify-content:center}main>section:first-of-type>*:not(:nth-child(3)){display:none!important}}@media(max-width:1023px){main>section:nth-of-type(2)>div>div:first-child>div>p:last-child{font-size:0}main>section:nth-of-type(2)>div>div:first-child>div:after{content:"Media management";display:block;font-size:.75rem;color:#8b838e}}`}</style>
    <style>{`main>section:first-of-type>div:nth-child(3)>div>p:last-child{font-size:0}main>section:first-of-type>div:nth-child(3)>div>p:last-child:after{content:"Media management";font-size:.75rem;color:rgba(255,255,255,.5)}main>section:nth-of-type(2)>div>div:first-child>div:first-child:after{content:none!important}main>section:nth-of-type(2)>div>div:first-child>div:last-child:after{content:"Media management";display:block;font-size:.75rem;color:#8b838e}`}</style>
    <section className="relative hidden overflow-hidden bg-[#21152a] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16"><div className="absolute -right-20 -top-24 size-80 rounded-full bg-[#8e4468]/25 blur-3xl" /><div className="absolute -bottom-16 -left-24 size-96 rounded-full bg-[#f7a8c4]/10 blur-3xl" /><div className="relative flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#f7a8c4] text-[#21152a]"><Sparkles className="size-5" /></div><div><p className="text-lg font-semibold">MamaJewels</p><p className="text-xs text-white/50">Content operations</p></div></div><div className="relative max-w-lg"><Badge className="border border-white/15 bg-white/10 text-white">One content system · four markets</Badge><h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">Create once in NL.<br />Operate everywhere.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/60">Archive, localize, review and publish MamaJewels content while keeping UGC and safety decisions under human control.</p><div className="mt-10 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-2xl font-semibold">4</p><p className="mt-1 text-xs text-white/45">Instagram markets</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-2xl font-semibold">15</p><p className="mt-1 text-xs text-white/45">Automations</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-2xl font-semibold">99.2%</p><p className="mt-1 text-xs text-white/45">Workflow success</p></div></div></div><p className="relative text-xs text-white/35">Private workspace · activity is recorded in the audit log</p></section>
    <section className="flex min-h-screen items-center justify-center p-5 sm:p-10"><div className="w-full max-w-[430px]"><div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-2xl bg-[#21152a] text-[#f7a8c4]"><Sparkles className="size-5" /></div><div><p className="font-semibold">MamaJewels</p><p className="text-xs text-[#8b838e]">Content operations</p></div></div><div className="rounded-[26px] border border-[#e6e1e8] bg-white p-6 shadow-[0_24px_70px_rgba(39,24,48,.08)] sm:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[#f6e7ee] text-[#783b59]"><KeyRound className="size-5" /></div><h2 className="mt-6 text-2xl font-semibold tracking-tight">{resetMode ? "Reset your password" : "Welcome back"}</h2><p className="mt-2 text-sm leading-6 text-[#7d7580]">{resetMode ? "Enter your email and we’ll prepare a secure reset link." : "Sign in to manage content, approvals and publishing."}</p><form onSubmit={submit} className="mt-7 space-y-4"><div className="grid gap-2"><Label htmlFor="login-email">Email address</Label><Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl" /></div>{!resetMode ? <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="login-password">Password</Label><button type="button" onClick={() => setResetMode(true)} className="text-xs font-medium text-[#733651] hover:underline">Forgot password?</button></div><div className="relative"><Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl pr-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8590]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div> : null}<Button type="submit" className="h-11 w-full rounded-xl bg-[#632b4a] text-white hover:bg-[#4e203a]">{resetMode ? "Prepare reset link" : "Sign in"}</Button>{resetMode ? <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>Back to sign in</Button> : null}</form></div><p className="mt-5 text-center text-xs text-[#918993]">Access is limited to approved MamaJewels team members.</p></div></section>
  </main>;
}

function AppSidebar({ activePage, setActivePage }: { activePage: PageKey; setActivePage: (page: PageKey) => void; humanApproval?: boolean; counts?: { content?: number; ugc_content?: number; ugc?: number } }) {
  const [role, setRole] = useState("Viewer");
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as { user?: DashboardUser };
        setRole(data.user?.role || "Viewer");
      })
      .catch(() => {});
  }, []);
  const isAdmin = role === "Owner" || role === "Administrator";
  const readablePages = isAdmin
    ? null
    : role === "Viewer"
      ? ["overview", "content", "published", "ugc"]
      : ["overview", "content", "published", "ugc"];
  const renderItem = (item: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }) => {
    const Icon = item.icon;
    return <SidebarMenuItem key={item.key}><SidebarMenuButton onClick={() => setActivePage(item.key)} isActive={activePage === item.key} tooltip={item.label} className="h-10 rounded-xl px-3 text-white/68 hover:bg-white/10 hover:text-white data-[active=true]:bg-white data-[active=true]:text-[#21152a] data-[active=true]:shadow-sm"><Icon className="size-[18px]" /><span>{item.label}</span></SidebarMenuButton>{item.count ? <SidebarMenuBadge className={activePage === item.key ? "text-[#21152a]" : "text-white/65"}>{item.count}</SidebarMenuBadge> : null}</SidebarMenuItem>;
  };
  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 bg-[#21152a] text-white [&_[data-slot=sidebar-inner]]:bg-[#21152a]">
      <SidebarHeader className="h-20 justify-center border-b border-white/10 px-5">
        <button onClick={() => setActivePage("overview")} className="flex items-center gap-3 text-left">
          <div className="grid size-10 place-items-center rounded-2xl bg-[#f7a8c4] text-[#21152a]"><Sparkles className="size-5" /></div>
          <div><p className="text-[17px] font-semibold tracking-tight">MamaJewels</p><p className="text-xs text-white/50">Media management</p></div>
        </button>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[.13em] text-white/35">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
{workspaceNavigation.filter((item) => isAdmin || (readablePages?.includes(item.key) ?? false)).map(renderItem)}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin ? <SidebarGroup className="mt-4 p-0">
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[.13em] text-white/35">Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{manageNavigation.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> : null}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function Header({ activePage, onSignOut: onSignedOut }: { activePage: PageKey; setActivePage: (page: PageKey) => void; onSignOut: () => void }) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const onSignOut = () => onSignedOut();
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { user?: DashboardUser };
        setUser(data.user || null);
      })
      .catch(() => {});
  }, []);
  const initials = (user?.name || "User").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center gap-2 sm:gap-3 border-b border-[#e8e5eb] bg-white/95 px-3 sm:px-7 backdrop-blur-xl"><SidebarTrigger className="size-9 sm:size-10 rounded-xl border border-[#e5e1e7]" /><div className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#8c8490]"><span className="hidden sm:inline">Workspace</span><span className="hidden sm:inline">/</span><span className="truncate font-medium text-[#3f3942]">{pageLabels[activePage]}</span></div><div className="ml-auto" /><DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-1.5 sm:gap-2 rounded-xl p-1 sm:p-1.5 sm:pr-2 hover:bg-[#f5f2f6]"><span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#f4d1df] text-xs sm:text-sm font-semibold text-[#6d2448]">{initials}</span><span className="hidden text-left xl:block"><span className="block text-sm font-medium">{user?.name || "Dashboard user"}</span><span className="block text-xs text-[#8e8793]">{user?.role || "Signed in"}</span></span><ChevronDown className="hidden size-4 text-[#8e8793] sm:block" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40 rounded-xl"><DropdownMenuItem variant="destructive" onClick={onSignOut}><LogOut />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></header>;
}

const marketInfo = {
  de: { tab: "Germany", account: "mamajewels.de" },
  fr: { tab: "France", account: "mamajewels.fr" },
  us: { tab: "USA", account: "mamajewels.usa" },
};

function InstagramPost({ item, account, caption, editable = true }: { item: ReviewItem; account: string; caption: string; editable?: boolean }) {
  const isVideo = item.mediaType?.toLowerCase() === "video" || item.mediaType?.toLowerCase() === "reel";
  const mediaList = item.images?.length ? item.images : item.image ? [item.image] : [];

  return (
    <div className="mx-auto max-w-[470px] overflow-hidden rounded-xl border border-[#dedade] bg-white shadow-sm">
      <div className="flex items-center gap-3 p-3">
        <span className="grid size-9 place-items-center rounded-full bg-[#f2dce6] text-[10px] font-bold text-[#713751]">
          MJ
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{account}</p>
          <p className="text-[11px] text-[#918a94]">MamaJewels</p>
        </div>
        <span className="text-lg">•••</span>
      </div>

      {isVideo ? (
        <video
          src={item.image}
          controls
          playsInline
          preload="metadata"
          className="aspect-square w-full bg-black object-contain"
          aria-label={item.title}
        />
      ) : (
        <CarouselMediaViewer images={mediaList} title={item.title} />
      )}

      <div className="p-3">
        <div className="flex items-center gap-4">
          <Heart className="size-6" />
          <MessageCircle className="size-6" />
          <Send className="size-6" />
          <Bookmark className="ml-auto size-6" />
        </div>
        <p className="mt-3 text-sm font-semibold">1,248 likes</p>
        {editable ? (
          <div className="mt-2">
            <Label className="mb-2 block text-xs text-[#8f8792]">Edit caption</Label>
            <Textarea
              defaultValue={caption}
              className="min-h-24 resize-none rounded-xl border-[#e6e2e7] text-sm leading-5"
            />
          </div>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-5">
            <span className="font-semibold">{account}</span> {caption}
          </p>
        )}
        <p className="mt-2 text-[10px] uppercase text-[#a39ca5]">{item.capturedLabel}</p>
      </div>
    </div>
  );
}


function DriveArchiveLinks({ item }: { item: ReviewItem }) {
  const fileIds = item.driveFileIds?.length ? item.driveFileIds : item.driveFileId ? [item.driveFileId] : [];
  if (!fileIds.length) return <Button variant="outline" size="sm" disabled>File unavailable</Button>;
  return <div className="flex flex-wrap justify-end gap-2">{fileIds.map((fileId, index) => <Button key={fileId} asChild variant="outline" size="sm"><a href={`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`} target="_blank" rel="noreferrer"><HardDrive className="size-4" />{item.mediaType?.toLowerCase() === "carousel" ? `Image ${index + 1}` : "Open file"}</a></Button>)}</div>;
}

function ContentReviewSheet({
  item,
  readOnly = false,
  onClose,
  onApproved,
  canReview,
}: {
  item: ReviewItem | null;
  readOnly?: boolean;
  onClose: () => void;
  onApproved: () => void;
  canReview: boolean;
}) {
  const [editedCaptions, setEditedCaptions] = useState<
    Record<string, string>
  >({});
  const [ugcCaption, setUgcCaption] = useState("");
  const [pinterestMarkets, setPinterestMarkets] = useState<string[]>([]);
  const [tiktokMarkets, setTiktokMarkets] = useState<string[]>([]);
  const [republishMarkets, setRepublishMarkets] = useState<string[]>([]);
  const [republishWarningOpen, setRepublishWarningOpen] = useState(false);
  const [pinterestCarouselDialogOpen, setPinterestCarouselDialogOpen] = useState(false);
  const [tiktokDialogOpen, setTiktokDialogOpen] = useState(false);
  const [tiktokPrivacyOptions, setTiktokPrivacyOptions] = useState<string[]>([]);
  const [tiktokPrivacyLevel, setTiktokPrivacyLevel] = useState("");
  const [tiktokConsent, setTiktokConsent] = useState(false);
  const [tiktokCreatorName, setTiktokCreatorName] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    setUgcCaption(item?.caption || "");
    setEditedCaptions({});
    const available = item?.localizations
      ?.map((entry) => entry.market.toUpperCase())
      .filter((m) => ["DE", "FR", "US"].includes(m)) || [];
    // If no localizations exist yet (like in raw UGC content), default all 3 markets on
    const initialMarkets = available.length > 0 ? available : ["DE", "FR", "US"];
    setPinterestMarkets(initialMarkets);
    setTiktokMarkets(initialMarkets);
  }, [item?.id, item?.caption]);


  if (!item) return null;

  const isUgc = item.kind === "ugc";
  const canEdit = canReview && !readOnly;
  const approvalMarkets = ["DE", "FR", "US"];
  const localizations = item.localizations || [];
  const publishApprovals = async (markets: string[]) => {
    setApproving(true);
    try {
      const response = await fetch("/api/content/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, markets }),
      });
      const data = (await response.json()) as { error?: string; markets?: string[] };
      if (!response.ok) throw new Error(data.error || "Approval failed");
      toast.success(`${(data.markets || markets).join(", ")} approved`);
      setRepublishWarningOpen(false);
      onClose();
      onApproved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve markets");
    } finally {
      setApproving(false);
    }
  };
  const handlePublishPlatform = async (
    platform: "pinterest" | "tiktok",
    markets: string[],
    options: { pinterestCarouselMode?: "separate" | "first"; tiktokPrivacyLevel?: string; tiktokConsent?: boolean } = {},
  ) => {
    if (markets.length === 0) {
      toast.error(`Select at least one market for ${platform === "pinterest" ? "Pinterest" : "TikTok"}`);
      return;
    }
    setApproving(true);
    try {
      for (const market of markets) {
        const key = market.toLowerCase();
        const caption = editedCaptions[key];
        if (caption === undefined) continue;
        const saveResponse = await fetch("/api/content/localization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: item.id, market, caption }),
        });
        const saveResult = await saveResponse.json().catch(() => ({})) as { error?: string };
        if (!saveResponse.ok) throw new Error(saveResult.error || `Failed to save ${market} caption`);
      }
      const response = await fetch("/api/content/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, markets, platform, ...options }),
      });
      const data = await response.json() as { error?: string; message?: string; results?: { status?: string }[]; skipped?: boolean };
      if (!response.ok) throw new Error(data.error || `Failed to publish to ${platform}`);
      if (data.skipped) {
        toast.message(data.message || "Pinterest publishing cancelled");
      } else if (data.results?.some((result) => result.status === "failed")) {
        toast.warning(data.message || `Some ${platform} posts failed`);
      } else {
        toast.success(data.message || (platform === "tiktok" ? "TikTok accepted the posts; status will update after processing." : "Pinterest Pins published."));
      }
      setPinterestCarouselDialogOpen(false);
      setTiktokDialogOpen(false);
      onClose();
      onApproved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to publish to ${platform}`);
    } finally {
      setApproving(false);
    }
  };

  const preparePinterestPublish = () => {
    if (item.type === "Carousel" && (item.images?.length || item.driveFileIds?.length || 0) > 1) {
      setPinterestCarouselDialogOpen(true);
      return;
    }
    void handlePublishPlatform("pinterest", pinterestMarkets, { pinterestCarouselMode: "first" });
  };

  const prepareTikTokPublish = async () => {
    setApproving(true);
    try {
      const response = await fetch("/api/integrations/tiktok/creator-info", { method: "POST" });
      const data = await response.json() as { error?: string; creator?: { username?: string | null; nickname?: string | null; privacyOptions?: string[] } };
      if (!response.ok || !data.creator?.privacyOptions?.length) throw new Error(data.error || "Unable to load TikTok account publishing options.");
      setTiktokPrivacyOptions(data.creator.privacyOptions);
      setTiktokPrivacyLevel(data.creator.privacyOptions.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : data.creator.privacyOptions[0]);
      setTiktokCreatorName(data.creator.nickname || data.creator.username || "TikTok account");
      setTiktokConsent(false);
      setTiktokDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load TikTok account publishing options.");
    } finally {
      setApproving(false);
    }
  };

  const handleMarkSelected = async () => {
    const combinedMarkets = [...new Set([...pinterestMarkets, ...tiktokMarkets])];
    if (combinedMarkets.length === 0) {
      toast.error("Please select at least one market");
      return;
    }
    setApproving(true);
    try {
      const response = await fetch("/api/content/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, markets: combinedMarkets, status: "selected" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to mark as selected");
      toast.success(`Marked as Selected (${combinedMarkets.join(", ")})`);
      onClose();
      onApproved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as selected");
    } finally {
      setApproving(false);
    }
  };


  return (
    <>
    <style>{`div[class*="max-w-[470px]"] > div.p-3 > p.mt-2.text-sm.leading-5{white-space:pre-wrap}`}</style>
    <Sheet
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full max-w-full sm:max-w-[760px] overflow-y-auto p-0">
        <SheetHeader className="border-b border-[#e8e4ea] p-5 pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{item.id}</Badge>

            <Badge
              className={`${
                isUgc
                  ? "bg-[#fff2d5] text-[#79530b]"
                  : "bg-[#eaf1ff] text-[#315f9f]"
              } border-0`}
            >
              {isUgc ? "Manual UGC review" : item.status}
            </Badge>
          </div>

          <SheetTitle className="sr-only">
            {item.title}
          </SheetTitle>

          <SheetDescription className="sr-only">
            {item.source} · {item.type} · captured {item.capturedLabel}
          </SheetDescription>
        </SheetHeader>

        <div className="p-5">
          {isUgc ? (
            <div className="space-y-5">
              <InstagramPost item={item} account={item.title.split("by ")[1] || "creator"} caption={ugcCaption} editable={false} />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canEdit}
                  className="border-[#efc4c8] text-[#9b3340] hover:bg-[#fff4f4]"
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/ugc/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id, status: "rejected" }),
                      });
                      const data = await response.json() as { error?: string };
                      if (!response.ok) throw new Error(data.error || "Failed to reject UGC");
                      toast.success("UGC rejected");
                      onClose();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to reject UGC");
                    }
                  }}
                >
                  Rejected
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={ugcCaption}
                  onChange={(event) => {
                    setUgcCaption(event.target.value);
                  }}
                  disabled={!canEdit}
                  className="min-h-[140px] rounded-xl"
                />
              </div>
            </div>
          ) : null}

          {isUgc ? null : (
            <Tabs defaultValue="de">
              <TabsList className="sticky top-0 z-10 grid w-full grid-cols-3 bg-[#f4f1f4]">
                <TabsTrigger value="de">Germany</TabsTrigger>
                <TabsTrigger value="fr">France</TabsTrigger>
                <TabsTrigger value="us">USA</TabsTrigger>
              </TabsList>

              {(["de", "fr", "us"] as const).map((key) => {
                const market = marketInfo[key];

                const localization = item.localizations?.find(
                  (entry) =>
                    entry.market.toLowerCase() === key
                );

                const caption =
                  editedCaptions[key] ??
                  localization?.caption ??
                  item.caption ??
                  "";

                return (
                  <TabsContent
                    key={key}
                    value={key}
                    className="mt-5 space-y-4"
                  >
                    <InstagramPost
                      item={item}
                      account={market.account}
                      caption={caption}
                      editable={false}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Caption</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#716a75] hover:text-[#17121c]"
                          onClick={() => {
                            if (caption) {
                              navigator.clipboard.writeText(caption);
                              toast.success("Caption copied to clipboard");
                            }
                          }}
                        >
                          <Copy className="mr-1 size-3.5" />
                          Copy
                        </Button>
                      </div>

                      <Textarea

                        value={caption}
                        disabled={!canEdit}
                        onChange={(event) =>
                          setEditedCaptions((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder="Enter localized caption"
                        className="min-h-[140px] rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        [
                          "Language",
                          localization
                            ? "Available"
                            : "Not created",
                        ],
                        ["Dutch text", "None"],
                        ["Dutch speech", "None"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl bg-[#faf9fb] p-3"
                        >
                          <p className="text-xs text-[#8d8590]">
                            {label}
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e9e5ea] p-4">
            <div>
              <p className="text-sm font-semibold">
                Google Drive archive
              </p>

              <p className="mt-1 text-xs text-[#8d8590]">
                Original media, caption and metadata are stored safely.
              </p>
            </div>

              <DriveArchiveLinks item={item} />
          </div>
        </div>

        {!readOnly ? <SheetFooter className="sticky bottom-0 border-t border-[#e8e4ea] bg-white/95 p-5 backdrop-blur">
          {isUgc ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!canReview}
                onClick={async () => {
                  try {
                    const response = await fetch("/api/ugc/update", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: item.id,
                        caption: ugcCaption,
                      }),
                    });

                    const data = await response.json() as { error?: string };
                    if (!response.ok) throw new Error(data.error || "Failed to save UGC changes");

                    toast.success("Caption saved");
                  } catch (error) {
                    console.error("UGC save error:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to save caption");
                  }
                }}
              >
                Save edits
              </Button>

              <Button
                className="flex-1"
                disabled={!canReview}
                onClick={async () => {
                  try {
                    const response = await fetch("/api/ugc/update", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        id: item.id,
                        caption: ugcCaption,
                        status: "generating",
                      }),
                    });

                    const data = await response.json() as { error?: string };
                    if (!response.ok) throw new Error(data.error || "Failed to start content generation");
                    toast.success("Content generation started");
                    onClose();
                  } catch (error) {
                    console.error("UGC generation error:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to start content generation");
                  }
                }}
              >
                Generate content
              </Button>
            </div>
          ) : (
            <div className="grid w-full gap-4">
              {/* Separate Market Selections */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Pinterest Markets */}
                <div className="rounded-xl border border-[#fee2e2] bg-[#fff5f5] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#E60023]">
                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.368-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Pinterest Markets
                    </span>
                    <span className="text-[11px] font-medium text-[#b91c1c]">{pinterestMarkets.length} selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvalMarkets.map((market) => {
                      const checked = pinterestMarkets.includes(market);
                      return (
                        <label
                          key={`pin-${market}`}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            checked
                              ? "border-[#E60023] bg-white text-[#E60023] shadow-sm"
                              : "border-[#fca5a5]/40 bg-white/70 text-[#716a75]"
                          } ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEdit}
                            onChange={(e) =>
                              setPinterestMarkets((prev) =>
                                e.target.checked ? [...new Set([...prev, market])] : prev.filter((m) => m !== market)
                              )
                            }
                            className="size-3.5 accent-[#E60023]"
                          />
                          {market}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* TikTok Markets */}
                <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#111827]">
                      <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.75a8.28 8.28 0 0 0 4.91 1.6V6.9a4.86 4.86 0 0 1-1-.21z" />
                      </svg>
                      TikTok Markets
                    </span>
                    <span className="text-[11px] font-medium text-[#4b5563]">{tiktokMarkets.length} selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvalMarkets.map((market) => {
                      const checked = tiktokMarkets.includes(market);
                      return (
                        <label
                          key={`tt-${market}`}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            checked
                              ? "border-black bg-white text-black shadow-sm"
                              : "border-black/20 bg-white/70 text-[#716a75]"
                          } ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEdit}
                            onChange={(e) =>
                              setTiktokMarkets((prev) =>
                                e.target.checked ? [...new Set([...prev, market])] : prev.filter((m) => m !== market)
                              )
                            }
                            className="size-3.5 accent-[#111827]"
                          />
                          {market}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons with Branded Designs */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {/* Save edits */}
                <Button
                  variant="outline"
                  className="rounded-xl border-[#e5e1e7] text-xs font-medium sm:w-auto"
                  disabled={!canEdit}
                  onClick={async () => {
                    try {
                      const markets = ["de", "fr", "us"] as const;
                      for (const key of markets) {
                        const localization = item.localizations?.find((e) => e.market.toLowerCase() === key);
                        const caption = editedCaptions[key] ?? localization?.caption ?? "";
                        if (!localization || !caption.trim()) continue;
                        const res = await fetch("/api/content/localization", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ contentId: item.id, market: key.toUpperCase(), caption }),
                        });
                        if (!res.ok) throw new Error(`Failed to save ${key.toUpperCase()} caption`);
                      }
                      toast.success("Caption changes saved");
                    } catch (error) {
                      toast.error("Failed to save captions");
                    }
                  }}
                >
                  Save edits
                </Button>

                {/* Mark as Selected */}
                <Button
                  variant="outline"
                  disabled={!canEdit || approving || (pinterestMarkets.length === 0 && tiktokMarkets.length === 0)}
                  onClick={handleMarkSelected}
                  className="rounded-xl border-[#d9cfe0] bg-[#fdfbfe] text-xs font-semibold text-[#632b4a] hover:bg-[#f6eef8] sm:flex-1"
                >
                  <CheckCircle2 className="mr-1.5 size-3.5 text-[#632b4a]" />
                  Mark Selected
                </Button>

                {/* Pinterest Branded Publish Button */}
                <button
                  type="button"
                  disabled={!canEdit || approving || pinterestMarkets.length === 0}
                  onClick={preparePinterestPublish}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#E60023] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#b8001b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.368-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Publish Pinterest ({pinterestMarkets.length})
                </button>

                {/* TikTok Branded Publish Button */}
                <button
                  type="button"
                  disabled={!canEdit || approving || tiktokMarkets.length === 0}
                  onClick={() => void prepareTikTokPublish()}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#010101] bg-[#010101] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1a1a1a] hover:border-[#25f4ee]/50 hover:shadow-[0_0_12px_rgba(37,244,238,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.75a8.28 8.28 0 0 0 4.91 1.6V6.9a4.86 4.86 0 0 1-1-.21z" />
                  </svg>
                  Publish TikTok ({tiktokMarkets.length})
                </button>
              </div>
            </div>

            
          )}
        </SheetFooter> : null}
      </SheetContent>
    </Sheet>
    <AlertDialog open={republishWarningOpen && !readOnly} onOpenChange={setRepublishWarningOpen}>
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#fff2d5] text-[#8a641a]"><AlertTriangle /></AlertDialogMedia>
          <AlertDialogTitle>Already published</AlertDialogTitle>
          <AlertDialogDescription>Some selected markets ({republishMarkets.join(", ")}) are already published. Do you want to approve them again for republishing?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
          <Button disabled={approving} onClick={() => void publishApprovals(republishMarkets)}>{approving ? "Approving…" : "Republish"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={pinterestCarouselDialogOpen && !readOnly} onOpenChange={setPinterestCarouselDialogOpen}>
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#fff2d5] text-[#8a641a]"><AlertTriangle /></AlertDialogMedia>
          <AlertDialogTitle>Pinterest does not publish this as a carousel</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how the {item.images?.length || item.driveFileIds?.length} slides should be posted to the configured Pinterest account. Separate Pins will appear as separate posts for each selected market.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:items-stretch">
          <Button disabled={approving} onClick={() => void handlePublishPlatform("pinterest", pinterestMarkets, { pinterestCarouselMode: "separate" })}>Create a separate Pin for every slide</Button>
          <Button variant="outline" disabled={approving} onClick={() => void handlePublishPlatform("pinterest", pinterestMarkets, { pinterestCarouselMode: "first" })}>Publish only the first image</Button>
          <AlertDialogCancel disabled={approving}>Don't post this carousel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={tiktokDialogOpen && !readOnly} onOpenChange={setTiktokDialogOpen}>
      <AlertDialogContent className="rounded-xl">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#f3f4f6] text-[#111827]"><Send /></AlertDialogMedia>
          <AlertDialogTitle>Publish to TikTok</AlertDialogTitle>
          <AlertDialogDescription>
            Posting as {tiktokCreatorName}. TikTok may take a few minutes to process the post before it appears on the profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="tiktok-privacy">Who can view this post?</Label>
          <select id="tiktok-privacy" value={tiktokPrivacyLevel} onChange={(event) => setTiktokPrivacyLevel(event.target.value)} className="h-10 rounded-md border border-[#ded9e1] bg-white px-3 text-sm">
            {tiktokPrivacyOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
          <label className="flex items-start gap-2 text-sm leading-5 text-[#5f5863]">
            <input type="checkbox" checked={tiktokConsent} onChange={(event) => setTiktokConsent(event.target.checked)} className="mt-1 accent-[#111827]" />
            I consent to sending this media and its caption to TikTok for publishing.
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
          <Button disabled={approving || !tiktokConsent || !tiktokPrivacyLevel} onClick={() => void handlePublishPlatform("tiktok", tiktokMarkets, { tiktokPrivacyLevel, tiktokConsent })}>
            {approving ? "Sending…" : "Publish to TikTok"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
export default function DashboardClient() {
  const [signedIn, setSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [humanApproval, setHumanApproval] = useState(true);
  const [internationalPublishing, setInternationalPublishing] = useState(true);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalStep, setApprovalStep] = useState<1 | 2>(1);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewReadOnly, setReviewReadOnly] = useState(false);
  const [dbContentItems, setDbContentItems] = useState<ReviewItem[]>([]);
  const [publishedItems, setPublishedItems] = useState<any[]>([]);
  const [publishedLoadError, setPublishedLoadError] = useState<string | null>(null);
  const [dbUgcItems, setDbUgcItems] = useState<ReviewItem[]>([]);
  const [ugcContentItems, setUgcContentItems] = useState<ReviewItem[]>([]);
  const [failureItems, setFailureItems] = useState<any[]>([]);
  const safeFailureItems = Array.isArray(failureItems) ? failureItems : [];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (active && response.ok) {
          const data = (await response.json()) as { user?: DashboardUser };
          setCurrentUser(data.user || null);
          setSignedIn(true);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const settings = (await response.json()) as { humanApproval?: boolean; internationalPublishing?: boolean };
        if (active) {
          if (typeof settings.humanApproval === "boolean") setHumanApproval(settings.humanApproval);
          if (typeof settings.internationalPublishing === "boolean") setInternationalPublishing(settings.internationalPublishing);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => unknown } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => { try { void Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {} };
    register({ name: "get_content_operations_status", title: "Get content operations status", description: "Read current publishing and approval status.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: async () => ({ pendingApproval: dbContentItems.filter((item) => ["draft", "pending", "ready for approval"].includes(item.status.toLowerCase())).length, totalPublished: publishedItems.length, newUgc: dbUgcItems.length, failures: safeFailureItems.filter((failure) => String(failure.status).toLowerCase() !== "resolved").length, humanApproval }) });
    register({ name: "navigate_content_operations", title: "Open a dashboard section", description: "Navigate to a MamaJewels dashboard section.", inputSchema: { type: "object", properties: { page: { type: "string", enum: Object.keys(pageLabels) } }, required: ["page"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const page = (input as { page?: PageKey })?.page; if (!page || !(page in pageLabels)) throw new Error("Unknown dashboard page"); setActivePage(page); return { page, label: pageLabels[page] }; } });
    register({ name: "open_content_review", title: "Open a content item", description: "Open a content item in the preview and editing panel.", inputSchema: { type: "object", properties: { contentId: { type: "string" } }, required: ["contentId"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const id = (input as { contentId?: string })?.contentId; const item = dbContentItems.find((entry) => entry.id === id); if (!item) throw new Error("Content item not found"); setReviewReadOnly(false); setSelectedItem(item); return { contentId: item.id, title: item.title, status: item.status }; } });
    return () => lifecycle.abort();
  }, [humanApproval, signedIn, dbContentItems, publishedItems, dbUgcItems, failureItems]);

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => setDbContentItems(data as ReviewItem[]))
      .catch((error) => console.error("Failed to load content:", error));
  }, [signedIn]);
  useEffect(() => {
  if (!signedIn) return;
  fetch("/api/ugc")
    .then((res) => res.json())
    .then((data) => setDbUgcItems(data as ReviewItem[]))
    .catch((error) => console.error("Failed to load UGC:", error));
  }, [signedIn]);
  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/ugc?status=completed")
      .then((res) => res.json())
      .then((data) => setUgcContentItems(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to load completed UGC:", error));
  }, [signedIn]);
  useEffect(() => {
  if (!signedIn) return;
    fetch("/api/published", { cache: "no-store" })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error("Published content could not be loaded. Check the server logs and database migration.");
        if (!Array.isArray(data)) throw new Error("The published content response was invalid.");
        setPublishedItems(data);
        setPublishedLoadError(null);
      })
      .catch((error) => {
        setPublishedItems([]);
        setPublishedLoadError(error instanceof Error ? error.message : "Published content could not be loaded.");
        console.error("Failed to load published content:", error);
      });
  }, [signedIn]);
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    const refreshPublishingStatus = async () => {
      try {
        const response = await fetch("/api/publishing/status", { method: "POST" });
        if (!response.ok || !active) return;
        const status = await response.json() as { completed?: number; failed?: number };
        if (!status.completed && !status.failed) return;
        const [contentResponse, publishedResponse] = await Promise.all([
          fetch("/api/content"),
          fetch("/api/published"),
        ]);
        if (!active) return;
        if (contentResponse.ok) setDbContentItems(await contentResponse.json() as ReviewItem[]);
        if (publishedResponse.ok) {
          const publishedData: unknown = await publishedResponse.json();
          if (Array.isArray(publishedData)) {
            setPublishedItems(publishedData);
            setPublishedLoadError(null);
          }
        }
      } catch (error) {
        console.error("Background publishing status refresh failed:", error);
      }
    };
    void refreshPublishingStatus();
    const interval = window.setInterval(() => void refreshPublishingStatus(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [signedIn]);
  useEffect(() => {
    if (!signedIn) return;
    if (currentUser?.role !== "Owner" && currentUser?.role !== "Administrator") {
      setFailureItems([]);
      return;
    }
    fetch("/api/failures", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load failures");
        const data: unknown = await response.json();
        setFailureItems(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        setFailureItems([]);
        console.error("Failed to load failures:", error);
      });
  }, [signedIn, currentUser?.role]);
  const saveSetting = async (setting: "humanApproval" | "internationalPublishing", enabled: boolean) => {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setting, enabled }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Unable to save setting");
  };
  const changeApproval = async (enabled: boolean) => {
    if (enabled) {
      try {
        await saveSetting("humanApproval", true);
        setHumanApproval(true);
        toast.success("Human approval turned on");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to turn on approval");
      }
      return;
    }
    setApprovalStep(1); setApprovalDialogOpen(true);
  };
  const disableApproval = async () => {
    try {
      await saveSetting("humanApproval", false);
      setHumanApproval(false);
      setApprovalDialogOpen(false);
      setApprovalStep(1);
      toast.warning("Human approval is off for eligible owned content");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to turn off approval");
    }
  };
  const changePublishing = async (enabled: boolean) => {
    try {
      await saveSetting("internationalPublishing", enabled);
      setInternationalPublishing(enabled);
      toast.success(`International publishing ${enabled ? "enabled" : "paused"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update publishing");
    }
  };
  if (!signedIn) return <><LoginScreen onSignIn={(user) => { setCurrentUser(user); setSignedIn(true); toast.success("Signed in securely"); }} /><Toaster position="top-right" /></>;
  const refreshUgcItems = async () => {
    try {
      const response = await fetch("/api/ugc");

      if (!response.ok) {
        throw new Error("Failed to refresh UGC");
      }

      const data = await response.json();
      setDbUgcItems(data as ReviewItem[]);
    } catch (error) {
      console.error("Failed to refresh UGC:", error);
    }
  };
  const refreshFailureItems = async () => {
    try {
      const response = await fetch("/api/failures");

      if (!response.ok) {
        throw new Error("Failed to refresh failures");
      }

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid failures response");
      setFailureItems(data as any[]);
    } catch (error) {
      console.error("Failed to refresh failures:", error);
    }
  };

  const renderPage = () => {
    const role = currentUser?.role || "Viewer";
    const isAdmin = role === "Owner" || role === "Administrator";
    const readablePages = role === "Viewer"
      ? ["overview", "content", "published", "ugc"]
      : ["overview", "content", "published", "ugc"];
    if (!isAdmin && !readablePages.includes(activePage)) {
      return <div className="mt-10 rounded-lg border border-[#e5e1e7] bg-white p-6 text-sm text-[#746c77]">Your account does not have access to this section.</div>;
    }
    if (activePage === "overview") return <OverviewView onOpen={setSelectedItem} onNavigate={setActivePage} items={dbContentItems} userName={currentUser?.name || ""} />;
    if (activePage === "content") {
      return (
        <ContentView
          title="NL Content"
          description="Review, edit and track NL content across Germany, France and the USA."
          items={dbContentItems}
          mode="nl"
          onOpen={(item) => {
            setReviewReadOnly(false);
            setSelectedItem(item);
          }}
        />
      );
    }
    if (activePage === "ugc_content") {
      return (
        <ContentView
          title="UGC Content"
          description="Review, edit and track UGC content across Germany, France and the USA."
          items={ugcContentItems}
          mode="ugc"
          onOpen={(item) => {
            setReviewReadOnly(false);
            setSelectedItem(item);
          }}
        />
      );
    }

    if (activePage === "published") return <PublishedView items={publishedItems} loadError={publishedLoadError} onOpen={(published) => {
      const content = dbContentItems.find((item) => item.id === String(published.contentId));
      const market = String(published.market || "").toUpperCase();
      const fallback: ReviewItem = {
        id: String(published.contentId),
        title: String(published.title || `Content ${published.contentId}`),
        type: published.mediaType?.toLowerCase() === "video" || published.mediaType?.toLowerCase() === "reel" ? "Reel" : published.type?.toLowerCase() === "carousel" ? "Carousel" : "Image",
        status: "Published",
        mediaType: published.mediaType || "image",
        driveFileId: published.driveFileId || null,
        driveFileIds: published.driveFileIds || (published.driveFileId ? [published.driveFileId] : []),
        images: published.images || (published.image ? [published.image] : []),
        capturedAt: published.capturedAt || "",
        capturedLabel: published.capturedLabel || "",
        source: published.source || "",
        market,
        markets: market ? [market] : [],
        image: published.image || "",
        caption: published.caption || "",
        kind: "owned",
        localizations: [{ market, caption: published.caption || "", status: "published", approved_by: null, approved_at: null, published_at: published.publishedAt || null, meta_media_id: published.metaMediaId || null }],
      };
      setReviewReadOnly(true);
      setSelectedItem(content ? { ...content, status: "Published", market } : fallback);
    }} />;
    if (activePage === "ugc") return <UgcView items={dbUgcItems} onOpen={(item) => { setReviewReadOnly(false); setSelectedItem(item); }} />;
    // if (activePage === "failures") return <FailuresView items={failureItems} onRetry={refreshFailureItems} />;
    if (activePage === "team") return <TeamView isOwner={currentUser?.role === "Owner"} />;
    return <SettingsView />;
  };

  return <SidebarProvider style={{ "--sidebar-width": "16.25rem" } as React.CSSProperties}><AppSidebar activePage={activePage} setActivePage={setActivePage} humanApproval={humanApproval} counts={{
  content: dbContentItems.filter((i) => i.source.toLowerCase().includes("@mamajewels.nl")).length,
  ugc_content: dbContentItems.filter((i) => !i.source.toLowerCase().includes("@mamajewels.nl")).length,
  ugc: dbUgcItems.length,
}}
 /><SidebarInset className="min-w-0 bg-[#f7f7f8]"><Header activePage={activePage} setActivePage={setActivePage} onSignOut={async () => { try { const response = await fetch("/api/auth/logout", { method: "POST" }); if (!response.ok) throw new Error(); setSignedIn(false); setCurrentUser(null); setActivePage("overview"); toast.success("Signed out"); } catch { toast.error("Unable to sign out. Please try again."); } }} />{!humanApproval ? <button onClick={() => setActivePage("settings")} className="flex w-full items-center justify-center gap-2 border-b border-[#e9b5bc] bg-[#fff1f2] px-4 py-2.5 text-center text-sm font-medium text-[#933241]"><ShieldAlert className="size-4" />Human approval is OFF. Eligible owned content can publish automatically. UGC remains manual.<span className="underline underline-offset-2">Review settings</span></button> : null}<div className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-7 sm:px-7 lg:py-9">{renderPage()}</div></SidebarInset><ContentReviewSheet
  item={selectedItem}
  readOnly={reviewReadOnly}
  canReview={currentUser?.role === "Owner" || currentUser?.role === "Administrator" || currentUser?.role === "Editor and approver"}
  onClose={() => {
    setSelectedItem(null);
    setReviewReadOnly(false);
    refreshUgcItems();
  }}
  onApproved={async () => {
    try {
      for (let attempt = 0; attempt < 24; attempt += 1) {
        const statusResponse = await fetch("/api/publishing/status", { method: "POST" });
        if (!statusResponse.ok) break;
        const statusData = await statusResponse.json() as { pending?: number };
        if (!statusData.pending) break;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("Publishing status polling failed:", error);
    }
    const [contentRes, publishedRes, ugcContentRes, ugcRes] = await Promise.all([
      fetch("/api/content"),
      fetch("/api/published"),
      fetch("/api/ugc?status=completed"),
      fetch("/api/ugc"),
    ]);
    if (contentRes.ok) {
      const data = await contentRes.json();
      setDbContentItems(data as ReviewItem[]);
    }
    if (publishedRes.ok) {
      const data: unknown = await publishedRes.json();
      if (Array.isArray(data)) {
        setPublishedItems(data);
        setPublishedLoadError(null);
      } else {
        setPublishedLoadError("The published content response was invalid.");
      }
    } else {
      setPublishedLoadError("Published content could not be loaded. Check the server logs and database migration.");
    }
    if (ugcContentRes.ok) {
      const data = await ugcContentRes.json();
      setUgcContentItems(Array.isArray(data) ? data : []);
    }
    if (ugcRes.ok) {
      const data = await ugcRes.json();
      setDbUgcItems(data as ReviewItem[]);
    }
  }}


/><AlertDialog open={approvalDialogOpen} onOpenChange={(open) => { setApprovalDialogOpen(open); if (!open) setApprovalStep(1); }}><AlertDialogContent className="rounded-2xl"><AlertDialogHeader><AlertDialogMedia className={approvalStep === 1 ? "bg-[#fff2d5] text-[#8a641a]" : "bg-[#fdebec] text-[#a33442]"}>{approvalStep === 1 ? <ShieldAlert /> : <AlertTriangle />}</AlertDialogMedia><AlertDialogTitle>{approvalStep === 1 ? "Turn off human approval?" : "Final confirmation"}</AlertDialogTitle><AlertDialogDescription className="leading-6">{approvalStep === 1 ? "Eligible MamaJewels-owned content will no longer wait for approval after all checks pass." : "Content may publish automatically to Germany, France and the USA. UGC and any flagged content will always remain manual."}</AlertDialogDescription></AlertDialogHeader>{approvalStep === 2 ? <div className="rounded-xl border border-[#efc4c8] bg-[#fff4f4] p-3 text-sm font-medium text-[#843440]">This changes live publishing behavior and will be recorded.</div> : null}<AlertDialogFooter><AlertDialogCancel>Keep approval on</AlertDialogCancel>{approvalStep === 1 ? <Button onClick={() => setApprovalStep(2)}>Yes, continue</Button> : <Button variant="destructive" onClick={disableApproval}>Turn Off Approval and Enable Automatic Publishing</Button>}</AlertDialogFooter></AlertDialogContent></AlertDialog><Toaster position="top-right" richColors /></SidebarProvider>;
}
