# Google Calendar Integration Design

**Date:** 2026-05-03
**App:** network-app (React + TypeScript + Vite + Zustand)

## Summary

Bidirectional Google Calendar/Tasks integration. Push follow-up reminders to Google Tasks (visible in Calendar sidebar). Pull calendar events to auto-update `lastContact` dates via name matching. Manual sync trigger. Pure client-side via GAPI + Google Identity Services.

---

## Architecture

### New files
- `src/services/googleCalendar.ts` — all GAPI/GIS logic: init, auth, push (Tasks API), pull (Calendar API)
- `src/components/CalendarSync.tsx` — toolbar button + result summary UI

### Modified files
- `src/types/index.ts` — add `gTaskId?: string` to `PersonData`
- `src/store/networkStore.ts` — `gTaskId` flows through `updateNode`
- `src/components/Toolbar.tsx` — mount `CalendarSync` button

### Config
- `VITE_GOOGLE_CLIENT_ID` in `.env.local` (gitignored, never committed)

### Auth state
- Lives in React component state (not Zustand) — token is session-only, not persisted to localStorage
- States: `disconnected | connecting | connected | error`

### API scopes
- `https://www.googleapis.com/auth/calendar.readonly` — read events for pull
- `https://www.googleapis.com/auth/tasks` — create/update/delete tasks for push

---

## Push: Follow-up reminders → Google Tasks

For each contact with `nextFollowUp` set, maintain a Google Task in the primary task list ("My Tasks"):
- Title: `"Follow up: [Name]"`
- Due: `nextFollowUp` date
- Notes: `reminderNote` (if set)

**Sync logic per contact:**

| `gTaskId` | `nextFollowUp` | Action |
|-----------|---------------|--------|
| absent    | set           | Create task, store returned ID as `gTaskId` |
| present   | set           | Update existing task (title, due date, notes) |
| present   | empty         | Delete task, clear `gTaskId` |
| absent    | empty         | No-op |

Tasks appear automatically in Google Calendar sidebar.

---

## Pull: Calendar events → lastContact

Fetch all events from primary calendar for the last 90 days.

**Name matching algorithm:**
1. Normalize contact name and event title to lowercase, trimmed
2. Skip contacts with names shorter than 4 characters
3. Match if contact's full name appears as a substring of the event title (e.g., "Lunch with Alex Kirk" matches "Alex Kirk")
4. First+last name both present counts as a match

**Update rule:** Only update `lastContact` if the matched event date is strictly greater than the contact's current `lastContact`. Never moves `lastContact` backward.

**Result:** Show summary of changed contacts.

---

## UI

`CalendarSync` component anchors to toolbar, no separate modal.

**States:**
- **Disconnected:** "Connect Google" button → triggers OAuth pop-up
- **Connected/idle:** "Sync" button + green dot + "Last synced: X min ago"
- **Syncing:** spinner

**Post-sync summary** (inline, dismissible):
```
↑ 12 tasks pushed · ↓ 5 contacts updated
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| User cancels OAuth | Silent, stays disconnected |
| GAPI fails to load | "Google Calendar unavailable" in panel |
| API call fails (token expired, network) | Auto-retry once, then show error + "Retry" button |
| `VITE_GOOGLE_CLIENT_ID` missing | Console warning, Calendar button hidden |
| Name match false positive | Harmless — pull never moves `lastContact` backward |

---

## Out of scope

- Bidirectional event editing (e.g., editing task due date in Google → updates app)
- Auto-sync on load or contact save
- Multiple calendar selection
- Attendee-based matching
- Non-primary task list selection
