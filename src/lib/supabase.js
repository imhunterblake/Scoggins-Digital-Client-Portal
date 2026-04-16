import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";
// Service role key — needed for admin.inviteUserByEmail
// Add to .env as VITE_SUPABASE_SERVICE_KEY (never commit to GitHub)
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

// Regular client — used for all client-side operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client — used only for server-side admin operations like inviting users
// Falls back to regular client if service key not set
export const supabaseAdmin =
  SUPABASE_SERVICE_KEY ?
    createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase;

// Auth helpers
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
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

// Profile helpers
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

// Project helpers
export async function getClientProject(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, milestones(*), assets(*), feedback(*)")
    .eq("client_id", userId)
    .single();
  return { data, error };
}

export async function getAllProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "*, profiles(first_name, last_name, business_name, email), milestones(*), assets(*)",
    )
    .order("created_at", { ascending: false });
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

// Milestones
export async function updateMilestone(milestoneId, updates) {
  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single();
  return { data, error };
}

// Assets
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

// Feedback
export async function submitFeedback(projectId, message, fromAdmin = false) {
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      project_id: projectId,
      message,
      from_admin: fromAdmin,
    })
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

// Invite a new client (admin only)
export async function inviteClient(email, projectData) {
  // Creates auth user via magic link + sets up their profile and project
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  return { data, error };
}
