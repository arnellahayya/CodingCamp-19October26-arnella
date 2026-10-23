/**
 * To-Do Life Dashboard — app.js
 *
 * All application logic lives here, organized into isolated modules
 * following the Module Pattern. The DOMContentLoaded bootstrap at the
 * bottom wires every module together in the correct initialization order.
 *
 * Module load order (required):
 *   1. StorageModule   — shared dependency; must be defined first
 *   2. ThemeModule     — must apply before any paint to prevent FOUC
 *   3. GreetingModule  — clock/greeting
 *   4. TimerModule     — Pomodoro timer
 *   5. TodoModule      — to-do list
 *   6. LinksModule     — quick links
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// StorageModule
//
// Thin wrapper around localStorage.  All methods use try/catch so that
// private-browsing restrictions, quota exhaustion, or corrupted JSON never
// throw unhandled exceptions into callers.
//
// Storage keys used by the application:
//   tld_theme           — "light" | "dark"
//   tld_userName        — string
//   tld_sessionDuration — number (minutes, 1–90)
//   tld_tasks           — Task[]
//   tld_links           — Link[]
// ─────────────────────────────────────────────────────────────────────────────

const StorageModule = (() => {
  /**
   * Retrieve a value from localStorage and JSON-parse it.
   * @param {string} key
   * @returns {*} Parsed value, or null on miss or parse error.
   */
  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Serialize a value to JSON and write it to localStorage.
   * @param {string} key
   * @param {*}      value
   * @returns {boolean} true on success, false if storage throws (e.g. quota).
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a key from localStorage.  Never throws.
   * @param {string} key
   */
  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently swallow — removal should never surface an error to the user.
    }
  }

  return { get, set, remove };
})();

// ─────────────────────────────────────────────────────────────────────────────
// ThemeModule
//
// Reads the saved theme from StorageModule, falls back to prefers-color-scheme,
// applies the appropriate class to <html> immediately (before paint), and
// wires the toggle button.
// ─────────────────────────────────────────────────────────────────────────────

const ThemeModule = (() => {
  const KEY = "tld_theme";

  /** @type {"light"|"dark"} */
  let currentTheme = "light";

  /**
   * Apply theme class to <html> and update storage.
   * @param {"light"|"dark"} theme
   * @param {boolean} [persist=true]
   */
  function applyTheme(theme, persist = true) {
    currentTheme = theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    if (persist) {
      StorageModule.set(KEY, theme);
    }
  }

  /**
   * Flip between light and dark; persists the new choice.
   * Must complete within 100 ms (CSS transition handles the visual part).
   */
  function toggle() {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  }

  /**
   * Initialize ThemeModule:
   *   1. Determine starting theme (saved → prefers-color-scheme → "light").
   *   2. Apply it to <html> immediately (before first paint).
   *   3. Wire the toggle button.
   */
  function init() {
    const saved = StorageModule.get(KEY);
    let theme;

    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else {
      // Fall back to OS preference
      theme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }

    // Apply without persisting if there was no saved value (don't overwrite
    // the absence of a preference with a default).
    applyTheme(theme, saved === "light" || saved === "dark");

    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", toggle);
    }
  }

  return { init, toggle, /** @returns {"light"|"dark"} */ getTheme: () => currentTheme };
})();

// ─────────────────────────────────────────────────────────────────────────────
// GreetingModule
//
// Drives the live clock and greeting widget.
// ─────────────────────────────────────────────────────────────────────────────

const GreetingModule = (() => {
  const NAME_KEY = "tld_userName";
  const MAX_NAME_LENGTH = 50;

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const WEEKDAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ];

  /** @type {number|null} */
  let intervalId = null;

  /**
   * Select a greeting phrase based on the current local hour.
   * @param {number} hour — integer in [0, 23]
   * @returns {string}
   */
  function getGreetingPhrase(hour) {
    if (hour >= 5 && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night"; // 21–23 and 00–04
  }

  /**
   * Zero-pad a number to at least 2 digits.
   * @param {number} n
   * @returns {string}
   */
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** Update all Greeting widget DOM targets with the current time. */
  function tick() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const timeStr = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;

    const day = now.getDate();
    const monthName = MONTHS[now.getMonth()];
    const weekday = WEEKDAYS[now.getDay()];
    const year = now.getFullYear();
    const dateStr = `${weekday}, ${pad2(day)} ${monthName} ${year}`;

    const phrase = getGreetingPhrase(h);
    const userName = StorageModule.get(NAME_KEY);
    const greetingStr = userName
      ? `${phrase}, ${userName}`
      : `${phrase}!`;

    const clockEl = document.getElementById("clock");
    const dateEl = document.getElementById("date-display");
    const greetingEl = document.getElementById("greeting");

    if (clockEl) {
      clockEl.textContent = timeStr;
      clockEl.setAttribute("datetime", now.toISOString());
    }
    if (dateEl) dateEl.textContent = dateStr;
    if (greetingEl) greetingEl.textContent = greetingStr;
  }

  /** Wire the name-input form and start the clock interval. */
  function init() {
    // Populate name input if a name is already saved
    const savedName = StorageModule.get(NAME_KEY);
    const nameInput = document.getElementById("name-input");
    if (nameInput && savedName) {
      nameInput.value = savedName;
    }

    // Wire submit on the form that wraps the name input + save button
    const nameForm = nameInput ? nameInput.closest("form") : null;
    if (nameForm) {
      nameForm.addEventListener("submit", handleNameSave);
    }

    // Also wire direct click on the save button (for cases without a form)
    const saveBtn = document.getElementById("name-save-btn");
    if (saveBtn && !nameForm) {
      saveBtn.addEventListener("click", handleNameSave);
    }

    // Run tick immediately, then every second
    tick();
    intervalId = setInterval(tick, 1000);
  }

  /** Handle name form submission. */
  function handleNameSave(event) {
    event.preventDefault();

    const nameInput = document.getElementById("name-input");
    const validationMsg = document.getElementById("name-validation-msg");

    if (!nameInput) return;

    const raw = nameInput.value;
    const trimmed = raw.trim();

    // Clear previous message
    if (validationMsg) validationMsg.textContent = "";

    if (trimmed.length === 0) {
      // Whitespace-only or empty: remove stored name
      StorageModule.remove(NAME_KEY);
      nameInput.value = "";
      tick(); // Update greeting immediately
      return;
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
      if (validationMsg) {
        validationMsg.textContent = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
      }
      return;
    }

    StorageModule.set(NAME_KEY, trimmed);
    nameInput.value = trimmed;
    tick(); // Update greeting immediately
  }

  return { init, getGreetingPhrase, tick };
})();

// ─────────────────────────────────────────────────────────────────────────────
// TimerModule
//
// Pomodoro countdown timer with start / stop / reset and configurable duration.
// ─────────────────────────────────────────────────────────────────────────────

const TimerModule = (() => {
  const DURATION_KEY = "tld_sessionDuration";
  const DEFAULT_DURATION = 25; // minutes

  /** Session duration in minutes (1–90). */
  let sessionDuration = DEFAULT_DURATION;

  /** Remaining seconds in the current countdown. */
  let remaining = sessionDuration * 60;

  /** Absolute timestamp (ms) when the current countdown should end. */
  let targetEndTime = 0;

  /** @type {number|null} */
  let intervalId = null;

  /** Whether the timer is actively counting down. */
  let running = false;

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Format total seconds as "MM:SS" (zero-padded).
   * @param {number} totalSeconds — integer in [0, 5400]
   * @returns {string}
   */
  function formatCountdown(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mm = Math.floor(safeSeconds / 60);
    const ss = safeSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  /**
   * Validate a session duration value.
   * @param {string|number} value
   * @returns {{ valid: true, value: number } | { valid: false, message: string }}
   */
  function validateDuration(value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || String(value).trim() === "") {
      return { valid: false, message: "Please enter a whole number between 1 and 90." };
    }
    if (n < 1 || n > 90) {
      return { valid: false, message: "Session duration must be between 1 and 90 minutes." };
    }
    return { valid: true, value: n };
  }

  /** Write the current remaining time to #timer-display. */
  function updateDisplay() {
    const el = document.getElementById("timer-display");
    if (el) el.textContent = formatCountdown(remaining);
  }

  /** Sync Start / Stop button disabled states. */
  function syncButtonStates() {
    const startBtn = document.getElementById("start-btn");
    const stopBtn = document.getElementById("stop-btn");
    if (startBtn) startBtn.disabled = running;
    if (stopBtn) stopBtn.disabled = !running;
  }

  // ── Core timer actions ──────────────────────────────────────────────────────

  /** Start or resume the countdown. */
  function start() {
    if (running) return;
    if (remaining <= 0) return; // Nothing to count down

    // Request notification permission the first time Start is pressed
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    running = true;
    targetEndTime = Date.now() + remaining * 1000;
    intervalId = setInterval(tick, 1000);
    syncButtonStates();
  }

  /** Pause the countdown without resetting. */
  function stop() {
    if (!running) return;
    running = false;
    clearInterval(intervalId);
    intervalId = null;
    // Capture remaining precisely at stop time
    remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
    updateDisplay();
    syncButtonStates();
  }

  /** Stop and restore the display to the full session duration. */
  function reset() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
    remaining = sessionDuration * 60;
    updateDisplay();
    syncButtonStates();
  }

  /** Called every second while the timer is running. */
  function tick() {
    remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
    updateDisplay();
    if (remaining <= 0) {
      onComplete();
    }
  }

  /** Fired when the countdown reaches zero. */
  function onComplete() {
    running = false;
    clearInterval(intervalId);
    intervalId = null;
    remaining = 0;
    updateDisplay();
    syncButtonStates();
    playBeep();
    showNotification();
  }

  // ── Audio & notification ────────────────────────────────────────────────────

  /** Play a short audible beep via the Web Audio API. */
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.0);
    } catch {
      // Web Audio unavailable — degrade silently.
    }
  }

  /** Show a browser notification if permission is granted. */
  function showNotification() {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Focus session complete!", {
          body: `Your ${sessionDuration}-minute session has ended. Time for a break!`,
          icon: "", // No icon asset in this project
        });
      } catch {
        // Notification may fail in some contexts — degrade silently.
      }
    }
  }

  // ── Duration change handling ────────────────────────────────────────────────

  /** Handle changes to the duration input field. */
  function handleDurationChange() {
    const input = document.getElementById("duration-input");
    const validationMsg = document.getElementById("duration-validation-msg");
    if (!input) return;

    if (validationMsg) validationMsg.textContent = "";

    if (running) {
      if (validationMsg) {
        validationMsg.textContent = "Duration cannot be changed while the timer is running.";
      }
      // Restore input to current session duration
      input.value = sessionDuration;
      return;
    }

    const result = validateDuration(input.value);
    if (!result.valid) {
      if (validationMsg) validationMsg.textContent = result.message;
      input.value = sessionDuration; // Revert to last valid value
      return;
    }

    sessionDuration = result.value;
    remaining = sessionDuration * 60;
    StorageModule.set(DURATION_KEY, sessionDuration);
    updateDisplay();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  /** Bootstrap the timer widget. */
  function init() {
    const savedDuration = StorageModule.get(DURATION_KEY);
    if (savedDuration !== null) {
      const result = validateDuration(savedDuration);
      if (result.valid) sessionDuration = result.value;
    }

    remaining = sessionDuration * 60;

    const durationInput = document.getElementById("duration-input");
    if (durationInput) {
      durationInput.value = sessionDuration;
      durationInput.addEventListener("change", handleDurationChange);
    }

    updateDisplay();
    syncButtonStates();

    const startBtn = document.getElementById("start-btn");
    const stopBtn = document.getElementById("stop-btn");
    const resetBtn = document.getElementById("reset-btn");

    if (startBtn) startBtn.addEventListener("click", start);
    if (stopBtn) stopBtn.addEventListener("click", stop);
    if (resetBtn) resetBtn.addEventListener("click", reset);
  }

  return { init, formatCountdown, validateDuration, start, stop, reset };
})();

// ─────────────────────────────────────────────────────────────────────────────
// TodoModule
//
// To-do list: add, complete-toggle, inline-edit, delete.
// ─────────────────────────────────────────────────────────────────────────────

const TodoModule = (() => {
  const TASKS_KEY = "tld_tasks";
  const MAX_TASK_LENGTH = 250;

  /** @type {Array<{id:string, text:string, completed:boolean, createdAt:number}>} */
  let tasks = [];

  // ── Persistence ─────────────────────────────────────────────────────────────

  /** Persist the current tasks array; show error if storage fails. */
  function persistTasks() {
    const ok = StorageModule.set(TASKS_KEY, tasks);
    if (!ok) {
      showTaskValidationMsg("Change could not be saved.");
    }
  }

  // ── Task operations ─────────────────────────────────────────────────────────

  /**
   * Add a new task.
   * @param {string} description — raw (untrimmed) user input
   */
  function addTask(description) {
    const text = description.trim();
    const validationMsg = document.getElementById("task-validation-msg");

    if (validationMsg) validationMsg.textContent = "";

    if (text.length === 0) {
      showTaskValidationMsg("Task description cannot be empty.");
      return;
    }
    if (text.length > MAX_TASK_LENGTH) {
      showTaskValidationMsg(`Task description must be ${MAX_TASK_LENGTH} characters or fewer.`);
      return;
    }

    const task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    tasks.push(task);
    persistTasks();
    renderTasks();

    // Clear input
    const taskInput = document.getElementById("task-input");
    if (taskInput) taskInput.value = "";
  }

  /**
   * Toggle the completed state of a task.
   * @param {string} id
   */
  function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    persistTasks();
    renderTasks();
  }

  /**
   * Replace a task row with an inline edit form.
   * @param {string} id
   */
  function beginEdit(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const listItem = document.querySelector(`[data-task-id="${id}"]`);
    if (!listItem) return;

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "form-input task-edit-input";
    editInput.value = task.text;
    editInput.maxLength = MAX_TASK_LENGTH;
    editInput.setAttribute("aria-label", "Edit task text");

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn--primary";
    saveBtn.textContent = "Save";
    saveBtn.setAttribute("aria-label", "Save edited task");

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn--ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.setAttribute("aria-label", "Cancel edit");

    const editValidation = document.createElement("p");
    editValidation.className = "validation-msg";
    editValidation.setAttribute("role", "alert");

    const editRow = document.createElement("div");
    editRow.className = "input-row";
    editRow.appendChild(editInput);
    editRow.appendChild(saveBtn);
    editRow.appendChild(cancelBtn);

    // Replace list item contents
    listItem.innerHTML = "";
    listItem.appendChild(editRow);
    listItem.appendChild(editValidation);

    editInput.focus();
    editInput.select();

    saveBtn.addEventListener("click", () => saveEdit(id, editInput.value, editValidation));
    cancelBtn.addEventListener("click", () => renderTasks());
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveEdit(id, editInput.value, editValidation);
      if (e.key === "Escape") renderTasks();
    });
  }

  /**
   * Commit an inline edit.
   * @param {string}      id
   * @param {string}      newText — raw input
   * @param {HTMLElement} validationEl
   */
  function saveEdit(id, newText, validationEl) {
    const trimmed = newText.trim();

    if (validationEl) validationEl.textContent = "";

    if (trimmed.length === 0) {
      if (validationEl) validationEl.textContent = "Task text cannot be empty.";
      return;
    }
    if (trimmed.length > MAX_TASK_LENGTH) {
      if (validationEl) {
        validationEl.textContent = `Task must be ${MAX_TASK_LENGTH} characters or fewer.`;
      }
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.text = trimmed;
    persistTasks();
    renderTasks();
  }

  /**
   * Remove a task by id.
   * @param {string} id
   */
  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    persistTasks();
    renderTasks();
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  /** Rebuild the task list DOM from the in-memory tasks array. */
  function renderTasks() {
    const listEl = document.getElementById("task-list");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (tasks.length === 0) {
      const emptyMsg = document.createElement("li");
      emptyMsg.className = "task-item task-item--empty";
      emptyMsg.textContent = "No tasks yet. Add one above!";
      emptyMsg.style.color = "var(--color-text-muted)";
      listEl.appendChild(emptyMsg);
      return;
    }

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item${task.completed ? " task-completed" : ""}`;
      li.dataset.taskId = task.id;

      // Checkbox-style toggle button
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn--ghost task-toggle-btn";
      toggleBtn.setAttribute("aria-label", task.completed ? "Mark as incomplete" : "Mark as complete");
      toggleBtn.setAttribute("aria-pressed", String(task.completed));
      toggleBtn.textContent = task.completed ? "✓" : "○";
      toggleBtn.style.padding = "0.2rem 0.4rem";
      toggleBtn.style.minWidth = "1.75rem";

      // Task text
      const textSpan = document.createElement("span");
      textSpan.className = "task-item__text";
      textSpan.textContent = task.text;

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn--ghost";
      editBtn.setAttribute("aria-label", `Edit task: ${task.text}`);
      editBtn.textContent = "✏️";
      editBtn.style.padding = "0.2rem 0.4rem";
      editBtn.style.fontSize = "0.875rem";

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn--danger";
      deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
      deleteBtn.textContent = "✕";

      li.appendChild(toggleBtn);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      toggleBtn.addEventListener("click", () => toggleComplete(task.id));
      editBtn.addEventListener("click", () => beginEdit(task.id));
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      listEl.appendChild(li);
    });
  }

  // ── Validation helper ───────────────────────────────────────────────────────

  /** @param {string} msg */
  function showTaskValidationMsg(msg) {
    const el = document.getElementById("task-validation-msg");
    if (el) el.textContent = msg;
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    const stored = StorageModule.get(TASKS_KEY);

    if (stored === null) {
      tasks = [];
    } else if (!Array.isArray(stored)) {
      tasks = [];
      showTaskValidationMsg("Saved tasks could not be loaded.");
    } else {
      tasks = stored;
    }

    renderTasks();

    const taskForm = document.getElementById("task-input")
      ? document.getElementById("task-input").closest("form")
      : null;

    if (taskForm) {
      taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const taskInput = document.getElementById("task-input");
        if (taskInput) addTask(taskInput.value);
      });
    } else {
      // Fallback: wire button directly
      const addBtn = document.getElementById("add-task-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          const taskInput = document.getElementById("task-input");
          if (taskInput) addTask(taskInput.value);
        });
      }
    }
  }

  return { init, addTask, toggleComplete, beginEdit, saveEdit, deleteTask, renderTasks };
})();

// ─────────────────────────────────────────────────────────────────────────────
// LinksModule
//
// Quick-links panel: add, delete, render.
// ─────────────────────────────────────────────────────────────────────────────

const LinksModule = (() => {
  const LINKS_KEY = "tld_links";

  /** @type {Array<{id:string, label:string, url:string}>} */
  let links = [];

  // ── Persistence ─────────────────────────────────────────────────────────────

  function persistLinks() {
    const ok = StorageModule.set(LINKS_KEY, links);
    if (!ok) {
      showLinkValidationMsg("Change could not be saved.");
    }
  }

  // ── Link operations ─────────────────────────────────────────────────────────

  /**
   * Validate URL scheme.
   * @param {string} url
   * @returns {boolean}
   */
  function isValidUrl(url) {
    return url.startsWith("http://") || url.startsWith("https://");
  }

  /**
   * Add a new link after validation.
   * @param {string} label
   * @param {string} url
   */
  function addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();

    showLinkValidationMsg("");

    if (trimmedLabel.length === 0 && trimmedUrl.length === 0) {
      showLinkValidationMsg("Label and URL are required.");
      return;
    }
    if (trimmedLabel.length === 0) {
      showLinkValidationMsg("Label is required.");
      return;
    }
    if (trimmedUrl.length === 0) {
      showLinkValidationMsg("URL is required.");
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      showLinkValidationMsg("URL must start with http:// or https://");
      return;
    }

    // Duplicate check — exact label + url match
    const isDuplicate = links.some(
      (l) => l.label === trimmedLabel && l.url === trimmedUrl
    );
    if (isDuplicate) {
      showLinkValidationMsg("This link already exists.");
      return;
    }

    links.push({
      id: crypto.randomUUID(),
      label: trimmedLabel,
      url: trimmedUrl,
    });
    persistLinks();
    renderLinks();

    // Clear inputs
    const labelInput = document.getElementById("link-label-input");
    const urlInput = document.getElementById("link-url-input");
    if (labelInput) labelInput.value = "";
    if (urlInput) urlInput.value = "";
  }

  /**
   * Remove a link by id.
   * @param {string} id
   */
  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    persistLinks();
    renderLinks();
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  /** Rebuild the links panel DOM. */
  function renderLinks() {
    const panel = document.getElementById("links-panel");
    if (!panel) return;

    panel.innerHTML = "";

    if (links.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No links yet. Add one above!";
      empty.style.color = "var(--color-text-muted)";
      empty.style.fontSize = "0.875rem";
      panel.appendChild(empty);
      return;
    }

    links.forEach((link) => {
      const wrapper = document.createElement("div");
      wrapper.style.display = "inline-flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "0.25rem";

      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.textContent = link.label;
      anchor.className = "link-btn";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("aria-label", `Open ${link.label} in new tab`);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn--danger";
      deleteBtn.setAttribute("aria-label", `Delete link: ${link.label}`);
      deleteBtn.textContent = "✕";
      deleteBtn.style.padding = "0.2rem 0.4rem";
      deleteBtn.style.fontSize = "0.75rem";

      deleteBtn.addEventListener("click", () => deleteLink(link.id));

      wrapper.appendChild(anchor);
      wrapper.appendChild(deleteBtn);
      panel.appendChild(wrapper);
    });
  }

  // ── Validation helper ───────────────────────────────────────────────────────

  /** @param {string} msg */
  function showLinkValidationMsg(msg) {
    const el = document.getElementById("link-validation-msg");
    if (el) el.textContent = msg;
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    const stored = StorageModule.get(LINKS_KEY);
    links = Array.isArray(stored) ? stored : [];

    renderLinks();

    const linkForm = document.getElementById("link-label-input")
      ? document.getElementById("link-label-input").closest("form")
      : null;

    if (linkForm) {
      linkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const labelInput = document.getElementById("link-label-input");
        const urlInput = document.getElementById("link-url-input");
        addLink(labelInput ? labelInput.value : "", urlInput ? urlInput.value : "");
      });
    } else {
      // Fallback: wire button directly
      const addBtn = document.getElementById("add-link-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          const labelInput = document.getElementById("link-label-input");
          const urlInput = document.getElementById("link-url-input");
          addLink(labelInput ? labelInput.value : "", urlInput ? urlInput.value : "");
        });
      }
    }
  }

  return { init, addLink, deleteLink, renderLinks, isValidUrl };
})();

// ─────────────────────────────────────────────────────────────────────────────
// DOMContentLoaded Bootstrap
//
// Initialization order is significant:
//   1. ThemeModule  — must run before any paint to prevent FOUC
//   2. GreetingModule
//   3. TimerModule
//   4. TodoModule
//   5. LinksModule
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  ThemeModule.init();
  GreetingModule.init();
  TimerModule.init();
  TodoModule.init();
  LinksModule.init();
});
