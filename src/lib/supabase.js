import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAdmin =
  SUPABASE_SERVICE_KEY ?
    createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: "sb-admin-auth", // ← unique key stops the conflict
      },
    })
  : supabase;

// ── AUTH ──────────────────────────────────────────────────────
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ── PROFILES ──────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return { data, error };
}

// ── PROJECTS ─────────────────────────────────────────────────
// Optimized: no feedback on initial load — fetch lazily in FeedbackTab
export async function getClientProject(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, milestones(*), assets(*)") // removed feedback(*) — load on demand
    .eq("client_id", userId)
    .order("created_at", { ascending: false, foreignTable: "milestones" })
    .single();
  return { data, error };
}

// Optimized: no milestones/assets/feedback on the list view — just what the card needs
export async function getAllProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, project_type, status, progress, total_price, kickoff_date, est_completion, deposit_received, final_payment_received, client_id, profiles(first_name, last_name, business_name, email)",
    )
    .order("created_at", { ascending: false });
  return { data, error };
}

// Load full project detail only when admin opens the slide panel
export async function getProjectDetail(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "*, profiles(first_name, last_name, business_name, email), milestones(*), assets(*)",
    )
    .eq("id", projectId)
    .single();
  return { data, error };
}

export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  return { data, error };
}

export async function createProject(projectData) {
  const { data, error } = await supabase
    .from("projects")
    .insert(projectData)
    .select()
    .single();
  return { data, error };
}

// ── MILESTONES ────────────────────────────────────────────────
export async function updateMilestone(milestoneId, updates) {
  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single();
  return { data, error };
}

// ── ASSETS ───────────────────────────────────────────────────
export async function uploadAsset(projectId, file, type) {
  const ext = file.name.split(".").pop();
  const path = `${projectId}/${type}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("client-assets")
    .upload(path, file);
  if (uploadError) return { error: uploadError };

  const {
    data: { publicUrl },
  } = supabase.storage.from("client-assets").getPublicUrl(path);

  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      type,
      name: file.name,
      url: publicUrl,
      size_bytes: file.size,
    })
    .select()
    .single();
  return { data, error };
}

export async function addVideoUrl(projectId, url, label) {
  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      type: "video_url",
      name: label || "Hero Video",
      url,
    })
    .select()
    .single();
  return { data, error };
}

// ── FEEDBACK ──────────────────────────────────────────────────
export async function submitFeedback(projectId, message, fromAdmin = false) {
  const { data, error } = await supabase
    .from("feedback")
    .insert({ project_id: projectId, message, from_admin: fromAdmin })
    .select()
    .single();
  return { data, error };
}

export async function getFeedback(projectId) {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return { data, error };
}

// ── INVITE ───────────────────────────────────────────────────
export async function inviteClient(email, projectData) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  return { data, error };
}

// ── REFERRAL FUNCTIONS ────

// Submit a new referral from the client portal
export async function submitReferral(projectId, clientId, formData) {
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referring_client_id: clientId,
      referring_project_id: projectId,
      business_name: formData.businessName,
      contact_name: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
      status: "pending",
    })
    .select()
    .single();
  return { data, error };
}

// Get all referrals made by a specific client
export async function getClientReferrals(clientId) {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referring_client_id", clientId)
    .order("created_at", { ascending: false });
  return { data, error };
}

// Get client's referral credit balance (from their profile)
export async function getReferralCredits(clientId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("referral_credits, referral_credits_used")
    .eq("id", clientId)
    .maybeSingle();
  return { data, error };
}

// ── ADMIN ONLY (use supabaseAdmin) ───────────────────────────

// Get all referrals across all clients (admin view)
export async function getAllReferrals() {
  const { data, error } = await supabaseAdmin
    .from("referrals")
    .select(
      `
      *,
      profiles!referring_client_id (
        first_name, last_name, business_name, email
      )
    `,
    )
    .order("created_at", { ascending: false });
  return { data, error };
}

// Update referral status — and auto-apply credit if converted
export async function updateReferralStatus(referralId, status) {
  const now = new Date().toISOString();
  const updates = { status };

  if (status === "contacted") updates.contacted_at = now;
  if (status === "converted") updates.converted_at = now;

  const { data, error } = await supabaseAdmin
    .from("referrals")
    .update(updates)
    .eq("id", referralId)
    .select()
    .single();

  if (error || !data) return { data, error };

  // Auto-apply credit when converted
  if (status === "converted" && !data.credit_applied) {
    // Increment the referring client's credit balance
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referral_credits")
      .eq("id", data.referring_client_id)
      .single();

    await supabaseAdmin
      .from("profiles")
      .update({
        referral_credits: (profile?.referral_credits || 0) + 1,
      })
      .eq("id", data.referring_client_id);

    // Mark credit as applied on the referral record
    await supabaseAdmin
      .from("referrals")
      .update({ credit_applied: true, credit_applied_at: now })
      .eq("id", referralId);
  }

  return { data, error };
}

// Mark a maintenance credit as used (when you apply the free month)
export async function useReferralCredit(clientId) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("referral_credits, referral_credits_used")
    .eq("id", clientId)
    .single();

  if (!profile || profile.referral_credits <= profile.referral_credits_used) {
    return { error: { message: "No credits available" } };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ referral_credits_used: (profile.referral_credits_used || 0) + 1 })
    .eq("id", clientId)
    .select()
    .single();

  return { data, error };
}
