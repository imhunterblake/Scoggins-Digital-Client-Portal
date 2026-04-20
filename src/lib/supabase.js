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
      auth: { autoRefreshToken: false, persistSession: false },
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
    .single();
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
