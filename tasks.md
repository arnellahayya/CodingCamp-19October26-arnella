# Implementation Plan: To-Do Life Dashboard

## Overview

Implement the To-Do Life Dashboard as a zero-dependency, single-page application using plain HTML, CSS, and Vanilla JavaScript. The implementation follows the Module Pattern defined in the design, building each widget module incrementally and wiring them together at the end. All persistent state is stored via `localStorage` through a shared `StorageModule`.

## Tasks

- [x] 1. Set up project structure and shared infrastructure
  - Create `index.html` at project root with semantic HTML sections for all four widgets, a theme-toggle button, and `<link>`/`<script>` tags pointing to `css/style.css` and `js/app.js` respectively — no inline `<style>` or `<script>` blocks
  - Create `css/style.css` with CSS custom properties for all color values, light/dark theme classes on `<html>`, Flexbox/Grid layout ensuring no horizontal scroll from 320 px to 2560 px, and a strikethrough utility class for completed tasks
  - Create `js/app.js` with the `StorageModule` (get / set / remove with try/catch) and the `DOMContentLoaded` bootstrap stub that will call each module's `init()`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.3, 10.4_

- [x] 2. Implement ThemeModule
  - [x] 2.1 Implement `ThemeModule.init()` and `ThemeModule.toggle()`
    - Read `tld_theme` from `StorageModule`; fall back to `prefers-color-scheme` if absent or storage unavailable
    - Apply `"light"` or `"dark"` class to `<html>` immediately on init (before paint) to prevent FOUC
    - Attach click listener to `#theme-toggle-btn`; on click call `toggle()` which flips the class and persists via `StorageModule.set`
    - Entire switch must complete within 100 ms
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 2.2 Write property test for ThemeModule toggle involution
    - **Property 12: Theme toggle is an involution**
    - Seed `tld_theme` in a mock localStorage, call `toggle()` twice, assert final theme equals starting theme and `<html>` class reflects the theme after each call
    - Use `fc.constantFrom("light", "dark")`
    - **Validates: Requirements 7.2, 7.3**

- [x] 3. Implement StorageModule hardening and unit tests
  - [x] 3.1 Harden `StorageModule` error paths
    - Confirm `get` returns `null` on JSON parse errors
    - Confirm `set` returns `false` when `localStorage.setItem` throws (e.g., quota exceeded)
    - Confirm `remove` silently clears the key without throwing
    - _Requirements: 5.11, 5.13, 7.7_

  - [ ]* 3.2 Write property test for storage serialization round-trip
    - **Property 11: Storage serialization round-trip for tasks and links**
    - Generate arbitrary `Task[]` and `Link[]` with `fc.array(fc.record({...}))`, call `StorageModule.set` then `StorageModule.get`, assert structural equality
    - **Validates: Requirements 5.10, 5.12, 6.7, 6.8**

- [x] 4. Implement GreetingModule
  - [x] 4.1 Implement `GreetingModule.init()`, `tick()`, and `getGreetingPhrase()`
    - Start `setInterval` at 1000 ms; each tick reads `Date`, formats time as `HH:MM:SS`, formats date as `"Weekday, DD Month YYYY"`, calls `getGreetingPhrase(hour)`, and writes to `#clock`, `#date-display`, `#greeting`
    - `getGreetingPhrase`: 05–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–23 | 00–04 → "Good Night"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property test for greeting phrase coverage
    - **Property 1: Greeting phrase covers all 24 hours**
    - Use `fc.integer({ min: 0, max: 23 })`, assert `getGreetingPhrase(hour)` returns exactly one of the four expected strings with no unmapped hour
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.3 Implement user-name input, save, and display
    - Read `tld_userName` from `StorageModule` on init and append to greeting as ", {name}" within 300 ms of page becoming interactive
    - Attach submit/click listener to `#name-save-btn`: trim input, reject if > 50 chars (show `#name-validation-msg`), reject if whitespace-only (remove storage entry), otherwise persist trimmed value and update greeting
    - When input is cleared and saved, call `StorageModule.remove("tld_userName")`
    - _Requirements: 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 4.4 Write property test for user-name trim and storage round-trip
    - **Property 2: User name trimming and storage round-trip**
    - Use `fc.string().filter(s => s.trim().length > 0)`, trim, save via `StorageModule.set`, read back, assert equality to trimmed original
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 4.5 Write property test for whitespace-only name treated as empty
    - **Property 3: Whitespace-only name treated as empty**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1 })`, submit as User_Name, assert `StorageModule.get("tld_userName")` returns `null`
    - **Validates: Requirements 2.7**

- [x] 5. Checkpoint — Ensure all tests pass
  - Run the test suite; verify GreetingModule, ThemeModule, and StorageModule tests all pass. Ask the user if any questions arise.

- [x] 6. Implement TimerModule
  - [x] 6.1 Implement `formatCountdown()` and `validateDuration()`
    - `formatCountdown(totalSeconds)`: return `"MM:SS"` zero-padded string; input range [0, 5400]
    - `validateDuration(value)`: parse integer, return `{ valid: false, message }` for non-integers and values outside [1, 90]; return `{ valid: true, value: n }` for valid input
    - _Requirements: 3.1, 4.1, 4.6_

  - [ ]* 6.2 Write property test for countdown format
    - **Property 4: Timer countdown format is always valid MM:SS**
    - Use `fc.integer({ min: 0, max: 5400 })`, assert result matches `/^[0-9]{2}:[0-9]{2}$/` and numeric parts are mathematically correct
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.3 Write property test for session-duration validation
    - **Property 5: Session-duration validation rejects out-of-range values**
    - Partition `fc.integer()` into [1, 90] (valid) and outside (invalid); assert correct `valid` field for each partition
    - **Validates: Requirements 4.1, 4.6**

  - [x] 6.4 Implement `TimerModule.init()`, `start()`, `stop()`, `reset()`, and `tick()`
    - On init: read `tld_sessionDuration` from `StorageModule` (default 25), render `#timer-display` via `formatCountdown`, attach listeners for `#start-btn`, `#stop-btn`, `#reset-btn`, `#duration-input`
    - `start()`: record `targetEndTime = Date.now() + remaining * 1000`, launch `setInterval` at 1000 ms, disable `#start-btn`, enable `#stop-btn`
    - `tick()`: compute `remaining = Math.ceil((targetEndTime - Date.now()) / 1000)`, update display; if ≤ 0 call `onComplete()`
    - `stop()`: clear interval, enable `#start-btn`, disable `#stop-btn`
    - `reset()`: clear interval, restore display to `sessionDuration`, enable `#start-btn`, disable `#stop-btn`
    - `onComplete()`: clear interval, play Web Audio API beep, show browser notification if `Notification.permission === "granted"`, update button states
    - Duration change while timer inactive: validate, show `#duration-validation-msg` on error, persist and update display on success within 200 ms
    - Duration change while timer active: ignore change, show inline message that duration cannot be changed while running
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.2, 4.3, 4.4, 4.5, 4.7_

- [x] 7. Implement TodoModule
  - [x] 7.1 Implement `TodoModule.init()`, `addTask()`, `renderTasks()`, and storage persistence
    - On init: load `tld_tasks` from `StorageModule`; if `null` or non-array render empty list and show "Saved tasks could not be loaded."
    - `addTask(description)`: trim, reject empty or > 250 chars with `#task-validation-msg`, create `{ id, text, completed: false, createdAt }`, push to `tasks[]`, call `StorageModule.set`; if `set` returns `false` show "Change could not be saved."
    - `renderTasks()`: build `<ul>` DOM from `tasks[]`; apply strikethrough class to completed tasks; attach complete-toggle, edit, delete listeners per row
    - Attach submit listener to `#add-task-btn` / the add form
    - _Requirements: 5.1, 5.2, 5.3, 5.10, 5.11, 5.12, 5.13_

  - [ ]* 7.2 Write property test for task addition round-trip
    - **Property 6: Task addition round-trip preserves data**
    - Use `fc.string({ minLength: 1, maxLength: 250 }).filter(s => s.trim().length > 0)`, add task, read back from mock storage, assert last element `text` equals trimmed input and `completed === false`
    - **Validates: Requirements 5.2, 5.10**

  - [ ]* 7.3 Write property test for whitespace-only task rejection
    - **Property 7: Whitespace-only task descriptions are rejected**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1 })`, attempt add, assert `tasks[]` length unchanged
    - **Validates: Requirements 5.3**

  - [x] 7.4 Implement `toggleComplete()`, `beginEdit()`, `saveEdit()`, and `deleteTask()`
    - `toggleComplete(id)`: flip `task.completed`, persist, re-render
    - `beginEdit(id)`: replace task row with inline edit field pre-populated with current text
    - `saveEdit(id, newText)`: trim, reject empty or > 250 chars with inline validation, update `task.text`, persist, re-render
    - `deleteTask(id)`: splice from `tasks[]`, persist, re-render
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 7.5 Write property test for toggle-complete involution
    - **Property 8: Toggle-complete is an involution**
    - Use `fc.boolean()` as initial completion state, toggle twice, assert final state equals initial and `tasks[]` length unchanged
    - **Validates: Requirements 5.4, 5.5**

- [x] 8. Checkpoint — Ensure all tests pass
  - Run the test suite; verify TimerModule and TodoModule tests all pass. Ask the user if any questions arise.

- [ ] 9. Implement LinksModule
  - [ ] 9.1 Implement `LinksModule.init()`, `addLink()`, `deleteLink()`, and `renderLinks()`
    - On init: load `tld_links` from `StorageModule`; render all links via `renderLinks()`
    - `addLink(label, url)`: validate label non-empty; validate url starts with `"http://"` or `"https://"`; check exact duplicate (label + url match); append `{ id, label, url }` to `links[]`, persist, re-render; show `#link-validation-msg` for any failure
    - `renderLinks()`: build link button list; each button opens URL in new tab with `target="_blank" rel="noopener noreferrer"`; attach delete listeners; ensure ≥ 20 links remain individually accessible via scroll
    - `deleteLink(id)`: splice from `links[]`, persist, re-render within one rendering cycle
    - Attach submit listener to `#add-link-btn` / the add form
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 9.2 Write property test for URL validation
    - **Property 9: URL validation accepts only http/https schemes**
    - Use `fc.webUrl()` for valid cases and `fc.string().filter(s => !s.startsWith("http://") && !s.startsWith("https://"))` for invalid; assert correct validity result for each
    - **Validates: Requirements 6.2, 6.4**

  - [ ]* 9.3 Write property test for duplicate link detection
    - **Property 10: Duplicate link detection**
    - Use `fc.array(fc.record({ label: fc.string(), url: fc.webUrl() }))` to seed a links list, attempt to add an existing entry, assert list length unchanged
    - **Validates: Requirements 6.10**

- [ ] 10. Wire all modules together and finalize integration
  - [ ] 10.1 Wire all modules in `DOMContentLoaded` bootstrap
    - In `app.js`, call `ThemeModule.init()` first (before paint), then `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `LinksModule.init()` in sequence
    - Confirm initial render completes within 2 seconds on a simulated Fast 4G profile
    - Verify all UI interactions produce a visible change within 100 ms
    - _Requirements: 8.3, 8.4, 10.1, 10.2_

  - [ ]* 10.2 Write integration tests for cross-module behavior
    - Using jsdom or Playwright, seed `localStorage` with saved tasks, links, theme, userName, and sessionDuration, load the page, and assert all widgets render with saved state
    - Verify theme class is applied before first paint (no FOUC)
    - Verify links panel supports ≥ 20 links without overlap or truncation
    - Mock `Notification` API and assert timer completion triggers notification when permission is granted
    - _Requirements: 5.12, 6.9, 7.4, 10.1_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Run the full test suite (unit, property, integration); verify all tests pass. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) and should run via Vitest or Jest with `--run` flag (single execution, no watch mode)
- The `StorageModule` must be initialized before any other module because all modules depend on it
- The `ThemeModule` must call `init()` before any rendering to prevent a flash of unstyled content
- Use a start-timestamp approach (`targetEndTime = Date.now() + remaining * 1000`) in the timer rather than decrementing a counter to prevent `setInterval` drift when the tab is backgrounded
- `crypto.randomUUID()` is available in all four target browsers (Chrome, Firefox, Edge, Safari stable); use it for Task and Link IDs

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 2, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 3, "tasks": ["4.4", "4.5", "6.2", "6.3"] },
    { "id": 4, "tasks": ["6.4", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4", "9.1"] },
    { "id": 6, "tasks": ["7.5", "9.2", "9.3"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["10.2"] }
  ]
}
```
