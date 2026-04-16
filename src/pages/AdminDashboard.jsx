import { useEffect, useState } from "react";
import {
  getAllProjects,
  updateProject,
  updateMilestone,
  submitFeedback,
  getFeedback,
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
  const nav = [
    { id: "clients", icon: "👥", label: "All Clients", badge: projectCount },
    { id: "new", icon: "+", label: "New Client", badge: null },
  ];
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-white/5 bg-brand-darker/50">
      <div className="p-5 border-b border-white/5">
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
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
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
    </aside>
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
      <div className="relative w-full max-w-2xl h-full bg-brand-dark border-l border-white/5 flex flex-col animate-slide-up overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-brand-darker/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-brand-cyan/50 text-xs mb-1">
                {project.profiles?.business_name}
              </p>
              <h2 className="font-display font-bold text-white text-xl">
                {project.name}
              </h2>
              <p className="text-white/40 text-sm font-display mt-0.5">
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
          <div className="flex gap-2 mt-4">
            {["overview", "milestones", "assets", "feedback"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all capitalize
                  ${tab === t ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20" : "text-white/30 hover:text-white/60"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
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
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all
                  ${m.completed ? "bg-brand-cyan/5 border-brand-cyan/15" : "bg-brand-navy/40 border-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleMilestone(m)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all
                        ${m.completed ? "bg-brand-cyan border-brand-cyan text-brand-darker font-bold" : "border-white/20"}`}
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
                      <span className="font-mono text-xs text-brand-cyan/40">
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
                    <span className="text-lg">
                      {a.type === "video_url" ?
                        "🎬"
                      : a.type === "logo" ?
                        "🎨"
                      : "📸"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white">
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
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      {a.type === "video_url" ? "Open" : "↓ Download"}
                    </a>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "feedback" && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedback.length === 0 ?
                  <EmptyState
                    icon="💬"
                    title="No feedback yet"
                    sub="The client hasn't left any feedback."
                  />
                : feedback.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border ${
                        msg.from_admin ?
                          "bg-brand-cyan/5 border-brand-cyan/15 ml-8"
                        : "bg-brand-navy/40 border-white/5 mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
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

// ── NEW CLIENT FORM — REAL SUPABASE WIRING ────────────────────
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
      // ── STEP 1: Invite the user via Supabase Auth ──────────────
      // This sends them a magic link email automatically
      let userId = null;
      let emailSent = true;

      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          form.email.trim().toLowerCase(),
          {
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
            },
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        );

      if (inviteError) {
        const isRateLimit =
          inviteError.status === 429 ||
          inviteError.message?.toLowerCase().includes("rate") ||
          inviteError.message?.toLowerCase().includes("too many");

        if (isRateLimit) {
          // Rate limited — check if user already exists from a previous attempt
          emailSent = false;
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find(
            (u) => u.email === form.email.trim().toLowerCase(),
          );
          if (existingUser) {
            userId = existingUser.id;
          } else {
            // User doesn't exist yet — we can't create them without sending email
            // Store their details so we can invite them later
            throw new Error("EMAIL_RATE_LIMIT");
          }
        } else {
          throw inviteError;
        }
      } else {
        userId = inviteData.user?.id;
      }

      if (!userId) throw new Error("No user ID returned from invite");

      // ── STEP 2: Update their profile with full details ─────────
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email: form.email.trim().toLowerCase(),
          role: "client",
          first_name: form.firstName,
          last_name: form.lastName,
          business_name: form.businessName,
        });

      if (profileError && !profileError.message?.includes("duplicate"))
        throw profileError;

      // ── STEP 3: Create their project ───────────────────────────
      const kickoff = new Date();
      const estCompletion = new Date();
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

      // ── STEP 4: Add default milestones ─────────────────────────
      const defaultMilestones = [
        "Contract Signed",
        "Deposit Received",
        "Assets Collected (logo, photos, video)",
        "Build Phase Begins",
        "Client Review Round 1",
        "Revisions Complete",
        "Final Approval",
        "Final Payment Received",
        "Site Launched",
      ];

      await supabaseAdmin.from("milestones").insert(
        defaultMilestones.map((label, i) => ({
          project_id: projectData.id,
          label,
          sort_order: i,
          completed: false,
        })),
      );

      // ── SUCCESS ────────────────────────────────────────────────
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
        // Partial success — profile and project created but email not sent
        setError(
          "Client account and project created successfully, but the invite email could not be sent due to rate limiting. Go to your portal login page and send them a magic link manually once the rate limit clears (usually within 1 hour).",
        );
        setSaving(false);
        return;
      }
      setDone(true);
    } catch (err) {
      console.error("New client error:", err);
      if (err.message === "EMAIL_RATE_LIMIT") {
        setError(
          "Supabase email rate limit reached. The client account could not be created right now. Please wait about 1 hour and try again — Supabase limits invite emails on the free tier.",
        );
      } else if (
        err.message?.includes("already been registered") ||
        err.message?.includes("already exists")
      ) {
        setError(
          `${form.email} already has a portal account. They can log in directly at the portal.`,
        );
      } else if (
        err.message?.includes("not allowed") ||
        err.message?.includes("service_role")
      ) {
        setError(
          "Admin invite requires the VITE_SUPABASE_SERVICE_KEY in your .env file. Check the setup note above.",
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (done)
    return (
      <div className="text-center py-16 max-w-md mx-auto">
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
        <p className="text-white/30 text-xs font-display mb-6">
          Their project has been created with default milestones. You can manage
          it from the All Clients view.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-ghost">
            + Add Another Client
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-display font-bold text-2xl text-white mb-1">
        New Client
      </h1>
      <p className="text-white/40 text-sm font-display mb-6">
        Fill in their details — they'll receive a magic link email to access
        their portal automatically.
      </p>

      {/* Only show warning if service key is NOT configured */}
      {!import.meta.env.VITE_SUPABASE_SERVICE_KEY && (
        <div className="card p-4 border-yellow-400/20 bg-yellow-400/5 mb-5">
          <p className="font-mono text-yellow-300 text-xs uppercase tracking-widest mb-1">
            ⚠️ Setup Required
          </p>
          <p className="text-white/50 text-xs font-display leading-relaxed">
            The invite feature requires your Supabase{" "}
            <strong className="text-white">Service Role Key</strong> to be set
            in your <code className="font-mono text-brand-cyan">.env</code> file
            as{" "}
            <code className="font-mono text-brand-cyan">
              VITE_SUPABASE_SERVICE_KEY
            </code>
            . Find it in Supabase → Settings → API → service_role key.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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

  // ── FIX 2: Proper sign out that clears all auth state ─────────
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

      <main className="flex-1 p-8 overflow-y-auto">
        {tab === "new" && <NewClientForm onCreated={handleCreated} />}

        {tab === "clients" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-display font-bold text-2xl text-white mb-1">
                All Clients
              </h1>
              <p className="text-white/40 text-sm font-display">
                Click any client to manage their project.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Projects", value: projects.length },
                { label: "Active Builds", value: active },
                {
                  label: "Total Revenue",
                  value: `$${totalRevenue.toLocaleString()}`,
                },
              ].map((s) => (
                <div key={s.label} className="card p-5">
                  <p className="label">{s.label}</p>
                  <p className="font-display font-bold text-white text-2xl">
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
                    className="w-full card p-5 flex items-center gap-5 hover:border-brand-cyan/20 transition-all text-left"
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
                      <p className="text-white/30 text-xs font-mono">
                        {p.profiles?.first_name} {p.profiles?.last_name} ·{" "}
                        {p.profiles?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
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
                      <span className="text-white/20">→</span>
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
