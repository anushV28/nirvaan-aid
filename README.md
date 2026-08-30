# Nirvaan: Help Finds You

Build a web app called "Nirvaan" — an AI-powered disaster/emergency 

coordination platform that connects people in need with nearby volunteers 

and organizations during floods and disasters, like a crisis-mode 

matching system.

CORE FEATURES:

1. LANDING PAGE

- Clean, urgent-but-trustworthy design (blues/oranges, high contrast)

- App name "Nirvaan" with tagline "Help finds you"

- Language selector visible on landing page (see section 8)

- Entry points: "Request Help," "Volunteer Login/Signup," "NGO/Organization 

  Login/Signup"

2. REQUEST HELP FORM (public, no login required)

- Fields: reporter name, phone number, relationship to person in need 

  (self/relative/neighbor/other)

- Interactive map (Leaflet + OpenStreetMap) where the user drags/drops a 

  pin marking the location of the person in need, default centered on 

  Gujarat, India

- Landmark description text field as a fallback for unreliable addresses

- Description textbox for what help is needed

- On submit: send the description to an AI classification edge function 

  that returns category (medical/food/shelter/rescue) and urgency 

  (critical/high/medium/low) as strict JSON

- Save to database with status "pending"

- Confirmation screen with a tracking ID

3. VOLUNTEER SIGNUP/LOGIN (individual OR group)

- Use Supabase Auth (email/password)

- Signup type toggle: "Individual" or "Group/Team"

- Individual fields: name, phone, skills (medical/general/boat/rescue - 

  multi-select), location (auto-detect via geolocation, editable), 

  availability toggle

- Group fields: group/team name, contact person name, contact phone, 

  estimated member count, skills available within the group 

  (multi-select), location, availability toggle

- Both individual and group volunteers appear on the map, but group pins 

  should visually indicate they represent multiple people (e.g., a 

  different icon or a badge showing member count)

4. NGO/ORGANIZATION SIGNUP/LOGIN

- Use Supabase Auth (email/password)

- Signup fields: organization name, registration number (text field, 

  optional), contact person name, contact phone, email, area of 

  operation/description, resources available (free text)

- IMPORTANT: New NGO accounts should be created with a status of 

  "pending_approval" — NOT automatically active. Do NOT attempt automated 

  verification against any external registry.

- Build a simple ADMIN VIEW (accessible only to a designated admin role) 

  that lists all pending NGO signups with an "Approve" / "Reject" button. 

  Only NGOs with status "approved" can log in and appear as active 

  responders on the map.

- Show a clear message to NGOs with pending status when they try to log 

  in: "Your organization is under review. You'll be notified once 

  approved."

5. LIVE MAP DASHBOARD (main screen after login)

- Full-screen Leaflet map

- Request pins colored by urgency: red=critical, orange=high, 

  yellow=medium, green=low

- Volunteer pins in blue (individual) and a distinct marker style for 

  groups (showing member count on click/hover)

- Approved NGO pins in a distinct color/icon, showing organization name 

  and resources on click

- Clicking a request pin opens a side panel with full details and a list 

  of nearby available volunteers/groups/NGOs sorted by distance

- "Assign" button updates request status to "assigned" and draws an 

  assignment connector line

- Status progression: Assigned → En Route → Resolved, updated by the 

  assigned volunteer/group/NGO

- All updates must be REAL-TIME via Supabase real-time subscriptions — no 

  page refresh needed

6. REQUEST LIST / FEED VIEW (alternate to map)

- Sortable/filterable table of all requests, sorted by urgency by 

  default, filterable by category, status, and responder type needed

7. DATABASE SCHEMA (Supabase/Postgres)

requests

- id (uuid, primary key)

- reporter_name (text)

- reporter_phone (text)

- relationship (text)

- location_lat (float)

- location_lng (float)

- landmark (text)

- description (text)

- category (text)

- urgency (text)

- status (text) -- pending/assigned/en_route/resolved

- assigned_responder_id (uuid, nullable)

- assigned_responder_type (text) -- volunteer/group/ngo

- created_at (timestamp)

- updated_at (timestamp)

volunteers

- id (uuid, primary key, linked to auth.users)

- signup_type (text) -- individual/group

- name (text) -- individual name OR group/team name

- contact_phone (text)

- member_count (integer, nullable, only for groups)

- skills (text array)

- location_lat (float)

- location_lng (float)

- status (text) -- available/busy

- last_active (timestamp)

organizations

- id (uuid, primary key, linked to auth.users)

- org_name (text)

- registration_number (text, nullable)

- contact_person (text)

- contact_phone (text)

- email (text)

- area_of_operation (text)

- resources_available (text)

- approval_status (text) -- pending_approval/approved/rejected

- location_lat (float)

- location_lng (float)

- created_at (timestamp)

assignments

- id (uuid, primary key)

- request_id (uuid, foreign key to requests)

- responder_id (uuid)

- responder_type (text) -- volunteer/group/ngo

- assigned_at (timestamp)

- resolved_at (timestamp, nullable)

admins

- id (uuid, primary key, linked to auth.users)

- name (text)

Enable row-level security:

- Anyone can INSERT into requests (public form)

- Only authenticated volunteers/groups can view/update their own 

  volunteer record

- Only authenticated organizations can view/update their own 

  organization record, but cannot self-approve

- Only users in the admins table can update organizations.approval_status

- Public/authenticated users can SELECT from requests, and from 

  volunteers/organizations WHERE status is available/approved (so 

  pending NGOs don't show on the public map)

8. MULTI-LANGUAGE SUPPORT

- Implement using react-i18next (or similar i18n library)

- Support at least English, Hindi, and Gujarati

- Language selector as a dropdown, visible on every page (landing page 

  and dashboard header)

- Prioritize translating the "Request Help" form fully first, since this 

  is used by people in the middle of an emergency and needs to be 

  accessible in their preferred language

- Store the user's language choice so it persists across their session

9. DEMO DATA SEEDING

- Seed script or admin button populating 15-20 realistic fake requests, 

  8-10 fake individual/group volunteers, and 3-5 fake NGOs (mix of 

  approved and pending status) across a flood-prone Gujarat district map 

  area (e.g., around Vadodara), with staggered timestamps and varied 

  urgency levels

TECH PREFERENCES:

- React + TypeScript frontend, Tailwind CSS for styling

- Supabase for auth, database, and real-time subscriptions

- Leaflet.js + OpenStreetMap for maps

- react-i18next for multi-language support

- Supabase Edge Function for AI urgency classification, calling an LLM 

  API with a strict JSON-only response format, using a securely stored 

  API key

BUILD PRIORITY ORDER (important — build in this order):

1. Core loop first: submit request → AI classifies it → appears on live 

   map → a volunteer can view and get assigned → real-time status updates

2. Volunteer individual + group signup/login

3. NGO signup/login with pending_approval status and admin approval panel

4. Multi-language toggle, starting with the Request Help form

5. Demo data seeding

6. Polish and additional views last

Get the end-to-end core loop working and stable before layering on NGO 

approval flows and multi-language support — those are important but 

secondary to proving the core request-to-response loop works reliably.

The API key to be used is: @secret:ANTHROPIC_API_KEY

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nirvaan-aid.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2d09688-338a-43a7-ab03-38839424242e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
