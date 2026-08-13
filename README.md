# 🆘 Nirvaan — Help Finds You

**Live Demo:** [https://nirvaan-aid.lovable.app](https://nirvaan-aid.lovable.app)

Nirvaan is an AI-powered disaster and emergency coordination platform that connects people in need with nearby volunteers, community groups, and NGOs in real time during floods and disasters — like a crisis-mode matching system for rescue and relief.

---

##  The Problem

During floods and disasters, help and need can't find each other:

- **Scattered information** — requests go out through calls, WhatsApp forwards, and social media, with no centralized real-time picture of who needs what, where.
- **No triage** — a life-threatening request and a minor one get treated identically, with no automatic way to prioritize.
- **Wasted volunteer effort** — without coordination, multiple volunteers show up at the same accessible location while others go unreached.

Gujarat has recurring flood-affected regions almost every monsoon (South Gujarat, Vadodara, Banaskantha), making this a real, repeating, locally relevant problem — not a hypothetical one.

---

##  The Solution

Nirvaan lets someone (often a relative or neighbor reporting on behalf of the person in need) submit a request with a pinned location and description. An AI model classifies the request by **category** (medical / food / shelter / rescue) and **urgency** (critical / high / medium / low). The request then appears on a live, real-time map where nearby volunteers, groups, and approved NGOs can view, accept, and update its status — from pending, to assigned, to resolved — visible to everyone in real time.

### Key Features
-  Map-based request submission with landmark fallback for when addresses fail
-  AI-driven urgency classification from free-text descriptions
-  Live, real-time map dashboard with color-coded urgency pins
-  Individual and group volunteer signup
-  NGO/organization signup with an admin-approval flow
-  Multi-language support (English, Hindi, Gujarati)
-  Filterable request list view as an alternative to the map

---

##  Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + TypeScript | Component-based UI with real-time-safe rendering and type safety |
| Styling | Tailwind CSS | Fast, consistent styling for urgency color-coding |
| Maps | Leaflet.js + OpenStreetMap | Free, lightweight, no billing/API key setup required |
| Backend & Database | Supabase (PostgreSQL) | Relational data model, built-in auth, real-time subscriptions, no custom server needed |
| Real-time sync | Supabase Realtime | Instant live updates across all connected clients |
| AI classification | LLM API via Supabase Edge Function | Reads free-text descriptions and returns structured urgency/category JSON |
| Localization | react-i18next | Instant language switching for interface text |

---

##  Database Schema (Supabase/Postgres)

- **requests** — reporter info, location, description, category, urgency, status
- **volunteers** — individual or group signups, skills, location, availability
- **organizations** — NGO details, approval status (pending/approved/rejected)
- **assignments** — links requests to the responder (volunteer/group/NGO)
- **admins** — users authorized to approve NGO accounts

Row-level security ensures only authenticated volunteers/NGOs can update their own records, and only admins can approve organizations.

---

##  Security Notes
- AI API calls run through a server-side Supabase Edge Function, keeping the API key hidden from the client
- NGO accounts require manual admin approval rather than automated verification, to avoid false claims of legitimacy

---

##  Future Roadmap
- SMS/offline-first fallback for areas with degraded or no network connectivity
- Integration with official disaster management bodies (e.g., NDRF) for escalation of unresolved critical requests
- Automated NGO verification against government registries
- Bluetooth/mesh-based request relay for zero-connectivity scenarios

---

## 📄 License
TBD
