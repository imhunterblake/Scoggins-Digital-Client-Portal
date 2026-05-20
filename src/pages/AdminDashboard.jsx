import { useEffect, useState } from "react";
import {
  getAllProjects,
  updateProject,
  updateMilestone,
  submitFeedback,
  getFeedback,
  getAllReferrals,
  updateReferralStatus,
  supabase,
  supabaseAdmin,
  signOut,
} from "../lib/supabase";
import {
  StatusBadge,
  ProgressBar,
  EmptyState,
  Modal,
  formatDate,
  timeAgo,
  Logo,
} from "../components/UI";
import { STATUS_CONFIG } from "../components/UI";

// ── ADMIN SIDEBAR ─────────────────────────────────────────────
function AdminSidebar({ active, setActive, projectCount, onSignOut }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { id: "clients", icon: "👥", label: "All Clients", badge: projectCount },
    { id: "new", icon: "+", label: "New Client", badge: null },
    { id: "referrals", icon: "🤝", label: "Referrals", badge: null },
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
              Admin Panel
            </p>
            <p className="font-mono text-brand-cyan/50 text-xs">
              Hunter Scoggins
            </p>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/30 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-display transition-all
              ${
                active === item.id ?
                  "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20"
                : "text-white/40 hover:text-white hover:bg-white/3"
              }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="bg-brand-cyan/20 text-brand-cyan font-mono text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <a
          href="https://scoggins.digital"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-white/20 hover:text-white/50 transition-colors"
        >
          ↗ scoggins.digital
        </a>
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
          .admin-desktop-sidebar { display: none !important; }
          .admin-mobile-topbar { display: flex !important; }
          .admin-main { padding: 64px 16px 16px !important; }
          .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .client-card-right { display: none !important; }
          .client-card { padding: 12px !important; }
        }
        .admin-mobile-topbar { display: none; }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="admin-desktop-sidebar w-56 flex-shrink-0 flex flex-col border-r border-white/5 bg-brand-darker/50">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div
        className="admin-mobile-topbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#08080f",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={28} />
          <p className="font-display font-semibold text-white text-sm">
            Admin Panel
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
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
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
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// ── PROJECT DETAIL PANEL ──────────────────────────────────────
function ProjectDetail({ project, onClose, onUpdate }) {
  const [form, setForm] = useState({
    status: project.status,
    progress: project.progress || 0,
    est_completion: project.est_completion || "",
    kickoff_date: project.kickoff_date || "",
    deposit_received: project.deposit_received || false,
    final_payment_received: project.final_payment_received || false,
  });
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [feedback, setFeedback] = useState([]);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("overview");
  const assets = project.assets || [];

  useEffect(() => {
    getFeedback(project.id).then(({ data }) => setFeedback(data || []));
  }, [project.id]);

  async function handleSave() {
    setSaving(true);
    const { data } = await updateProject(project.id, form);
    if (data) onUpdate(data);
    if (form.first_name || form.last_name || form.business_name) {
      await supabaseAdmin
        .from("profiles")
        .update({
          first_name: form.first_name || project.profiles?.first_name,
          last_name: form.last_name || project.profiles?.last_name,
          business_name: form.business_name || project.profiles?.business_name,
        })
        .eq("id", project.client_id);
    }
    setSaving(false);
  }

  async function toggleMilestone(m) {
    const updates = {
      completed: !m.completed,
      completed_at: !m.completed ? new Date().toISOString() : null,
    };
    const { data } = await updateMilestone(m.id, updates);
    if (data)
      setMilestones((prev) => prev.map((x) => (x.id === m.id ? data : x)));
  }

  async function sendReply() {
    if (!reply.trim()) return;
    const { data } = await submitFeedback(project.id, reply.trim(), true);
    if (data) {
      setFeedback((prev) => [...prev, data]);
      setReply("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative h-full bg-brand-dark border-l border-white/5 flex flex-col animate-slide-up overflow-hidden"
        style={{ width: "100%", maxWidth: "min(640px, 100vw)" }}
      >
        <div className="p-4 md:p-6 border-b border-white/5 bg-brand-darker/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-brand-cyan/50 text-xs mb-1">
                {project.profiles?.business_name}
              </p>
              <h2 className="font-display font-bold text-white text-lg md:text-xl">
                {project.name}
              </h2>
              <p className="text-white/40 text-xs md:text-sm font-display mt-0.5">
                {project.profiles?.first_name} {project.profiles?.last_name} ·{" "}
                {project.profiles?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white text-2xl transition-colors mt-1"
            >
              ×
            </button>
          </div>
          <div className="flex gap-1.5 mt-4 overflow-x-auto">
            {["overview", "milestones", "assets", "feedback"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all capitalize whitespace-nowrap
                  ${tab === t ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20" : "text-white/30 hover:text-white/60"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Progress (%)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        progress: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Kickoff Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.kickoff_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, kickoff_date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Est. Completion</label>
                  <input
                    className="input"
                    type="date"
                    value={form.est_completion}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, est_completion: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <input
                    className="input"
                    defaultValue={project.profiles?.first_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, first_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    className="input"
                    defaultValue={project.profiles?.last_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, last_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Business Name</label>
                  <input
                    className="input"
                    defaultValue={project.profiles?.business_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, business_name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Total Price ($)</label>
                  <input
                    className="input"
                    type="number"
                    defaultValue={project.total_price}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { key: "deposit_received", label: "Deposit Received" },
                  {
                    key: "final_payment_received",
                    label: "Final Payment Received",
                  },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.checked }))
                      }
                      className="w-4 h-4 rounded border-white/20 bg-brand-navy"
                    />
                    <span className="text-sm font-display text-white/70">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      `Delete ${project.profiles?.first_name} ${project.profiles?.last_name}? This cannot be undone.`,
                    )
                  )
                    return;
                  await supabaseAdmin
                    .from("milestones")
                    .delete()
                    .eq("project_id", project.id);
                  await supabaseAdmin
                    .from("assets")
                    .delete()
                    .eq("project_id", project.id);
                  await supabaseAdmin
                    .from("feedback")
                    .delete()
                    .eq("project_id", project.id);
                  await supabaseAdmin
                    .from("projects")
                    .delete()
                    .eq("id", project.id);
                  await supabaseAdmin
                    .from("profiles")
                    .delete()
                    .eq("id", project.client_id);
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-2 rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 text-sm font-display transition-colors"
              >
                Delete Client & Project
              </button>
            </div>
          )}

          {tab === "milestones" && (
            <div className="space-y-3">
              {milestones.length === 0 ?
                <p className="text-white/30 text-sm font-display">
                  No milestones added yet.
                </p>
              : milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all ${m.completed ? "bg-brand-cyan/5 border-brand-cyan/15" : "bg-brand-navy/40 border-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleMilestone(m)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all flex-shrink-0 ${m.completed ? "bg-brand-cyan border-brand-cyan text-brand-darker font-bold" : "border-white/20"}`}
                      >
                        {m.completed ? "✓" : ""}
                      </button>
                      <span
                        className={`font-display text-sm ${m.completed ? "text-white" : "text-white/60"}`}
                      >
                        {m.label}
                      </span>
                    </div>
                    {m.completed_at && (
                      <span className="font-mono text-xs text-brand-cyan/40 flex-shrink-0 ml-2">
                        {formatDate(m.completed_at)}
                      </span>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {tab === "assets" && (
            <div className="space-y-3">
              {assets.length === 0 ?
                <EmptyState
                  icon="📁"
                  title="No assets uploaded yet"
                  sub="The client hasn't uploaded any files yet."
                />
              : assets.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-brand-navy/40 border border-white/5"
                  >
                    <span className="text-lg flex-shrink-0">
                      {a.type === "video_url" ?
                        "🎬"
                      : a.type === "logo" ?
                        "🎨"
                      : "📸"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white truncate">
                        {a.name}
                      </p>
                      <p className="font-mono text-xs text-white/30 capitalize">
                        {a.type} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0"
                    >
                      {a.type === "video_url" ? "Open" : "↓"}
                    </a>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "feedback" && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {feedback.length === 0 ?
                  <EmptyState
                    icon="💬"
                    title="No feedback yet"
                    sub="The client hasn't left any feedback."
                  />
                : feedback.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border ${msg.from_admin ? "bg-brand-cyan/5 border-brand-cyan/15 ml-4" : "bg-brand-navy/40 border-white/5 mr-4"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-mono text-xs ${msg.from_admin ? "text-brand-cyan" : "text-white/30"}`}
                        >
                          {msg.from_admin ?
                            "You (Hunter)"
                          : project.profiles?.first_name || "Client"}
                        </span>
                        <span className="font-mono text-xs text-white/20">
                          {timeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="font-display text-sm text-white/80">
                        {msg.message}
                      </p>
                    </div>
                  ))
                }
              </div>
              <div className="flex gap-3">
                <textarea
                  className="input flex-1 resize-none h-20"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply to client..."
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim()}
                  className="btn-primary px-4"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NEW CLIENT FORM ────────────────────────────────────────────
function NewClientForm({ onCreated }) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    businessName: "",
    projectName: "",
    projectType: "",
    totalPrice: "",
    timelineDays: "30",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setDone(false);
    setError("");
    setForm({
      email: "",
      firstName: "",
      lastName: "",
      businessName: "",
      projectName: "",
      projectType: "",
      totalPrice: "",
      timelineDays: "30",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let userId = null,
        emailSent = true;
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          form.email.trim().toLowerCase(),
          {
            data: { first_name: form.firstName, last_name: form.lastName },
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        );
      if (inviteError) {
        const isRateLimit =
          inviteError.status === 429 ||
          inviteError.message?.toLowerCase().includes("rate") ||
          inviteError.message?.toLowerCase().includes("too many");
        if (isRateLimit) {
          emailSent = false;
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find(
            (u) => u.email === form.email.trim().toLowerCase(),
          );
          if (existingUser) {
            userId = existingUser.id;
          } else {
            throw new Error("EMAIL_RATE_LIMIT");
          }
        } else {
          throw inviteError;
        }
      } else {
        userId = inviteData.user?.id;
      }

      if (!userId) throw new Error("No user ID returned from invite");

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        email: form.email.trim().toLowerCase(),
        role: "client",
        first_name: form.firstName,
        last_name: form.lastName,
        business_name: form.businessName,
      });

      const kickoff = new Date(),
        estCompletion = new Date();
      estCompletion.setDate(
        kickoff.getDate() + parseInt(form.timelineDays || 30),
      );
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from("projects")
        .insert({
          client_id: userId,
          name: form.projectName || `${form.businessName} Website`,
          project_type: form.projectType,
          status: "awaiting_contract",
          progress: 0,
          total_price: parseFloat(form.totalPrice) || null,
          kickoff_date: kickoff.toISOString().slice(0, 10),
          est_completion: estCompletion.toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (projectError) throw projectError;

      await supabaseAdmin.from("milestones").insert(
        [
          "Contract Signed",
          "Deposit Received",
          "Assets Collected (logo, photos, video)",
          "Build Phase Begins",
          "Client Review Round 1",
          "Revisions Complete",
          "Final Approval",
          "Final Payment Received",
          "Site Launched",
        ].map((label, i) => ({
          project_id: projectData.id,
          label,
          sort_order: i,
          completed: false,
        })),
      );

      onCreated({
        ...projectData,
        profiles: {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          business_name: form.businessName,
        },
      });
      if (!emailSent) {
        setError(
          "Client account created but invite email could not be sent due to rate limiting. Try again in 1 hour.",
        );
        setSaving(false);
        return;
      }
      setDone(true);
    } catch (err) {
      if (err.message === "EMAIL_RATE_LIMIT")
        setError(
          "Supabase email rate limit reached. Please wait about 1 hour and try again.",
        );
      else if (
        err.message?.includes("already been registered") ||
        err.message?.includes("already exists")
      )
        setError(`${form.email} already has a portal account.`);
      else setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done)
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✉️</span>
        </div>
        <h2 className="font-display font-bold text-white text-xl mb-2">
          Client Added!
        </h2>
        <p className="text-white/40 text-sm font-display mb-2">
          A magic link has been sent to
        </p>
        <p className="font-mono text-brand-cyan bg-brand-cyan/10 px-4 py-2 rounded-xl border border-brand-cyan/20 mb-6">
          {form.email}
        </p>
        <button onClick={reset} className="btn-ghost">
          + Add Another Client
        </button>
      </div>
    );

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-display font-bold text-2xl text-white mb-1">
        New Client
      </h1>
      <p className="text-white/40 text-sm font-display mb-6">
        Fill in their details — they'll receive a magic link invite
        automatically.
      </p>
      <form onSubmit={handleSubmit} className="card p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name</label>
            <input
              className="input"
              required
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              className="input"
              required
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="client@email.com"
          />
        </div>
        <div>
          <label className="label">Business Name</label>
          <input
            className="input"
            required
            value={form.businessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessName: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="label">Project Name</label>
          <input
            className="input"
            required
            value={form.projectName}
            onChange={(e) =>
              setForm((f) => ({ ...f, projectName: e.target.value }))
            }
            placeholder="Gem State Website"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Project Type</label>
            <input
              className="input"
              value={form.projectType}
              onChange={(e) =>
                setForm((f) => ({ ...f, projectType: e.target.value }))
              }
              placeholder="Small Business Website"
            />
          </div>
          <div>
            <label className="label">Total Price ($)</label>
            <input
              className="input"
              type="number"
              value={form.totalPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, totalPrice: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <label className="label">Timeline (Business Days)</label>
          <input
            className="input"
            type="number"
            value={form.timelineDays}
            onChange={(e) =>
              setForm((f) => ({ ...f, timelineDays: e.target.value }))
            }
          />
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-300 text-sm font-display">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3"
        >
          {saving ?
            "Creating & Sending Invite..."
          : "Create Client & Send Invite →"}
        </button>
      </form>
    </div>
  );
}

// ── REFERRALS TAB ─────────────────────────────────────────────
const STATUS_OPTIONS = ["pending", "contacted", "converted", "declined"];
const STATUS_STYLES = {
  pending: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
  contacted: "bg-blue-400/15   text-blue-300   border-blue-400/25",
  converted: "bg-green-400/15  text-green-400  border-green-500/25",
  declined: "bg-white/5       text-white/25   border-white/10",
};

function ReferralsTab() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error: err } = await getAllReferrals();
    if (err) setError(err.message || "Failed to load referrals");
    else setReferrals(data || []);
    setLoading(false);
  }

  async function handleStatus(referralId, newStatus) {
    setUpdating(referralId);
    const { error: err } = await updateReferralStatus(referralId, newStatus);
    if (!err) {
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === referralId ?
            {
              ...r,
              status: newStatus,
              credit_applied:
                newStatus === "converted" ? true : r.credit_applied,
            }
          : r,
        ),
      );
    }
    setUpdating(null);
  }

  const filtered =
    filter === "all" ? referrals : referrals.filter((r) => r.status === filter);
  const pending = referrals.filter((r) => r.status === "pending").length;
  const converted = referrals.filter((r) => r.status === "converted").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Referrals
        </h1>
        <p className="text-white/40 text-sm font-display">
          Submitted by clients through the portal.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Referrals",
            value: referrals.length,
            color: "text-brand-cyan",
          },
          {
            label: "Awaiting Action",
            value: pending,
            color: "text-yellow-300",
          },
          { label: "Converted", value: converted, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`font-display font-bold text-2xl ${s.color}`}>
              {s.value}
            </p>
            <p className="label mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {[
          { id: "all", label: `All (${referrals.length})` },
          { id: "pending", label: `Pending (${pending})` },
          { id: "contacted", label: "Contacted" },
          { id: "converted", label: `Converted (${converted})` },
          { id: "declined", label: "Declined" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all
              ${
                filter === f.id ?
                  "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25"
                : "text-white/30 border-white/8 hover:text-white hover:border-white/20"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {error ?
        <div className="card p-4 border-red-400/20 bg-red-400/5">
          <p className="text-red-300 text-sm font-display">{error}</p>
          <button onClick={load} className="btn-ghost text-xs mt-2">
            Retry
          </button>
        </div>
      : loading ?
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      : filtered.length === 0 ?
        <EmptyState
          icon="🤝"
          title="No referrals yet"
          sub="Once clients submit referrals through the portal they'll appear here."
        />
      : <div className="space-y-3">
          {filtered.map((r) => {
            const ref = r.profiles;
            const refName =
              ref ?
                `${ref.first_name || ""} ${ref.last_name || ""}`.trim() ||
                ref.business_name ||
                "Unknown"
              : "Unknown Client";

            return (
              <div key={r.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-white text-sm">
                        {r.business_name}
                      </p>
                      {r.credit_applied && (
                        <span className="text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                          🎁 Credit Applied
                        </span>
                      )}
                    </div>
                    <p className="text-white/35 text-xs font-mono mt-0.5">
                      Referred by:{" "}
                      <span className="text-white/60">{refName}</span>
                      {" · "}Submitted {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Status selector */}
                  <select
                    value={r.status}
                    onChange={(e) => handleStatus(r.id, e.target.value)}
                    disabled={updating === r.id}
                    className={`text-xs font-mono px-3 py-1.5 rounded-lg border bg-transparent
                      cursor-pointer outline-none appearance-none transition-all flex-shrink-0
                      ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}
                      ${updating === r.id ? "opacity-50" : "hover:opacity-80"}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option
                        key={o}
                        value={o}
                        className="bg-gray-900 text-white capitalize"
                      >
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact info */}
                <div className="flex items-center gap-4 text-xs font-mono text-white/35 flex-wrap">
                  {r.contact_name && <span>👤 {r.contact_name}</span>}
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      className="hover:text-brand-cyan transition-colors"
                    >
                      ✉️ {r.email}
                    </a>
                  )}
                  {r.phone && <span>📞 {r.phone}</span>}
                  {r.converted_at && (
                    <span className="text-green-400">
                      ✓ Converted {formatDate(r.converted_at)}
                    </span>
                  )}
                </div>

                {r.notes && (
                  <p className="text-white/40 text-xs font-display bg-white/3 border border-white/5 rounded-lg px-3 py-2">
                    {r.notes}
                  </p>
                )}

                {r.status === "converted" && r.credit_applied && (
                  <p className="text-xs font-display text-green-400 border-t border-white/5 pt-2">
                    ✓ Free maintenance month credited to {refName}'s account
                  </p>
                )}
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ── ADMIN DASHBOARD ROOT ──────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState("clients");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAllProjects().then(({ data }) => {
      setProjects(data || []);
      setLoading(false);
    });
  }, []);

  function handleUpdate(updated) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
  }

  function handleCreated(newProject) {
    setProjects((prev) => [newProject, ...prev]);
    setTab("clients");
  }

  async function handleSignOut() {
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  }

  const totalRevenue = projects.reduce(
    (s, p) => s + (parseFloat(p.total_price) || 0),
    0,
  );
  const active = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-brand-dark grid-bg flex">
      <AdminSidebar
        active={tab}
        setActive={setTab}
        projectCount={projects.length}
        onSignOut={handleSignOut}
      />

      <main className="admin-main flex-1 p-8 overflow-y-auto">
        {tab === "new" && <NewClientForm onCreated={handleCreated} />}
        {tab === "referrals" && <ReferralsTab />}

        {tab === "clients" && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h1 className="font-display font-bold text-2xl text-white mb-1">
                All Clients
              </h1>
              <p className="text-white/40 text-sm font-display">
                Click any client to manage their project.
              </p>
            </div>

            <div className="admin-stats-grid grid grid-cols-3 gap-3">
              {[
                { label: "Total Projects", value: projects.length },
                { label: "Active Builds", value: active },
                {
                  label: "Total Revenue",
                  value: `$${totalRevenue.toLocaleString()}`,
                },
              ].map((s) => (
                <div key={s.label} className="card p-4">
                  <p className="label">{s.label}</p>
                  <p className="font-display font-bold text-white text-xl md:text-2xl">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {loading ?
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-2xl" />
                ))}
              </div>
            : projects.length === 0 ?
              <EmptyState
                icon="👥"
                title="No clients yet"
                sub="Add your first client using the New Client button."
                action={
                  <button
                    onClick={() => setTab("new")}
                    className="btn-primary mt-2"
                  >
                    + Add First Client
                  </button>
                }
              />
            : <div className="space-y-3">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="client-card w-full card p-5 flex items-center gap-4 hover:border-brand-cyan/20 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono font-bold text-brand-cyan text-sm">
                        {p.profiles?.first_name?.[0] || "?"}
                        {p.profiles?.last_name?.[0] || ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-white text-sm">
                        {p.profiles?.business_name || "Unknown"}
                      </p>
                      <p className="text-white/30 text-xs font-mono truncate">
                        {p.profiles?.first_name} {p.profiles?.last_name} ·{" "}
                        {p.profiles?.email}
                      </p>
                    </div>
                    <div className="client-card-right flex items-center gap-4">
                      <div className="w-28">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-mono text-white/20">
                            Progress
                          </span>
                          <span className="text-xs font-mono text-brand-cyan/60">
                            {p.progress || 0}%
                          </span>
                        </div>
                        <ProgressBar value={p.progress || 0} />
                      </div>
                      <StatusBadge status={p.status} />
                      <span className="font-mono text-brand-cyan text-sm font-bold">
                        ${parseFloat(p.total_price || 0).toLocaleString()}
                      </span>
                    </div>
                    {/* Mobile: just show status badge */}
                    <style>{`@media (max-width: 767px) { .client-card-right { display: none !important; } .client-card-mobile-status { display: flex !important; } }`}</style>
                    <div className="client-card-mobile-status hidden flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      <span className="font-mono text-brand-cyan text-xs font-bold">
                        ${parseFloat(p.total_price || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            }
          </div>
        )}
      </main>

      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
