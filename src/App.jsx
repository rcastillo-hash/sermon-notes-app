import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const ENV = typeof import.meta !== "undefined" && import.meta && import.meta.env ? import.meta.env : {};
const SUPABASE_URL = ENV.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = ENV.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_PIN = ENV.VITE_ADMIN_PIN || "1234";
const CREATOR_EMAILS = (ENV.VITE_CREATOR_EMAILS || "rcastillo@blackrock.org")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const SLIDE_BUCKET = "sermon-slides";
const DEVICE_ID_KEY = "black-rock-sermon-notes-device-id"; // Legacy fallback only; notes now save by Supabase user ID.

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const theme = {
  teal: "#559098",
  charcoal: "#3e3935",
  gold: "#f8e36c",
  deep: "#012d36",
  cream: "#f7f3ec",
};

function Icon({ name, className = "h-4 w-4", style }) {
  const common = {
    className,
    style,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
    previous: <path d="M15 18l-6-6 6-6" />,
    next: <path d="M9 18l6-6-6-6" />,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
    image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10.5" r="1.5" /><path d="M21 16l-5-5L5 19" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" /></>,
    google: <><circle cx="12" cy="12" r="9" /><path d="M12 12h7" /><path d="M18.4 16.2A7 7 0 1 1 18.4 7.8" /></>,
    admin: <><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z" /><path d="M9 12l2 2 4-5" /></>,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  };

  return <svg {...common}>{paths[name] || paths.image}</svg>;
}

function BrandButton({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "border-transparent text-white shadow-sm hover:opacity-95",
    secondary: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    subtle: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
    gold: "border-transparent text-slate-950 shadow-sm hover:opacity-95",
  };
  const inlineStyle = variant === "primary" ? { backgroundColor: theme.deep } : variant === "gold" ? { backgroundColor: theme.gold } : undefined;
  return <button {...props} style={{ ...inlineStyle, ...(props.style || {}) }} className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}>{children}</button>;
}

function BrandCard({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200/80 bg-white shadow-sm ${className}`}>{children}</div>;
}

function BrandLogo() {
  return <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black tracking-tight text-white shadow-sm" style={{ backgroundColor: theme.deep }}>BR</div>;
}

function ModeToggle({ mode, setMode, canAccessCreator }) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {canAccessCreator ? (
      <button onClick={() => setMode("creator")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${mode === "creator" ? "text-white" : "text-slate-600 hover:bg-slate-50"}`} style={mode === "creator" ? { backgroundColor: theme.deep } : undefined}><Icon name="admin" /> Creator View</button>
      ) : null}
      <button onClick={() => setMode("user")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${mode === "user" ? "text-white" : "text-slate-600 hover:bg-slate-50"}`} style={mode === "user" ? { backgroundColor: theme.teal } : undefined}><Icon name="user" /> User View</button>
    </div>
  );
}

function isSupportedSlideFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  return type === "image/jpeg" || type === "image/png" || type.includes("presentation") || /\.(jpg|jpeg|png|ppt|pptx)$/.test(name);
}

function isPowerPointFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  const type = String(file.type || "").toLowerCase();
  return type.includes("presentation") || /\.(ppt|pptx)$/.test(name);
}

function sortSlidesByName(files) {
  return [...files].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true }));
}

function slugifyTitle(title) {
  const slug = String(title || "sermon-notes").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "sermon-notes";
}

function createSermonId(date, title) {
  return `${date || "undated"}-${slugifyTitle(title || "sermon")}`;
}

function getDeviceId() {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function getUserDisplayName(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Signed-in user";
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", padding: 32, fontFamily: "Arial, Helvetica, sans-serif", background: "#f7f3ec", color: "#012d36" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", background: "white", borderRadius: 24, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>The app hit a setup error</h1>
            <p style={{ marginBottom: 16 }}>This usually means one dependency, environment variable, or Supabase table is missing.</p>
            <pre style={{ whiteSpace: "pre-wrap", background: "#fff7ed", padding: 16, borderRadius: 16, color: "#7c2d12" }}>{String(this.state.error?.message || this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function buildMarkdown({ sermon, slides, notes }) {
  const lines = [
    `# ${sermon?.title || "Sermon Notes"}`,
    "",
    sermon?.speaker ? `**Speaker:** ${sermon.speaker}` : "",
    sermon?.sermon_date ? `**Sunday Date:** ${sermon.sermon_date}` : "",
    sermon?.scripture ? `**Scripture:** ${sermon.scripture}` : "",
    "",
    "---",
    "",
  ].filter(Boolean);

  if (!slides.length) {
    lines.push("## Notes", "", "No slides available.");
  } else {
    slides.forEach((slide, index) => {
      lines.push(`## Slide ${index + 1}: ${slide.name}`, "", notes[index] || "_No notes for this slide._", "");
    });
  }
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNoteForPdf(note) {
  const safe = escapeHtml(note || "No notes for this slide.");
  return safe.replace(/\n/g, "<br />");
}

function PrintableNotesView({ sermon, slides, notes, onBack }) {
  const title = sermon?.title || "Sermon Notes";
  const date = sermon?.sermon_date || "";
  const speaker = sermon?.speaker || "";
  const scripture = sermon?.scripture || "";

  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#012d36]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{`
        @page { size: letter; margin: 0.55in; }
        @media print {
          .no-print { display: none !important; }
          .cover-page { min-height: 9.4in; page-break-after: always; }
          .slide-page { page-break-after: always; }
          .slide-page:last-child { page-break-after: auto; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-50 border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>PDF Export Preview</p>
            <p className="text-sm text-slate-600">Choose “Save as PDF” in the print dialog.</p>
          </div>
          <div className="flex gap-2">
            <BrandButton variant="secondary" onClick={() => window.print()}><Icon name="download" className="mr-2 h-4 w-4" />Print / Save PDF</BrandButton>
            <BrandButton onClick={onBack}>Back to Notes</BrandButton>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl p-6 print:p-0">
        <section className="cover-page flex flex-col justify-center rounded-[28px] border-[3px] p-12" style={{ borderColor: theme.teal }}>
          <div className="text-sm font-black uppercase tracking-[0.26em]" style={{ color: theme.teal }}>Black Rock Church</div>
          <h1 className="mt-3 text-5xl font-black leading-tight" style={{ color: theme.deep }}>{title}</h1>
          <div className="mt-7 grid gap-3 text-base" style={{ color: theme.charcoal }}>
            {date ? <div><strong style={{ color: theme.deep }}>Sunday Date:</strong> {date}</div> : null}
            {speaker ? <div><strong style={{ color: theme.deep }}>Speaker:</strong> {speaker}</div> : null}
            {scripture ? <div><strong style={{ color: theme.deep }}>Scripture / Series:</strong> {scripture}</div> : null}
          </div>
          <div className="mt-10 rounded-2xl border-l-8 p-4 font-bold" style={{ borderColor: theme.gold, backgroundColor: theme.cream }}>
            Personal sermon notes: slides and my notes only.
          </div>
        </section>

        {slides.length ? slides.map((slide, index) => (
          <section key={slide.id || slide.path || index} className="slide-page py-6 print:py-0">
            <div className="mb-4 border-b-2 pb-3" style={{ borderColor: "#d7e7e9" }}>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Slide {index + 1}</p>
              <h2 className="text-lg font-black" style={{ color: theme.deep }}>{slide.name || `Slide ${index + 1}`}</h2>
            </div>
            <div className="mb-5 flex min-h-[310px] items-center justify-center rounded-[18px] border p-3" style={{ borderColor: "#d7e7e9", backgroundColor: "#f8fbfb" }}>
              {slide.url ? (
                <img src={slide.url} alt={`Slide ${index + 1}`} className="max-h-[4.8in] max-w-full rounded-xl object-contain" />
              ) : (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-orange-900">Slide image unavailable</div>
              )}
            </div>
            <div className="min-h-[210px] rounded-[18px] border border-slate-200 p-5">
              <h3 className="mb-3 text-base font-black" style={{ color: theme.deep }}>My Notes</h3>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{notes[index] || "No notes for this slide."}</div>
            </div>
          </section>
        )) : (
          <section className="slide-page py-6">
            <div className="min-h-[210px] rounded-[18px] border border-slate-200 p-5">
              <h3 className="mb-3 text-base font-black" style={{ color: theme.deep }}>My Notes</h3>
              <div className="text-sm leading-7 text-slate-700">No slides available.</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SetupWarning() {
  if (supabase) return null;
  return (
    <BrandCard className="mb-5 border-amber-200 bg-amber-50">
      <div className="flex gap-3 p-4 text-amber-950">
        <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold">Supabase is not connected yet.</p>
          <p className="text-sm leading-6">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file and Vercel environment variables.</p>
        </div>
      </div>
    </BrandCard>
  );
}

function SlideViewer({ slides, currentSlide }) {
  if (!slides.length) return null;
  const slide = slides[currentSlide];
  return (
    <div className="mx-auto flex min-h-[520px] items-center justify-center rounded-3xl bg-white p-2 shadow-inner md:min-h-[900px] md:p-4">
      {slide?.url ? (
        <img
          src={slide.url}
          alt={`Slide ${currentSlide + 1}`}
          className="block max-h-[88vh] w-full rounded-2xl object-contain"
        />
      ) : (
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          <Icon name="alert" className="mx-auto h-8 w-8" />
          <p className="mt-3 font-bold">Slide image missing.</p>
          <p className="mt-2 text-sm">Check the Supabase Storage bucket and slide URL.</p>
        </div>
      )}
    </div>
  );
}

function EmptySlideState({ fileInputRef }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-5 text-center md:min-h-[460px]">
      <Icon name="image" className="h-14 w-14" style={{ color: theme.teal }} />
      <p className="mt-4 text-2xl font-black" style={{ color: theme.deep }}>Upload this Sunday’s slides</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Use JPG or PNG slides. PPT/PPTX upload is a future server-side conversion step.</p>
      <BrandButton className="mt-5" onClick={() => fileInputRef.current?.click()}><Icon name="upload" className="mr-2 h-4 w-4" />Choose sermon slides</BrandButton>
    </div>
  );
}

function SermonNotesAppInner() {
  const [mode, setMode] = useState("creator");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isCreatorEmail = user?.email ? CREATOR_EMAILS.includes(user.email.toLowerCase()) : false;
  const [pinInput, setPinInput] = useState("");
  const [sermonTitle, setSermonTitle] = useState("Sunday Sermon Notes");
  const [speaker, setSpeaker] = useState("");
  const [scripture, setScripture] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [draftSlides, setDraftSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [publishedSermons, setPublishedSermons] = useState([]);
  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [notes, setNotes] = useState({});
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);
  const fileInputRef = useRef(null);
  const legacyDeviceId = useMemo(() => getDeviceId(), []);

  const selectedSermon = publishedSermons.find((sermon) => sermon.id === selectedSermonId) || publishedSermons[0] || null;
  const currentSlides = mode === "creator" ? draftSlides : selectedSermon?.slides || [];
  const currentNote = notes[currentSlide] || "";
  const noteCount = Object.values(notes).filter((note) => String(note).trim().length > 0).length;
  const progress = currentSlides.length ? Math.round(((currentSlide + 1) / currentSlides.length) * 100) : 0;

  useEffect(() => {
    loadPublishedSermons();
    initializeAuth();
  }, []);

  async function initializeAuth() {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user || null);
    setAuthLoading(false);

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setNotes({});
    });

    return () => authListener?.subscription?.unsubscribe?.();
  }

  useEffect(() => {
    if (selectedSermon?.id && user?.id) loadNotes(selectedSermon.id);
    if (!user?.id) setNotes({});
  }, [selectedSermon?.id, user?.id]);

  useEffect(() => {
    if (!isCreatorEmail && mode === "creator") {
      setMode("user");
    }
  }, [isCreatorEmail, mode]);

  async function loadPublishedSermons() {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("sermons")
      .select("*, slides(*)")
      .eq("is_published", true)
      .order("sermon_date", { ascending: false })
      .order("slide_order", { referencedTable: "slides", ascending: true });

    setIsLoading(false);
    if (error) {
      setStatus(`Could not load sermons: ${error.message}`);
      return;
    }

    const sermons = (data || []).map((sermon) => ({
      ...sermon,
      slides: [...(sermon.slides || [])].sort((a, b) => a.slide_order - b.slide_order),
    }));
    setPublishedSermons(sermons);
    if (!selectedSermonId && sermons[0]) setSelectedSermonId(sermons[0].id);
  }

  async function loadNotes(sermonId) {
    if (!supabase || !sermonId || !user?.id) return;
    const { data, error } = await supabase
      .from("notes")
      .select("slide_index, body")
      .eq("sermon_id", sermonId)
      .eq("user_id", user.id);

    if (error) {
      setStatus(`Could not load notes: ${error.message}`);
      return;
    }

    const nextNotes = {};
    (data || []).forEach((row) => {
      nextNotes[row.slide_index] = row.body || "";
    });
    setNotes(nextNotes);
  }

  async function handleSlidesUpload(event) {
    const selectedFiles = sortSlidesByName(Array.from(event.target.files || []).filter(isSupportedSlideFile));
    if (!selectedFiles.length) {
      alert("No supported sermon files were selected. Please choose JPG, PNG, PPT, or PPTX files.");
      return;
    }

    const powerPoints = selectedFiles.filter(isPowerPointFile);
    const imageFiles = selectedFiles.filter((file) => !isPowerPointFile(file));
    if (powerPoints.length) alert("PowerPoint conversion is not enabled yet. Please export the PowerPoint as JPG or PNG slides for now.");
    if (!imageFiles.length) return;

    const previewSlides = imageFiles.map((file, index) => ({
      id: `${file.name}-${index}-${file.lastModified}-${file.size}`,
      name: file.name,
      file,
      url: URL.createObjectURL(file),
      slide_order: index,
    }));
    setDraftSlides(previewSlides);
    setCurrentSlide(0);
    setStatus(`${previewSlides.length} slide image(s) ready to publish.`);
    event.target.value = "";
  }

  async function publishSermon() {
    if (!supabase) {
      setStatus("Connect Supabase before publishing.");
      return;
    }
    if (!isAdmin) {
      setStatus("Enter the Creator PIN before publishing.");
      return;
    }
    if (!sermonTitle.trim()) {
      alert("Please add a sermon title before publishing.");
      return;
    }
    if (!draftSlides.length) {
      alert("Please upload JPG or PNG slides before publishing.");
      return;
    }

    setIsLoading(true);
    setStatus("Publishing sermon and uploading slides...");

    const sermonId = createSermonId(date, sermonTitle);
    const sermonRecord = {
      id: sermonId,
      title: sermonTitle,
      speaker,
      scripture,
      sermon_date: date,
      is_published: true,
      published_at: new Date().toISOString(),
    };

    const { error: sermonError } = await supabase.from("sermons").upsert(sermonRecord);
    if (sermonError) {
      setIsLoading(false);
      setStatus(`Could not save sermon: ${sermonError.message}`);
      return;
    }

    const { error: deleteOldSlidesError } = await supabase.from("slides").delete().eq("sermon_id", sermonId);
    if (deleteOldSlidesError) {
      setIsLoading(false);
      setStatus(`Could not replace old slides: ${deleteOldSlidesError.message}`);
      return;
    }

    const slideRows = [];
    for (const slide of draftSlides) {
      const extension = slide.file.name.split(".").pop() || "jpg";
      const filePath = `${sermonId}/slide-${String(slide.slide_order + 1).padStart(3, "0")}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(SLIDE_BUCKET).upload(filePath, slide.file, { upsert: true, contentType: slide.file.type || "image/jpeg" });
      if (uploadError) {
        setIsLoading(false);
        setStatus(`Could not upload ${slide.name}: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from(SLIDE_BUCKET).getPublicUrl(filePath);
      slideRows.push({
        sermon_id: sermonId,
        name: slide.name,
        path: filePath,
        url: publicUrlData.publicUrl,
        slide_order: slide.slide_order,
      });
    }

    const { error: slideError } = await supabase.from("slides").insert(slideRows);
    if (slideError) {
      setIsLoading(false);
      setStatus(`Could not save slide records: ${slideError.message}`);
      return;
    }

    setIsLoading(false);
    setStatus("Published! Switch to User View to test the sermon.");
    await loadPublishedSermons();
    setSelectedSermonId(sermonId);
  }

  async function deletePublishedSermon(sermonId) {
    if (!supabase || !isAdmin) return;
    if (!window.confirm("Delete this published Sunday?")) return;
    setIsLoading(true);
    const sermon = publishedSermons.find((item) => item.id === sermonId);
    for (const slide of sermon?.slides || []) {
      if (slide.path) await supabase.storage.from(SLIDE_BUCKET).remove([slide.path]);
    }
    await supabase.from("notes").delete().eq("sermon_id", sermonId);
    await supabase.from("slides").delete().eq("sermon_id", sermonId);
    const { error } = await supabase.from("sermons").delete().eq("id", sermonId);
    setIsLoading(false);
    if (error) setStatus(`Could not delete sermon: ${error.message}`);
    else {
      setStatus("Sermon deleted.");
      setSelectedSermonId("");
      await loadPublishedSermons();
    }
  }

  async function updateUserNote(value) {
    setNotes((previous) => ({ ...previous, [currentSlide]: value }));
    if (!supabase || !selectedSermon) return;
    if (!user?.id) {
      setStatus("Sign in with Google before saving notes.");
      return;
    }

    const { error } = await supabase.from("notes").upsert({
      sermon_id: selectedSermon.id,
      slide_index: currentSlide,
      user_id: user.id,
      body: value,
      updated_at: new Date().toISOString(),
    }, { onConflict: "sermon_id,slide_index,user_id" });

    if (error) setStatus(`Could not save note: ${error.message}`);
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus("Connect Supabase before signing in.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setStatus(`Could not start Google sign-in: ${error.message}`);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setNotes({});
    setStatus("Signed out.");
  }

  function goToSlide(index) {
    if (!currentSlides.length) return;
    setCurrentSlide(Math.max(0, Math.min(index, currentSlides.length - 1)));
  }

  function clearCurrentSermon() {
    setSermonTitle("Sunday Sermon Notes");
    setSpeaker("");
    setScripture("");
    setDate(new Date().toISOString().slice(0, 10));
    setDraftSlides([]);
    setCurrentSlide(0);
  }

  function loadSermonForEditing(entry) {
    setMode("creator");
    setSermonTitle(entry.title || "Sunday Sermon Notes");
    setSpeaker(entry.speaker || "");
    setScripture(entry.scripture || "");
    setDate(entry.sermon_date || new Date().toISOString().slice(0, 10));
    setDraftSlides(entry.slides || []);
    setCurrentSlide(0);
  }

  function exportPdf() {
    if (!selectedSermon && mode === "user") {
      setStatus("Select a Sunday sermon before exporting.");
      return;
    }
    setIsPrintView(true);
  }

  function exportMarkdown() {
    const markdown = buildMarkdown({ sermon: selectedSermon || { title: sermonTitle, speaker, scripture, sermon_date: date }, slides: currentSlides, notes });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedSermon?.sermon_date || date}-${slugifyTitle(selectedSermon?.title || sermonTitle)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isPrintView) {
    return (
      <PrintableNotesView
        sermon={selectedSermon || { title: sermonTitle, speaker, scripture, sermon_date: date }}
        slides={currentSlides}
        notes={notes}
        onBack={() => setIsPrintView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen text-slate-950" style={{ background: `linear-gradient(135deg, ${theme.cream} 0%, #ffffff 45%, #e8f2f3 100%)`, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <header className="border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4"><BrandLogo /><div><div className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: theme.teal }}>Black Rock Church</div><h1 className="mt-1 text-2xl font-black tracking-tight md:text-4xl" style={{ color: theme.deep }}>Sermon Notes</h1><p className="mt-1 max-w-xl text-sm text-slate-600">Creator uploads Sunday slides. Users add private notes and return later for study.</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><ModeToggle mode={mode} canAccessCreator={isCreatorEmail} setMode={(nextMode) => { setMode(nextMode); setCurrentSlide(0); }} />{user ? <BrandButton variant="secondary" onClick={signOut}><Icon name="user" className="mr-2 h-4 w-4" />{getUserDisplayName(user)} · Sign out</BrandButton> : <BrandButton variant="gold" onClick={signInWithGoogle}><Icon name="google" className="mr-2 h-4 w-4" />Sign in with Google</BrandButton>}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <SetupWarning />
        {status ? <BrandCard className="mb-5"><div className="p-4 text-sm font-semibold" style={{ color: theme.deep }}>{status}</div></BrandCard> : null}

        {mode === "creator" && isCreatorEmail ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <BrandCard>
                <div className="border-b p-4"><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Creator Dashboard</p><h2 className="text-2xl font-black" style={{ color: theme.deep }}>Prepare a Sunday sermon</h2><p className="mt-1 text-sm text-slate-500">Staff uploads slides and publishes the sermon for users.</p></div>
                <div className="grid gap-3 p-4 md:grid-cols-4">
                  <label className="space-y-1 md:col-span-2"><span className="text-sm font-bold" style={{ color: theme.charcoal }}>Creator PIN</span><div className="flex gap-2"><input type="password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2" placeholder="Enter admin PIN" value={pinInput} onChange={(event) => setPinInput(event.target.value)} /><BrandButton variant={isAdmin ? "gold" : "secondary"} onClick={() => setIsAdmin(pinInput === ADMIN_PIN)}>{isAdmin ? "Unlocked" : "Unlock"}</BrandButton></div></label>
                  <label className="space-y-1 md:col-span-2"><span className="text-sm font-bold" style={{ color: theme.charcoal }}>Sermon title</span><input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2" value={sermonTitle} onChange={(event) => setSermonTitle(event.target.value)} /></label>
                  <label className="space-y-1"><span className="text-sm font-bold" style={{ color: theme.charcoal }}>Speaker</span><input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2" placeholder="Pastor / teacher" value={speaker} onChange={(event) => setSpeaker(event.target.value)} /></label>
                  <label className="space-y-1"><span className="text-sm font-bold" style={{ color: theme.charcoal }}>Sunday date</span><input type="date" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                  <label className="space-y-1 md:col-span-2"><span className="text-sm font-bold" style={{ color: theme.charcoal }}>Scripture / series note</span><input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2" placeholder="Example: Matthew 4:19 · Journey Together" value={scripture} onChange={(event) => setScripture(event.target.value)} /></label>
                </div>
              </BrandCard>

              <BrandCard className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Slide upload</p><h2 className="text-xl font-black" style={{ color: theme.deep }}>Sermon slides</h2><p className="text-sm text-slate-500">Upload JPG or PNG slides. PPT/PPTX conversion can be added later.</p></div><div className="flex flex-wrap gap-2"><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png,.ppt,.pptx" className="hidden" onChange={handleSlidesUpload} /><BrandButton variant="secondary" onClick={() => fileInputRef.current?.click()}><Icon name="upload" className="mr-2 h-4 w-4" />Upload slides</BrandButton><BrandButton variant="subtle" onClick={clearCurrentSermon}><Icon name="trash" /></BrandButton></div></div>
                <div className="p-3 md:p-5" style={{ backgroundColor: "#eef5f5" }}>{draftSlides.length ? <SlideViewer slides={draftSlides} currentSlide={currentSlide} /> : <EmptySlideState fileInputRef={fileInputRef} />}</div>
                <div className="flex flex-col gap-3 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm font-semibold text-slate-600">{draftSlides.length ? `Slide ${currentSlide + 1} of ${draftSlides.length} · ${progress}% ready` : "Upload slides to begin"}</div><div className="flex items-center gap-2"><BrandButton variant="secondary" disabled={!draftSlides.length || currentSlide === 0} onClick={() => goToSlide(currentSlide - 1)}><Icon name="previous" className="mr-1 h-4 w-4" />Previous</BrandButton><BrandButton variant="secondary" disabled={!draftSlides.length || currentSlide === draftSlides.length - 1} onClick={() => goToSlide(currentSlide + 1)}>Next<Icon name="next" className="ml-1 h-4 w-4" /></BrandButton></div></div>
              </BrandCard>

              <div className="flex flex-wrap gap-2"><BrandButton variant="gold" disabled={isLoading || !isAdmin} onClick={publishSermon}><Icon name="save" className="mr-2 h-4 w-4" />{isLoading ? "Publishing..." : "Publish to User Dashboard"}</BrandButton><BrandButton variant="secondary" onClick={() => setMode("user")}>Preview User View</BrandButton></div>
            </section>

            <aside className="space-y-5"><BrandCard><div className="p-4"><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Published Sundays</p><h2 className="text-xl font-black" style={{ color: theme.deep }}>Creator library</h2><div className="mt-4 max-h-[560px] space-y-2 overflow-auto pr-1">{publishedSermons.length ? publishedSermons.map((entry) => <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><button onClick={() => loadSermonForEditing(entry)} className="block w-full text-left"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: theme.teal }}><Icon name="calendar" /> {entry.sermon_date || "Undated"}</div><p className="mt-1 font-black" style={{ color: theme.deep }}>{entry.title}</p><p className="mt-1 text-xs text-slate-500">{entry.slides?.length || 0} slides · Published</p></button><button disabled={!isAdmin} onClick={() => deletePublishedSermon(entry.id)} className="mt-2 text-xs font-bold text-slate-500 hover:text-red-700 disabled:opacity-40">Delete</button></div>) : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No sermons published yet.</div>}</div></div></BrandCard></aside>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1.6fr)_320px]">
            <aside className="space-y-5"><BrandCard><div className="p-4"><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>User Dashboard</p><h2 className="text-xl font-black" style={{ color: theme.deep }}>Available Sundays</h2><p className="mt-1 text-sm text-slate-500">Sign in with Google, choose a sermon, and take private notes synced to your account.</p><div className="mt-4 space-y-2">{publishedSermons.length ? publishedSermons.map((entry) => <button key={entry.id} onClick={() => { setSelectedSermonId(entry.id); setCurrentSlide(0); }} className={`block w-full rounded-2xl border p-3 text-left transition ${selectedSermon?.id === entry.id ? "text-white" : "border-slate-200 bg-slate-50 hover:bg-white"}`} style={selectedSermon?.id === entry.id ? { backgroundColor: theme.deep, borderColor: theme.deep } : undefined}><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={selectedSermon?.id === entry.id ? { color: theme.gold } : { color: theme.teal }}><Icon name="calendar" /> {entry.sermon_date || "Undated"}</div><p className="mt-1 font-black">{entry.title}</p><p className="mt-1 text-xs opacity-80">{entry.slides?.length || 0} slides</p></button>) : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No Sundays are published yet. Switch to Creator View to publish one.</div>}</div></div></BrandCard></aside>

            <section className="space-y-5"><BrandCard className="overflow-hidden"><div className="border-b bg-white px-4 py-4"><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>{selectedSermon?.sermon_date || "Sunday"}</p><h2 className="text-2xl font-black" style={{ color: theme.deep }}>{selectedSermon?.title || "Select a Sunday sermon"}</h2><p className="mt-1 text-sm text-slate-500">{selectedSermon ? [selectedSermon.speaker, selectedSermon.scripture].filter(Boolean).join(" · ") : "Published sermons will appear in the list."}</p></div><div className="p-3 md:p-5" style={{ backgroundColor: "#eef5f5" }}>{selectedSermon ? <SlideViewer slides={selectedSermon.slides || []} currentSlide={currentSlide} /> : <div className="rounded-3xl bg-white p-10 text-center text-slate-500">Select a Sunday to begin.</div>}</div><div className="flex flex-col gap-3 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm font-semibold text-slate-600">{currentSlides.length ? `Slide ${currentSlide + 1} of ${currentSlides.length} · ${progress}% through the message` : "No slides selected"}</div><div className="flex items-center gap-2"><BrandButton variant="secondary" disabled={!currentSlides.length || currentSlide === 0} onClick={() => goToSlide(currentSlide - 1)}><Icon name="previous" className="mr-1 h-4 w-4" />Previous</BrandButton><BrandButton variant="secondary" disabled={!currentSlides.length || currentSlide === currentSlides.length - 1} onClick={() => goToSlide(currentSlide + 1)}>Next<Icon name="next" className="ml-1 h-4 w-4" /></BrandButton></div></div></BrandCard></section>

            <aside className="space-y-5"><BrandCard><div className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Personal study</p><h2 className="text-xl font-black" style={{ color: theme.deep }}>My notes</h2></div><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: theme.gold, color: theme.deep }}>{noteCount} noted</span></div><textarea disabled={!selectedSermon || !user} className="mt-4 min-h-[320px] w-full resize-none rounded-3xl border border-slate-200 bg-white p-5 text-base leading-8 outline-none focus:ring-2 disabled:bg-slate-50" placeholder={!user ? "Sign in with Google to save your personal notes." : selectedSermon ? `Write your notes for slide ${currentSlide + 1}...` : "Select a Sunday sermon first."} value={currentNote} onChange={(event) => updateUserNote(event.target.value)} /><div className="mt-3 flex flex-wrap gap-2">{user ? <BrandButton disabled={!selectedSermon} variant="gold" onClick={() => setStatus("Notes save automatically to your Google sign-in account.")}><Icon name="save" className="mr-2 h-4 w-4" />Saved</BrandButton> : <BrandButton variant="gold" onClick={signInWithGoogle}><Icon name="google" className="mr-2 h-4 w-4" />Sign in to save</BrandButton>}<BrandButton disabled={!selectedSermon || !user} variant="secondary" onClick={exportPdf}><Icon name="download" className="mr-2 h-4 w-4" />Export PDF</BrandButton></div></div></BrandCard>

              <BrandCard><div className="p-4"><p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: theme.teal }}>Message outline</p><h2 className="text-xl font-black" style={{ color: theme.deep }}>Slides</h2><div className="mt-4 max-h-[360px] space-y-2 overflow-auto pr-1">{currentSlides.length ? currentSlides.map((slide, index) => <button key={slide.id || slide.path} onClick={() => goToSlide(index)} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${index === currentSlide ? "text-white shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`} style={index === currentSlide ? { backgroundColor: theme.deep, borderColor: theme.deep } : undefined}><span className="truncate font-semibold">{index + 1}. {slide.name}</span>{notes[index]?.trim() ? <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: index === currentSlide ? "rgba(255,255,255,0.18)" : theme.gold, color: index === currentSlide ? "white" : theme.deep }}>note</span> : null}</button>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Slides will appear here after choosing a Sunday.</p>}</div></div></BrandCard></aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SermonNotesApp() {
  return (
    <AppErrorBoundary>
      <SermonNotesAppInner />
    </AppErrorBoundary>
  );
}
