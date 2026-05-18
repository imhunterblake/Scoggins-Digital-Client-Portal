import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getClientProject,
  submitFeedback,
  getFeedback,
  uploadAsset,
  addVideoUrl,
  signOut,
  supabase,
} from "../lib/supabase";
import {
  StatusBadge,
  ProgressBar,
  EmptyState,
  Modal,
  formatBytes,
  formatDate,
  timeAgo,
  Logo,
} from "../components/UI";
import ReferralTab from "./ReferralTab";

// ── SIDEBAR ────────────────────────────────────────────────────
function Sidebar({ active, setActive, onSignOut }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "assets", icon: "📁", label: "My Assets" },
    { id: "feedback", icon: "💬", label: "Feedback" },
    { id: "timeline", icon: "📋", label: "Timeline" },
    { id: "refer", icon: "🎁", label: "Refer a Friend" },
  ];

  function handleNav(id) {
    setActive(id);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={34} />
          <div>
            <p className="font-display font-semibold text-white text-sm">
              Client Portal
            </p>
            <p className="font-mono text-white/30 text-xs">Scoggins Digital</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          style={{ display: "none" }}
          className="close-btn text-white/30 hover:text-white text-2xl leading-none"
        >
          ×
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display transition-all
              ${
                active === item.id ?
                  "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20"
                : "text-white/40 hover:text-white hover:bg-white/3"
              }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/30 hover:text-white/60 transition-colors"
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-drawer-overlay { display: flex !important; }
          .close-btn { display: block !important; }
          .main-content { padding-top: 56px !important; }
        }
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-topbar { display: none !important; }
          .mobile-drawer-overlay { display: none !important; }
        }
        .mobile-drawer-overlay { display: none; }
        .mobile-topbar { display: none; }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar w-56 flex-shrink-0 flex-col border-r border-white/5 bg-brand-darker/50">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div
        className="mobile-topbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--color-brand-darker, #08080f)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={28} />
          <p className="font-display font-semibold text-white text-sm">
            Client Portal
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            padding: 8,
          }}
          aria-label="Open menu"
        >
          <span
            style={{
              width: 20,
              height: 2,
              background: "rgba(255,255,255,0.6)",
              display: "block",
            }}
          />
          <span
            style={{
              width: 20,
              height: 2,
              background: "rgba(255,255,255,0.6)",
              display: "block",
            }}
          />
          <span
            style={{
              width: 20,
              height: 2,
              background: "rgba(255,255,255,0.6)",
              display: "block",
            }}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 256,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#08080f",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              position: "relative",
            }}
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size={34} />
                <div>
                  <p className="font-display font-semibold text-white text-sm">
                    Client Portal
                  </p>
                  <p className="font-mono text-white/30 text-xs">
                    Scoggins Digital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/30 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display transition-all
                    ${
                      active === item.id ?
                        "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20"
                      : "text-white/40 hover:text-white hover:bg-white/3"
                    }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-white/5">
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display text-white/30 hover:text-white/60 transition-colors"
              >
                <span>↩</span> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

// ── DASHBOARD TAB ─────────────────────────────────────────────
function DashboardTab({ project, profile }) {
  if (!project)
    return (
      <EmptyState
        icon="🚀"
        title="Project not set up yet"
        sub="Hunter will set up your project shortly after contract signing."
      />
    );

  const milestones = project.milestones || [];
  const completed = milestones.filter((m) => m.completed).length;
  const todos = [
    {
      id: "contract",
      label: "Sign contract",
      done:
        project?.milestones?.find((m) => m.label === "Contract Signed")
          ?.completed || false,
    },
    { id: "deposit", label: "Pay deposit", done: !!project.deposit_received },
    {
      id: "assets",
      label: "Upload logo, photos & video",
      done: (project.assets || []).length > 0,
    },
    { id: "review1", label: "Review Round 1", done: project.review_1_complete },
    { id: "review2", label: "Final approval", done: project.final_approved },
    {
      id: "payment",
      label: "Pay final balance",
      done: !!project.final_payment_received,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Welcome back, {profile?.first_name || "there"} 👋
        </h1>
        <p className="text-white/40 text-sm font-display">
          Here's where your project stands today.
        </p>
      </div>

      {/* Status strip — stacks on mobile */}
      <div className="card p-5">
        <style>{`
          @media (max-width: 767px) {
            .status-strip { flex-direction: column !important; gap: 16px !important; }
            .dash-grid { grid-template-columns: 1fr !important; }
            .timeline-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div className="status-strip flex items-center justify-between gap-6">
          <div>
            <p className="label">Project</p>
            <p className="font-display font-bold text-white">{project.name}</p>
          </div>
          <div>
            <p className="label">Status</p>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex-1" style={{ minWidth: 120 }}>
            <div className="flex items-center justify-between mb-2">
              <p className="label">Progress</p>
              <span className="font-mono text-brand-cyan text-xs">
                {project.progress || 0}%
              </span>
            </div>
            <ProgressBar value={project.progress || 0} />
          </div>
          <div>
            <p className="label">Est. Launch</p>
            <p className="font-display text-white text-sm">
              {formatDate(project.est_completion)}
            </p>
          </div>
        </div>
      </div>

      <div className="dash-grid grid grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">
              Milestones
            </h3>
            <span className="font-mono text-xs text-white/30">
              {completed}/{milestones.length}
            </span>
          </div>
          {milestones.length === 0 ?
            <p className="text-white/30 text-sm font-display">
              Milestones will appear here shortly.
            </p>
          : <div className="space-y-3">
              {milestones.map((m, i) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${!m.completed && i > 0 && !milestones[i - 1].completed ? "opacity-30" : ""}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs ${m.completed ? "bg-brand-cyan text-brand-darker" : "border-2 border-white/20"}`}
                  >
                    {m.completed ? "✓" : ""}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-display ${m.completed ? "text-white" : "text-white/60"}`}
                    >
                      {m.label}
                    </p>
                    {m.completed_at && (
                      <p className="text-xs font-mono text-white/25">
                        {formatDate(m.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">
            Your To-Do List
          </h3>
          <div className="space-y-3">
            {todos.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 ${item.done ? "opacity-50" : ""}`}
              >
                <div
                  className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs ${item.done ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border-2 border-white/20"}`}
                >
                  {item.done ? "✓" : ""}
                </div>
                <p
                  className={`text-sm font-display ${item.done ? "line-through text-white/30" : "text-white/80"}`}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 border-brand-cyan/10">
        <p className="text-sm font-display text-white/50 mb-1">
          Questions? Email Hunter directly:
        </p>
        <a
          href="mailto:hunter@scoggins.digital"
          className="font-mono text-brand-cyan text-sm hover:text-brand-cyan-glow transition-colors"
        >
          hunter@scoggins.digital
        </a>
      </div>
    </div>
  );
}

// ── ASSETS TAB ────────────────────────────────────────────────
function AssetsTab({ project }) {
  const [uploading, setUploading] = useState({ logo: false, photos: false });
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLabel, setVideoLabel] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [assets, setAssets] = useState(project?.assets || []);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const logoRef = useRef();
  const photosRef = useRef();

  async function handleUpload(e, type) {
    const files = Array.from(e.target.files);
    if (!files.length || !project) return;
    setUploading((u) => ({ ...u, [type]: true }));
    const newAssets = [];
    for (const file of files) {
      const { data, error } = await uploadAsset(project.id, file, type);
      if (!error && data) newAssets.push(data);
    }
    setPendingAssets((prev) => [...prev, ...newAssets]);
    setUploading((u) => ({ ...u, [type]: false }));
    e.target.value = "";
  }

  async function handleAddVideoUrl() {
    if (!videoUrl || !project) return;
    const { data, error } = await addVideoUrl(
      project.id,
      videoUrl,
      videoLabel || "Hero Video",
    );
    if (!error && data) {
      setAssets((prev) => [...prev, data]);
      setVideoUrl("");
      setVideoLabel("");
      setShowVideoModal(false);
    }
  }

  async function handleRemovePending(assetId) {
    setDeleting(assetId);
    const { error } = await supabase.from("assets").delete().eq("id", assetId);
    if (!error)
      setPendingAssets((prev) => prev.filter((a) => a.id !== assetId));
    setDeleting(null);
  }

  async function handleRemoveLive(assetId) {
    setDeleting(assetId);
    const { error } = await supabase.from("assets").delete().eq("id", assetId);
    if (!error) setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setDeleting(null);
  }

  function handleSubmitAssets() {
    setAssets((prev) => [...prev, ...pendingAssets]);
    setPendingAssets([]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const livePhotos = assets.filter((a) => a.type === "photos");
  const liveLogo = assets.filter((a) => a.type === "logo");
  const liveVideos = assets.filter((a) => a.type === "video_url");
  const pendingPhotos = pendingAssets.filter((a) => a.type === "photos");
  const pendingLogo = pendingAssets.filter((a) => a.type === "logo");

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media (max-width: 767px) { .assets-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          My Assets
        </h1>
        <p className="text-white/40 text-sm font-display">
          Upload your logo and photos below. Review them, remove any mistakes,
          then hit Submit when ready.
        </p>
      </div>

      <div className="assets-grid grid grid-cols-2 gap-4">
        {/* LOGO */}
        <div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*,.svg"
            className="hidden"
            onChange={(e) => handleUpload(e, "logo")}
          />
          <div
            onClick={() => logoRef.current?.click()}
            className="card p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all border-dashed text-center"
          >
            <span className="text-3xl">🎨</span>
            <div>
              <p className="font-display font-semibold text-white text-sm">
                Logo
              </p>
              <p className="text-white/30 text-xs">
                PNG, JPG, or SVG preferred
              </p>
            </div>
            <span className="btn-primary text-xs px-4 py-2">
              {uploading.logo ? "Uploading..." : "Upload Logo"}
            </span>
          </div>
          {pendingLogo.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-mono text-xs text-yellow-400/70 px-1">
                ⏳ Staged — not submitted yet
              </p>
              {pendingLogo.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/5 border border-yellow-400/20"
                >
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-cyan truncate flex-1"
                  >
                    {a.name}
                  </a>
                  <button
                    onClick={() => handleRemovePending(a.id)}
                    disabled={deleting === a.id}
                    className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                  >
                    {deleting === a.id ? "..." : "✕ Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {liveLogo.length > 0 && (
            <div className="mt-2 space-y-1">
              {liveLogo.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5"
                >
                  <span className="text-sm">🎨</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-cyan truncate flex-1"
                  >
                    {a.name}
                  </a>
                  <button
                    onClick={() => handleRemoveLive(a.id)}
                    disabled={deleting === a.id}
                    className="text-red-400/40 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                  >
                    {deleting === a.id ? "..." : "✕"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PHOTOS */}
        <div>
          <input
            ref={photosRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e, "photos")}
          />
          <div
            onClick={() => photosRef.current?.click()}
            className="card p-5 flex flex-col items-center gap-3 cursor-pointer hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all border-dashed text-center"
          >
            <span className="text-3xl">📸</span>
            <div>
              <p className="font-display font-semibold text-white text-sm">
                Photos
              </p>
              <p className="text-white/30 text-xs">
                Dog photos, kennel photos, action shots
              </p>
            </div>
            <span className="btn-primary text-xs px-4 py-2">
              {uploading.photos ? "Uploading..." : "Upload Photos"}
            </span>
          </div>
          {pendingPhotos.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-mono text-xs text-yellow-400/70 px-1">
                ⏳ Staged — not submitted yet
              </p>
              {pendingPhotos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/5 border border-yellow-400/20"
                >
                  <span className="text-sm">📸</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-cyan truncate flex-1"
                  >
                    {a.name}
                  </a>
                  <button
                    onClick={() => handleRemovePending(a.id)}
                    disabled={deleting === a.id}
                    className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                  >
                    {deleting === a.id ? "..." : "✕ Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {livePhotos.length > 0 && (
            <div className="mt-2 space-y-1">
              {livePhotos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5"
                >
                  <span className="text-sm">📸</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-cyan truncate flex-1"
                  >
                    {a.name}
                  </a>
                  <button
                    onClick={() => handleRemoveLive(a.id)}
                    disabled={deleting === a.id}
                    className="text-red-400/40 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                  >
                    {deleting === a.id ? "..." : "✕"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingAssets.length > 0 && (
        <div className="card p-4 border-brand-cyan/20 bg-brand-cyan/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display font-semibold text-white text-sm">
                {pendingAssets.length} file{pendingAssets.length > 1 ? "s" : ""}{" "}
                staged
              </p>
              <p className="text-white/40 text-xs font-display mt-0.5">
                Review above, remove any mistakes, then submit when ready.
              </p>
            </div>
            <button
              onClick={handleSubmitAssets}
              className="btn-primary px-5 py-2 text-sm flex-shrink-0"
            >
              ✓ Submit Assets
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="card p-4 border-green-500/20 bg-green-500/5 text-center">
          <p className="font-display text-green-400 text-sm">
            ✓ Assets submitted! Hunter will be notified.
          </p>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="font-display font-semibold text-white">
              Hero Video
            </h3>
            <p className="text-white/40 text-xs font-display mt-0.5">
              Paste your YouTube link once the video is uploaded
            </p>
          </div>
          <button
            onClick={() => setShowVideoModal(true)}
            className="btn-primary text-xs px-4 py-2 flex-shrink-0"
          >
            + Add YouTube Link
          </button>
        </div>
        {liveVideos.length > 0 ?
          <div className="space-y-2">
            {liveVideos.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
              >
                <span className="text-xl">🎬</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-white">{a.name}</p>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-cyan/60 hover:text-brand-cyan truncate block"
                  >
                    {a.url}
                  </a>
                </div>
                <button
                  onClick={() => handleRemoveLive(a.id)}
                  disabled={deleting === a.id}
                  className="text-red-400/40 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                >
                  {deleting === a.id ? "..." : "✕"}
                </button>
              </div>
            ))}
          </div>
        : <p className="text-white/25 text-sm font-display">
            No video link added yet.
          </p>
        }
      </div>

      <Modal
        open={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title="Add YouTube Video Link"
      >
        <div className="space-y-4">
          <div>
            <label className="label">YouTube URL</label>
            <input
              className="input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <label className="label">Label (optional)</label>
            <input
              className="input"
              value={videoLabel}
              onChange={(e) => setVideoLabel(e.target.value)}
              placeholder="Hero Video"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowVideoModal(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVideoUrl}
              disabled={!videoUrl}
              className="btn-primary"
            >
              Save Link
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── FEEDBACK TAB ──────────────────────────────────────────────
function FeedbackTab({ project }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    if (!project) {
      setLoading(false);
      return;
    }
    loadFeedback();
    const sub = supabase
      .channel(`feedback:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedback",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new]),
      )
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [project?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadFeedback() {
    setLoading(true);
    const { data } = await getFeedback(project.id);
    setMessages(data || []);
    setLoading(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !project) return;
    setSending(true);
    await submitFeedback(project.id, input.trim(), false);
    setInput("");
    setSending(false);
  }

  if (!project)
    return (
      <EmptyState
        icon="💬"
        title="No project yet"
        sub="Feedback will be available once your project is set up."
      />
    );

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{ height: "calc(100vh - 120px)" }}
    >
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Feedback & Notes
        </h1>
        <p className="text-white/40 text-sm font-display">
          Leave consolidated feedback here. Hunter will respond and ask
          follow-up questions as needed.
        </p>
      </div>
      <div className="flex-1 card p-4 overflow-y-auto space-y-3 mb-4">
        {loading ?
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
          </div>
        : messages.length === 0 ?
          <EmptyState
            icon="💬"
            title="No messages yet"
            sub="Send your first message or feedback note below."
          />
        : messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from_admin ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 ${msg.from_admin ? "bg-brand-navy border border-brand-cyan/20 rounded-tl-sm" : "bg-brand-cyan/15 border border-brand-cyan/30 rounded-tr-sm"}`}
              >
                {msg.from_admin && (
                  <p className="font-mono text-brand-cyan text-xs mb-1">
                    Hunter · Scoggins Digital
                  </p>
                )}
                <p className="font-display text-sm text-white leading-relaxed">
                  {msg.message}
                </p>
                <p className="font-mono text-white/20 text-xs mt-1.5 text-right">
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        }
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-3">
        <textarea
          className="input flex-1 resize-none h-14 py-4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Type your feedback... (Enter to send)"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-primary px-5 h-14 flex-shrink-0"
        >
          {sending ? "..." : "→"}
        </button>
      </form>
    </div>
  );
}

// ── TIMELINE TAB ──────────────────────────────────────────────
function TimelineTab({ project }) {
  if (!project)
    return (
      <EmptyState
        icon="📋"
        title="No project yet"
        sub="Your timeline will appear here once your project is set up."
      />
    );

  const milestones = project.milestones || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media (max-width: 767px) { .timeline-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Project Timeline
        </h1>
        <p className="text-white/40 text-sm font-display">
          Every milestone from kickoff to launch.
        </p>
      </div>
      <div className="card p-6">
        {milestones.length === 0 ?
          <p className="text-white/30 text-sm font-display">
            Timeline milestones will appear here once your project kicks off.
          </p>
        : <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex gap-5 relative">
                  <div
                    className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center z-10 ${m.completed ? "bg-brand-cyan text-brand-darker font-bold" : "bg-brand-navy border-2 border-white/10 text-white/20"}`}
                  >
                    {m.completed ? "✓" : i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between">
                      <p
                        className={`font-display font-semibold text-sm ${m.completed ? "text-white" : "text-white/40"}`}
                      >
                        {m.label}
                      </p>
                      {m.completed_at && (
                        <p className="font-mono text-xs text-brand-cyan/50">
                          {formatDate(m.completed_at)}
                        </p>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-white/30 text-xs font-display mt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      </div>
      <div className="timeline-grid grid grid-cols-3 gap-4">
        {[
          { label: "Project Type", value: project.project_type || "—" },
          { label: "Kickoff Date", value: formatDate(project.kickoff_date) },
          {
            label: "Est. Completion",
            value: formatDate(project.est_completion),
          },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="label">{label}</p>
            <p className="font-display font-semibold text-white text-sm">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CLIENT DASHBOARD ROOT ─────────────────────────────────────
export default function ClientDashboard() {
  const { profile, session } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    getClientProject(session.user.id).then(({ data }) => {
      setProject(data);
      setLoading(false);
    });
  }, [session?.user?.id]);

  async function handleSignOut() {
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  }

  if (loading)
    return (
      <div className="min-h-screen bg-brand-dark grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-white/30 text-sm">
            Loading your portal...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-dark grid-bg flex">
      <Sidebar active={tab} setActive={setTab} onSignOut={handleSignOut} />
      <main className="main-content flex-1 p-8 overflow-y-auto">
        {tab === "dashboard" && (
          <DashboardTab project={project} profile={profile} />
        )}
        {tab === "assets" && <AssetsTab project={project} />}
        {tab === "feedback" && <FeedbackTab project={project} />}
        {tab === "timeline" && <TimelineTab project={project} />}
        {tab === "refer" && (
          <ReferralTab project={project} clientId={session?.user?.id} />
        )}
      </main>
    </div>
  );
}
