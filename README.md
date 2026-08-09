# Nirvaan — Disaster Help Finds You

**Live app:** [nirvaan-aid.lovable.app](https://nirvaan-aid.lovable.app/)

Nirvaan is a real-time AI coordination platform that connects people trapped, stranded, or in need during floods and disasters with the nearest available volunteers, rescue teams, and relief organizations — turning scattered, manual relief efforts into a single live system, the way ride-hailing apps coordinate drivers and riders, but built for disaster response.

Built for **Mecia Hacks 3.0** by **Team Deploying Hope**, under the Enterprise Software & Cloud Solutions track.

> ⚠️ If you are in immediate danger, call local emergency services first. Nirvaan supplements — it does not replace — official emergency response.

---

## The Problem

Gujarat has faced a major disaster roughly once every few years since 1998 — the Kandla Cyclone, the Bhuj Earthquake, repeated monsoon floods, Cyclone Tauktae, and more — together affecting millions of people. In each of these, the bottleneck was rarely a shortage of willing volunteers. It was the **absence of coordination**: families waiting without knowing if help is coming, volunteers unable to find people in need, and critical cases getting lost between phone calls and word of mouth.

Nirvaan closes that gap.

## How It Works

### 1. Report
Anyone can drop a pin on the map and describe the situation in plain language — no account or sign-up required. The form captures who needs help (self, a relative, a neighbour, or someone else), their location, a nearby landmark, and what kind of help is needed.

### 2. Triage
The description is sent to an AI model that reads it for context and instantly classifies it into a **category** (medical / food / shelter / rescue) and an **urgency tier** (critical / high / medium / low) — the way a human dispatcher would, but in seconds.

### 3. Respond
Nearby volunteers, rescue teams, and NGOs see the request live on a shared map and get matched and assigned in real time. Every status update — Pending → Assigned → En Route → Resolved — is visible to everyone watching, instantly.

## Who It's For

| Role | What they can do |
|---|---|
| **Public / people in crisis** | Submit a help request in under a minute, no account needed |
| **Volunteers** | Sign up / log in, view live requests near them, accept and respond |
| **NGOs / Organizations** | Sign up / log in, coordinate teams, monitor the live map and request queue |

## Key Features

- **Pin-drop reporting** — no account required to ask for help
- **Multilingual** — available in English, हिन्दी, and ગુજરાતી
- **AI-powered urgency triage** — automatic category + urgency classification from free-text descriptions
- **Live map dashboard** — color-coded, real-time view of active requests and available responders
- **Real-time status tracking** — every request updates live for everyone watching, no refresh needed
- **Escalation path** — critical requests left unresolved can flag up to official disaster-response channels (e.g. NDRF)

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | Component-based UI that re-renders only what changes; TypeScript catches errors before runtime |
| Maps | Leaflet.js + OpenStreetMap | Lightweight, open-source interactive maps with custom color-coded urgency markers |
| Backend + Database | Supabase (built on Postgres) | Relational data (requests ↔ volunteers ↔ assignments) plus built-in auth and hosting |
| Real-time updates | Supabase Realtime Subscriptions | Pushes live changes to every connected screen instantly, no polling or refresh |
| AI layer | LLM API | Reads free-text emergency descriptions and returns structured category + urgency as JSON |
| Server-side logic | Supabase Edge Functions | Runs the AI API call server-side, keeping the secret API key out of the browser |

## Pages

- `/` — Landing page with the "How it works" overview and role-based entry points
- `/request` — Public emergency request form (no login required)
- `/dashboard` — Live map of active requests and responders
- `/auth/volunteer` — Volunteer login / signup
- `/auth/ngo` — NGO / organization login / signup

## Roadmap

- [ ] Auto-escalation of unresolved critical requests to official NDRF channels
- [ ] SMS/offline fallback for low-connectivity disaster zones
- [ ] Volunteer skill tagging (medical, boat/rescue, logistics, etc.) for smarter matching
- [ ] Historical analytics dashboard for NGOs and government partners

## Team

**Deploying Hope** — built for Mecia Hacks 3.0 (Enterprise Software & Cloud Solutions track)

## License

TBD

---

*In a crisis, the difference between life and death is often just a few minutes of confusion. Nirvaan exists to remove that confusion — so no request for help ever goes unseen, and no one is left stranded waiting for help that doesn't know how to find them.*


---

*In a crisis, the difference between life and death is often just a few minutes of confusion. Nirvaan exists to remove that confusion — so no request for help ever goes unseen, and no one is left stranded waiting for help that doesn't know how to find them.*
