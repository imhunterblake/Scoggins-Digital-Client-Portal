// ── REFERRAL TAB — src/pages/ReferralTab.jsx (Client Portal) ─
// New file — drop in src/pages/ or src/components/ alongside your other tabs

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { EmptyState, formatDate } from "../components/UI";

// Status config for referral badges
const STATUS = {
  pending: {
    label: "Pending",
    color: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
  },
  contacted: {
    label: "Contacted",
    color: "bg-blue-400/15   text-blue-300   border-blue-400/25",
  },
  converted: {
    label: "Converted",
    color: "bg-green-400/15  text-green-400  border-green-500/25",
  },
  declined: {
    label: "Declined",
    color: "bg-white/5       text-white/30   border-white/10",
  },
};

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export default function ReferralTab({ project, clientId }) {
  const [referrals, setReferrals] = useState([]);
  const [credits, setCredits] = useState({ earned: 0, used: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [insertError, setInsertError] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    loadData();
  }, [clientId]);

  async function loadData() {
    setLoading(true);
    // Load referrals
    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .eq("referring_client_id", clientId)
      .order("created_at", { ascending: false });

    // Load credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_credits, referral_credits_used")
      .eq("id", clientId)
      .maybeSingle();

    setReferrals(refs || []);
    setCredits({
      earned: profile?.referral_credits || 0,
      used: profile?.referral_credits_used || 0,
    });
    setLoading(false);
  }

  function validate() {
    const e = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.email.trim() && !form.phone.trim())
      e.contact = "Please provide an email or phone number";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.from("referrals").insert({
      referring_client_id: clientId,
      referring_project_id: project?.id || null,
      business_name: form.businessName.trim(),
      contact_name: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      status: "pending",
    });

    console.error(
      "Insert result:",
      JSON.stringify(error),
      "clientId:",
      clientId,
    );

    setSubmitting(false);

    if (!error) {
      setInsertError(null);
      setSubmitted(true);
      setForm({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        notes: "",
      });
      loadData();
      setTimeout(() => setSubmitted(false), 8000);
    } else {
      setInsertError(error?.message || error?.code || JSON.stringify(error));
    }
  }

  function updateForm(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field] || errors.contact) {
      setErrors((p) => ({ ...p, [field]: undefined, contact: undefined }));
    }
  }

  const availableCredits = credits.earned - credits.used;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Refer a Friend
        </h1>
        <p className="text-white/40 text-sm font-display">
          Know a business that needs a website? Send them our way and earn a
          free month of maintenance on us.
        </p>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="card p-5 border-brand-cyan/15 bg-brand-cyan/3">
        <h3 className="font-display font-semibold text-white mb-3">
          How the Referral Program Works
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: "📝",
              step: "1",
              title: "Submit a Referral",
              desc: "Tell us about a business you think could use a website. We'll take it from there.",
            },
            {
              icon: "🤝",
              step: "2",
              title: "We Reach Out",
              desc: "We'll contact them, give them a free consultation, and work to earn their business.",
            },
            {
              icon: "🎁",
              step: "3",
              title: "Earn Your Reward",
              desc: "If they become a client, you get one free month of website maintenance — automatically.",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-brand-cyan/15 border border-brand-cyan/25 flex items-center justify-center mx-auto mb-2 text-lg">
                {s.icon}
              </div>
              <p className="font-display font-semibold text-white text-sm mb-1">
                {s.title}
              </p>
              <p className="text-white/40 text-xs font-display leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── REWARDS STRIP ── */}
      {credits.earned > 0 && (
        <div className="card p-4 border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-display font-semibold text-white text-sm">
                  Your Referral Rewards
                </p>
                <p className="text-white/40 text-xs font-display mt-0.5">
                  {credits.used} month{credits.used !== 1 ? "s" : ""} used
                  {" · "}
                  {credits.earned} earned total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-2xl text-green-400">
                {availableCredits}
              </p>
              <p className="text-white/40 text-xs font-mono">
                {availableCredits === 1 ?
                  "month available"
                : "months available"}
              </p>
            </div>
          </div>
          {availableCredits > 0 && (
            <div className="mt-3 pt-3 border-t border-green-500/15">
              <p className="text-green-300 text-xs font-display">
                ✓ You have {availableCredits} free maintenance month
                {availableCredits !== 1 ? "s" : ""} ready to use. Just let us
                know when you'd like to apply it!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── THANK YOU CARD (shown after submit) ── */}
      {submitted && (
        <div className="card p-6 border-green-500/25 bg-green-500/5 text-center space-y-3">
          <div className="text-4xl">🙏</div>
          <h3 className="font-display font-bold text-white text-lg">
            Thank You!
          </h3>
          <p className="text-white/60 text-sm font-display leading-relaxed max-w-sm mx-auto">
            We've received your referral and will reach out to them soon. If
            they become a client, your free month of maintenance will be applied
            to your account automatically — we'll let you know when it happens!
          </p>
          <div className="pt-2">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-ghost text-sm"
            >
              Submit Another Referral
            </button>
          </div>
        </div>
      )}

      {/* ── REFERRAL FORM ── */}
      {!submitted && (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-4">
            Submit a Referral
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                Business Name <span className="text-brand-cyan">*</span>
              </label>
              <input
                className={`input ${errors.businessName ? "border-red-400/40" : ""}`}
                value={form.businessName}
                onChange={(e) => updateForm("businessName", e.target.value)}
                placeholder="Smith's Hardware"
              />
              {errors.businessName && (
                <p className="text-red-400 text-xs font-mono mt-1">
                  {errors.businessName}
                </p>
              )}
            </div>

            <div>
              <label className="label">Owner / Contact Name</label>
              <input
                className="input"
                value={form.contactName}
                onChange={(e) => updateForm("contactName", e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  className={`input ${errors.contact ? "border-red-400/40" : ""}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="john@smithshardware.com"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className={`input ${errors.contact ? "border-red-400/40" : ""}`}
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="(662) 555-0100"
                />
              </div>
            </div>
            {errors.contact && (
              <p className="text-red-400 text-xs font-mono -mt-2">
                {errors.contact}
              </p>
            )}

            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input resize-none h-20"
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                placeholder="Tell us anything helpful — what kind of business it is, whether they've mentioned needing a website, etc."
              />
            </div>

            {insertError && (
              <p className="text-red-400 text-xs font-mono p-2 bg-red-400/10 rounded-lg border border-red-400/20">
                ⚠ {insertError}
              </p>
            )}

            <div className="flex items-center justify-between pt-1"></div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-white/25 text-xs font-display">
                * Required field
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Submitting..." : "Submit Referral →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── REFERRAL HISTORY ── */}
      <div>
        <h3 className="font-display font-semibold text-white mb-3">
          Your Referrals
          {referrals.length > 0 && (
            <span className="ml-2 text-white/30 font-mono text-xs">
              ({referrals.length})
            </span>
          )}
        </h3>

        {loading ?
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
          </div>
        : referrals.length === 0 ?
          <EmptyState
            icon="🤝"
            title="No referrals yet"
            sub="Submit your first referral above — it only takes a minute."
          />
        : <div className="space-y-3">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display font-semibold text-white text-sm truncate">
                      {r.business_name}
                    </p>
                    {r.credit_applied && (
                      <span className="text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full flex-shrink-0">
                        🎁 Credit Earned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-white/30">
                    {r.contact_name && <span>{r.contact_name}</span>}
                    {r.contact_name && (r.email || r.phone) && <span>·</span>}
                    {r.email && <span>{r.email}</span>}
                    {r.phone && !r.email && <span>{r.phone}</span>}
                    <span>·</span>
                    <span>Submitted {formatDate(r.created_at)}</span>
                  </div>
                  {r.notes && (
                    <p className="text-white/25 text-xs font-display mt-1 truncate">
                      {r.notes}
                    </p>
                  )}
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
