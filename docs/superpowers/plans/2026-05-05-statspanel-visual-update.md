# StatsPanel Visual Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a semi-transparent framing border and a minimalist rocket scrollbar thumb to the StatsPanel component.

**Architecture:** Single-file change to `src/components/StatsPanel.tsx`. Border applied via inline style updates on the outer panel div. Scrollbar implemented via a `<style>` tag injected in the component, scoped to `.stat-scroll` class added to the inner scroll container.

**Tech Stack:** React 18, TypeScript, inline styles, CSS webkit scrollbar pseudo-elements

---

## Task 1: Add Border and Rocket Scrollbar to StatsPanel

**Files:**
- Modify: `src/components/StatsPanel.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/StatsPanel.tsx` in full before making any changes.

- [ ] **Step 2: Inject the `<style>` tag and add `.stat-scroll` class**

In the wide-mode `return (...)` block, add a `<style>` tag as the first child of the outer `<div>`, and add `className="stat-scroll"` to the inner scroll div.

The outer div currently looks like:
```tsx
return (
  <div style={{
    width: 220,
    flexShrink: 0,
    background: 'rgba(2, 4, 9, 0.78)',
    borderRight: '1px solid rgba(147, 197, 253, 0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
```

The inner scroll div currently looks like:
```tsx
<div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
```

Replace the entire wide-mode `return (...)` with this (only changes are: `<style>` tag added, border values updated, `className="stat-scroll"` added to scroll div):

```tsx
return (
  <div style={{
    width: 220,
    flexShrink: 0,
    background: 'rgba(2, 4, 9, 0.78)',
    borderLeft: '1px solid rgba(147, 197, 253, 0.15)',
    borderRight: '1px solid rgba(147, 197, 253, 0.15)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <style>{`
      .stat-scroll::-webkit-scrollbar {
        width: 10px;
      }
      .stat-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .stat-scroll::-webkit-scrollbar-thumb {
        background-color: transparent;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='28' viewBox='0 0 10 28'%3E%3Cpath d='M5 1 C5 1 9 8 9 15 C9 19.5 7.2 22 5 22 C2.8 22 1 19.5 1 15 C1 8 5 1 5 1Z' fill='rgba(147%2C197%2C253%2C0.6)' stroke='rgba(147%2C197%2C253%2C0.8)' stroke-width='0.5'/%3E%3Ccircle cx='5' cy='14' r='1.5' fill='rgba(96%2C165%2C250%2C0.7)'/%3E%3Cpath d='M1.5 17 L0 22 L3 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M8.5 17 L10 22 L7 20Z' fill='rgba(147%2C197%2C253%2C0.35)'/%3E%3Cpath d='M3.5 22 L2.5 27 L5 25 L7.5 27 L6.5 22Z' fill='rgba(251%2C191%2C36%2C0.6)'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-size: 10px 28px;
        background-position: center top;
        border-radius: 5px;
      }
    `}</style>

    <div style={{
      padding: '12px 14px',
      borderBottom: '1px solid rgba(147, 197, 253, 0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <BarChart2 size={15} color="rgba(147, 197, 253, 0.6)" />
      <span style={{ color: 'rgba(147, 197, 253, 0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
        STAR MAP
      </span>
    </div>

    <div className="stat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
      {personCount === 0 ? (
        <p style={{ color: 'rgba(147, 197, 253, 0.15)', fontSize: 12, textAlign: 'center', padding: '20px 14px' }}>
          No stars charted
        </p>
      ) : (
        <>
          {companies.length > 0 && (
            <Section
              icon={<Building2 size={12} />}
              label="Company"
              items={companies}
              max={maxCompany}
              filterType="company"
              activeFilter={activeFilter}
              onToggle={toggle}
            />
          )}
          {relationships.length > 0 && (
            <Section
              icon={<Heart size={12} />}
              label="Relationship"
              items={relationships}
              max={maxRelationship}
              filterType="relationship"
              activeFilter={activeFilter}
              onToggle={toggle}
            />
          )}
          {locations.length > 0 && (
            <Section
              icon={<MapPin size={12} />}
              label="Location"
              items={locations}
              max={maxLocation}
              filterType="location"
              activeFilter={activeFilter}
              onToggle={toggle}
            />
          )}
        </>
      )}
    </div>

    {activeFilter && (
      <button
        onClick={() => onFilter(null)}
        style={{
          margin: '8px 10px',
          padding: '6px 10px',
          background: 'rgba(147, 197, 253, 0.06)',
          border: '1px solid rgba(147, 197, 253, 0.15)',
          borderRadius: 8,
          color: 'rgba(147, 197, 253, 0.5)',
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <X size={11} /> Clear filter
      </button>
    )}
  </div>
)
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd C:\Users\nolan\projects\network-app && npx tsc --noEmit 2>&1`

Expected: no errors.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. Check:
- StatsPanel has a visible left and right border (subtle blue glow)
- Scroll the panel — a rocket-shaped thumb should appear (nose up, amber flame at bottom)
- Rocket appears when there's enough content to scroll

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsPanel.tsx
git commit -m "feat: add border and rocket scrollbar to StatsPanel"
```
