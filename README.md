# Scoggins Digital — Client Portal

A full-stack, production-ready client portal for [Scoggins Digital](https://scoggins.digital), a freelance web design and development studio. Built with React, Supabase, and Tailwind CSS — hosted at [portal.scoggins.digital](https://portal.scoggins.digital).

The portal provides clients with a dedicated workspace to track their project's progress, upload brand assets, and communicate directly with the studio. Admins manage all client accounts, projects, milestones, and feedback from a single, unified dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Design System](#design-system)
- [Routing & Access Control](#routing--access-control)
- [Key Workflows](#key-workflows)

---

## Overview

The Scoggins Digital Client Portal eliminates friction between studio and client throughout the web project lifecycle. Instead of email threads and spreadsheets, every client gets a private, branded portal from day one.

**For clients:** A clean, minimal dashboard showing exactly where their project stands — what's done, what's next, what files are needed, and a direct line to communicate with the studio.

**For the admin (studio owner):** A full control panel to manage every client and project from one place — invite new clients, track milestones, manage payments, review assets, and respond to feedback threads.

---

## Features

### Client Portal

- **Project Dashboard** — At-a-glance view of project status, progress percentage, estimated launch date, and outstanding to-dos
- **Milestone Timeline** — Visual timeline of all project checkpoints with completion status
- **Asset Upload** — Drag-and-drop upload for logos, photos, and documents; add video URLs directly in the portal
- **Feedback & Messaging** — Real-time, threaded communication channel between client and admin with live updates via WebSocket subscriptions
- **Passwordless Login** — Magic link authentication — no password required, just an email address

### Admin Panel

- **Client Overview** — Summary table of all active and past projects with live status, progress, and price
- **Dashboard Stats** — Total projects, active builds, and cumulative revenue at a glance
- **New Client Onboarding** — Single form to create a new client account: auto-sends a magic link invite, creates a profile, initializes the project, and pre-populates default milestones
- **Project Management** — Slide-out detail panel with four tabs:
  - **Overview** — Edit status, progress, payment flags, and key dates
  - **Milestones** — Toggle individual milestone completion with timestamps
  - **Assets** — View and download all files the client has uploaded
  - **Feedback** — Full message thread with reply capability

### Security & Engineering

- **Row-Level Security (RLS)** — Supabase enforces per-user data access at the database level; clients can only see their own project data
- **Role-Based Access Control** — Admin and client roles are stored in the profiles table and enforced at the route level
- **Service Role Separation** — Admin operations (sending auth invites) use a server-side service role key that is never exposed to client sessions
- **Resilient Profile Loading** — Auto-retries profile fetching up to 3 times with delays to handle cold starts gracefully
- **Cross-Tab Auth Handling** — Magic link callbacks correctly handle both same-tab and email-client-opened-tab scenarios
- **Real-Time Subscriptions** — Supabase channel subscriptions push new feedback messages to both parties instantly without polling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 8 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Magic Link / OTP) |
| File Storage | Supabase Storage |
| Real-Time | Supabase Realtime (WebSockets) |
| Hosting | Vercel |
| Fonts | DM Sans, JetBrains Mono (Google Fonts) |

---

## Project Structure

```
Scoggins-Digital-Client-Portal/
├── public/                         # Static assets
├── src/
│   ├── lib/
│   │   └── supabase.js             # All database queries & Supabase client setup
│   ├── hooks/
│   │   └── useAuth.jsx             # Auth context: session, profile, loading state
│   ├── components/
│   │   └── UI.jsx                  # Shared UI components (Badge, Modal, Skeleton, etc.)
│   ├── pages/
│   │   ├── LoginPage.jsx           # Magic link login form
│   │   ├── AuthCallback.jsx        # Handles magic link redirect from email
│   │   ├── ClientDashboard.jsx     # Client-facing portal (4 tabs)
│   │   └── AdminDashboard.jsx      # Admin control panel (all clients & projects)
│   ├── App.jsx                     # Route definitions & protected route wrappers
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles, Tailwind directives, design tokens
├── supabase_schema.sql             # Full database schema with RLS policies
├── SETUP.md                        # Detailed first-time setup guide
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind theme extensions
├── postcss.config.js               # PostCSS configuration
├── index.html                      # HTML entry point
└── .env                            # Environment variables (not committed)
```

### Key Files

**[src/lib/supabase.js](src/lib/supabase.js)** — The single source of truth for all backend operations. Contains two Supabase client instances (anon key for client ops, service role key for admin invites) and all exported functions for auth, profiles, projects, milestones, assets, and feedback.

**[src/hooks/useAuth.jsx](src/hooks/useAuth.jsx)** — React context provider that manages session state, profile loading with retry logic, and auth event listeners. All pages consume this hook.

**[src/components/UI.jsx](src/components/UI.jsx)** — Shared presentational components: `StatusBadge`, `ProgressBar`, `EmptyState`, `Modal`, `Skeleton`, `Logo`, and formatting utilities (`formatBytes`, `formatDate`, `timeAgo`).

---

## Database Schema

The database consists of five tables, all protected by Row-Level Security.

### `profiles`
Stores user identity and role. Created automatically via a Supabase trigger on signup.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | References `auth.users.id` |
| `email` | text | User's email address |
| `full_name` | text | Client's full name |
| `business_name` | text | Client's business or brand name |
| `role` | text | `client` or `admin` |
| `created_at` | timestamptz | Account creation timestamp |

### `projects`
One project per client. Tracks the full lifecycle from kickoff to launch.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `client_id` | uuid | References `profiles.id` |
| `project_name` | text | Name of the client's project |
| `status` | text | Current stage in the workflow |
| `progress` | integer | Completion percentage (0–100) |
| `price` | numeric | Total project price |
| `deposit_paid` | boolean | Whether the deposit has been received |
| `final_payment_paid` | boolean | Whether the final invoice has been paid |
| `estimated_launch_date` | date | Projected go-live date |
| `launched_at` | date | Actual launch date |
| `updated_at` | timestamptz | Auto-updated on any change |

### `milestones`
Ordered project checkpoints. Pre-populated for each new project with 9 default milestones.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `project_id` | uuid | References `projects.id` |
| `label` | text | Short milestone name |
| `description` | text | Details about this milestone |
| `completed` | boolean | Whether this milestone is done |
| `completion_at` | timestamptz | When it was marked complete |
| `sort_order` | integer | Display ordering |

### `assets`
Uploaded files and video URLs associated with a project.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `project_id` | uuid | References `projects.id` |
| `type` | text | `logo`, `photo`, `video`, `document`, etc. |
| `label` | text | Human-readable name |
| `url` | text | Public URL or video link |
| `size_bytes` | bigint | File size in bytes (null for URLs) |
| `created_at` | timestamptz | Upload timestamp |

### `feedback`
Bi-directional message thread between client and admin. Realtime-enabled.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `project_id` | uuid | References `projects.id` |
| `message` | text | Message body |
| `from_admin` | boolean | `true` if sent by admin, `false` if by client |
| `created_at` | timestamptz | Send timestamp |

### Project Status Workflow

```
awaiting_contract
       ↓
awaiting_deposit
       ↓
awaiting_assets
       ↓
  in_progress
       ↓
   in_review
       ↓
  revisions
       ↓
final_approval
       ↓
awaiting_final_payment
       ↓
   launching
       ↓
   complete
```

---

## Authentication

Authentication is fully passwordless using Supabase's magic link / OTP system.

1. **Client Onboarding** — The admin enters a new client's email and project info into the admin panel. The portal calls `supabase.auth.admin.inviteUserByEmail()` using the service role key, which sends a branded invitation email with a one-time magic link.
2. **Returning Login** — On subsequent visits, clients enter their email at [portal.scoggins.digital/login](https://portal.scoggins.digital/login) and receive a new magic link.
3. **Callback Handling** — Clicking the magic link redirects to `/auth/callback`, which exchanges the token for a session and routes the user to their appropriate dashboard based on their role.
4. **Session Persistence** — Supabase handles session storage and refresh automatically. The `useAuth` hook listens for `SIGNED_IN`, `SIGNED_OUT`, and `TOKEN_REFRESHED` events to keep the UI in sync.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### Environment Variables

Create a `.env` file in the project root. These values come from your Supabase project's **Settings → API** page.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_SUPABASE_SERVICE_KEY=your-service-role-secret-key
```

> **Important:** The service role key is a privileged credential. It is only used server-side for sending client invites. Never expose it in a public-facing environment — in a production setup, move invite operations behind a serverless function or Edge Function.

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/scoggins-client-portal.git
cd scoggins-client-portal

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Database Setup

1. Open your Supabase project and navigate to **SQL Editor**
2. Copy the contents of [supabase_schema.sql](supabase_schema.sql)
3. Paste and run the SQL — this creates all tables, RLS policies, triggers, and realtime configuration

4. In your Supabase project, go to **Authentication → URL Configuration** and set:
   - **Site URL**: `https://portal.scoggins.digital` (or `http://localhost:5173` for local dev)
   - **Redirect URLs**: Add `https://portal.scoggins.digital/auth/callback` and `http://localhost:5173/auth/callback`

5. Go to **Storage** and create a public bucket named `assets` for client file uploads

6. To create your first admin account:
   - Sign up via the login page with your email
   - In Supabase's **Table Editor**, find your row in the `profiles` table and set `role` to `admin`
   - Subsequent logins will route you directly to the admin dashboard

---

## Deployment

The portal is deployed on [Vercel](https://vercel.com) with automatic deployments from the main branch.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect the repository in the Vercel dashboard for automatic CI/CD on every push.

**Required Vercel environment variables** (set in Project → Settings → Environment Variables):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_KEY
```

**Build settings:**
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Custom Domain

In the Vercel dashboard, add `portal.scoggins.digital` as a custom domain and follow the DNS instructions to point your domain's CNAME or A record to Vercel. Remember to update your Supabase redirect URLs to match the live domain.

---

## Design System

The portal uses a custom dark design system built on Tailwind CSS with a consistent visual language throughout.

### Colors

| Token | Value | Usage |
|---|---|---|
| `dark` | `#0d0d1a` | Primary background |
| `navy` | `#0f1629` | Card and panel backgrounds |
| `cyan-400` | `#22d3ee` | Primary accent, CTAs, highlights |
| `cyan-glow` | `#06b6d4` | Glow effect color |
| `gray-400` | `#9ca3af` | Secondary text |

### Typography

- **DM Sans** — Primary UI font for headings, body text, and interactive elements
- **JetBrains Mono** — Monospace font for labels, data values, status badges, and code-like elements

### Reusable CSS Classes

| Class | Description |
|---|---|
| `.card` | Navy semi-transparent card with backdrop blur and border |
| `.btn-primary` | Cyan gradient button with glow shadow on hover |
| `.btn-ghost` | Outlined ghost button with cyan text |
| `.input` | Consistent dark form input with cyan focus ring |
| `.label` | Uppercase, letter-spaced mono label in cyan |
| `.badge` | Small status badge with dot and colored text |
| `.grid-bg` | Subtle cyan grid background pattern |
| `.glow-orb` | Radial gradient decorative background orb |
| `.skeleton` | Shimmer loading placeholder animation |

### Animations

| Name | Description |
|---|---|
| `fade-in` | Opacity 0 → 1 on mount |
| `slide-up` | Translate Y + fade in on mount |
| `pulse-slow` | Slow, subtle pulse for ambient elements |

---

## Routing & Access Control

| Route | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public (redirects if already authenticated) |
| `/auth/callback` | `AuthCallback` | Public (magic link exchange) |
| `/` | `RootRedirect` | Authenticated — routes to `/admin` or client dashboard |
| `/admin` | `AdminDashboard` | Admin role only |

The `ProtectedRoute` wrapper in [App.jsx](src/App.jsx) checks the current session and profile role before rendering any protected page. Unauthenticated users are redirected to `/login`. Authenticated clients who attempt to access `/admin` are redirected to the client dashboard.

---

## Key Workflows

### Onboarding a New Client

1. Admin navigates to the admin dashboard and clicks **New Client**
2. Fills out the client's name, business name, email, project name, and price
3. On submit, the portal:
   - Calls `supabase.auth.admin.inviteUserByEmail()` to send the magic link invite
   - Creates a row in `profiles` with role `client`
   - Creates a row in `projects` linked to the new profile
   - Pre-populates `milestones` with 9 ordered default checkpoints
4. The client receives an email with a link to the portal and logs in passwordlessly

### Client Asset Upload

1. Client navigates to the **My Assets** tab
2. Selects a file using the upload form and chooses an asset type (Logo, Photo, Document)
3. The file is uploaded to the Supabase `assets` storage bucket
4. A record is inserted into the `assets` table with the file URL, type, size, and label
5. The asset appears immediately in the client's asset list and in the admin's Assets tab for that project

### Real-Time Feedback

1. Either the client or admin types a message and submits it
2. The message is inserted into the `feedback` table
3. The other party's active session receives the new message instantly via a Supabase Realtime channel subscription — no page refresh required
4. Both sides see a chronological thread with timestamps and a visual distinction between client and admin messages

---

Built and maintained by [Hunter Scoggins](https://scoggins.digital) — Scoggins Digital.
