# Scoggins Digital — Client Portal Setup Guide

## Overview
A full-stack client portal where clients log in via magic link, track their project, upload assets, and leave feedback. You manage everything from the admin panel.

**Stack:** React + Tailwind (frontend) · Supabase (auth + database + storage) · Vercel (hosting)

---

## Step 1 — Create Your Supabase Project (Free)

1. Go to **supabase.com** and create a free account
2. Click "New Project"
3. Name: `scoggins-digital-portal`
4. Database password: save this somewhere safe
5. Region: US East (closest to Oxford, MS)
6. Wait ~2 minutes for setup

---

## Step 2 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"
3. Open `supabase_schema.sql` from this folder
4. Copy the entire contents and paste into the SQL editor
5. Click **Run**
6. You should see "Success. No rows returned."

---

## Step 3 — Create Storage Bucket

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click "New bucket"
3. Name: `client-assets`
4. Toggle **Public bucket** to ON
5. Click "Create bucket"

---

## Step 4 — Get Your API Keys

1. In Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** (looks like: `https://abcdefghij.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 5 — Configure Environment Variables

Create a file called `.env` in this project folder:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual values from Step 4.

---

## Step 6 — Run Locally

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

---

## Step 7 — Make Yourself Admin

1. Go to `http://localhost:5173/login`
2. Enter `hunter@scoggins.digital` and click "Send Login Link"
3. Check your email and click the magic link
4. You'll be redirected to the portal (as a regular client for now)
5. Go back to Supabase → **SQL Editor** and run:
   ```sql
   update public.profiles 
   set role = 'admin', first_name = 'Hunter', last_name = 'Scoggins'
   where email = 'hunter@scoggins.digital';
   ```
6. Sign out and sign back in — you'll now see the Admin Dashboard at `/admin`

---

## Step 8 — Deploy to Vercel

```bash
# Build the project
npm run build

# Install Vercel CLI (first time only)
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: scoggins-digital-portal
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

When prompted for environment variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Step 9 — Set Up portal.scoggins.digital Subdomain

1. In Vercel, go to your portal project → **Settings** → **Domains**
2. Add `portal.scoggins.digital`
3. Vercel will give you DNS records to add
4. Log into **Porkbun** (where scoggins.digital lives)
5. Go to your domain → DNS records
6. Add the CNAME record Vercel provides
7. Wait 5-15 minutes for propagation
8. Portal is now live at `portal.scoggins.digital` 🎉

---

## Step 10 — Update Supabase Auth Settings

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://portal.scoggins.digital`
3. Add to **Redirect URLs**: `https://portal.scoggins.digital/auth/callback`
4. This ensures magic links redirect to your live portal

---

## How to Add a New Client

1. Go to `/admin` and click **New Client** in the sidebar
2. Fill in their details and click "Create Client & Send Invite"
3. Supabase sends them an email with a magic link
4. When they click it, their portal is ready
5. Go to **All Clients**, click their name, and set up their project details

---

## Default Milestones to Add for Each Project

In the admin panel, after creating a project, add these milestones in order:

1. Contract Signed
2. Deposit Received
3. Assets Collected (logo, photos, video)
4. Build Phase Begins
5. Client Review Round 1
6. Revisions Complete
7. Final Approval
8. Final Payment Received
9. Site Launched

---

## Project Status Flow

```
awaiting_contract 
  → awaiting_deposit 
    → awaiting_assets 
      → in_progress 
        → in_review 
          → revisions (if needed)
            → final_approval 
              → awaiting_final_payment 
                → launching 
                  → complete
```

---

## File Structure

```
client-portal/
├── src/
│   ├── lib/
│   │   └── supabase.js          ← All database calls
│   ├── hooks/
│   │   └── useAuth.jsx          ← Auth context
│   ├── components/
│   │   └── UI.jsx               ← Shared components
│   ├── pages/
│   │   ├── LoginPage.jsx        ← Magic link login
│   │   ├── AuthCallback.jsx     ← Handles magic link redirect
│   │   ├── ClientDashboard.jsx  ← What clients see
│   │   └── AdminDashboard.jsx   ← What you see
│   ├── App.jsx                  ← Router
│   └── main.jsx                 ← Entry point
├── supabase_schema.sql          ← Run this in Supabase
├── .env                         ← Your API keys (create this)
└── SETUP.md                     ← This file
```

---

## Telling Clients About the Portal

Once a client's project is set up, send them this blurb in your kickoff email:

> "I've set up your project portal at portal.scoggins.digital — just click the link I'm sending to your email and you'll be logged in automatically. No password needed! From there you can track your project progress, upload your logo and photos, and leave any feedback or questions directly."

---

## Questions?
hunter@scoggins.digital · scoggins.digital
