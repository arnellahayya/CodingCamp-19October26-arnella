# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It helps users organize their day by combining a live greeting with the current time and date, a configurable Pomodoro focus timer, a persistent to-do list, and a customizable quick-links panel. All data is stored client-side using the Browser Local Storage API. The dashboard supports light/dark mode, a custom user name in the greeting, and an adjustable Pomodoro session length.

## Glossary

- **Dashboard**: The single HTML page that hosts all four feature widgets.
- **Greeting_Widget**: The section of the Dashboard that displays the current time, date, and a personalized greeting message.
- **Timer_Widget**: The Pomodoro-style focus timer section of the Dashboard.
- **Todo_Widget**: The to-do list section of the Dashboard.
- **Links_Widget**: The quick-links section of the Dashboard.
- **Storage**: The Browser Local Storage API used to persist all user data.
- **Task**: A single to-do item with a text description and a completion state.
- **Link**: A quick-link record consisting of a label and a URL.
- **Session_Duration**: The configurable length (in minutes) of a single Pomodoro work session.
- **Theme**: The active color scheme of the Dashboard, either "light" or "dark".
- **User_Name**: An optional custom name the user provides to personalize the greeting.

---

## Requirements

### Requirement 1: Live Greeting and Date/Time Display

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I am immediately oriented to the present moment.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS 24-hour format, updated every second without a page reload.
2. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 19 October 2026").
3. IF the local hour is between 05 and 11 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
4. IF the local hour is between 12 and 17 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. IF the local hour is between 18 and 20 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
6. IF the local hour is between 21 and 23 inclusive OR between 00 and 04 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHERE a User_Name has been saved, THE Greeting_Widget SHALL append the User_Name to the greeting separated by a comma and a space (e.g., "Good Morning, Arnella").
8. WHERE no User_Name has been saved, THE Greeting_Widget SHALL display the greeting without a name suffix.

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting feels personal to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field where the user can enter a User_Name.
2. WHEN the user submits a User_Name containing at least one non-whitespace character, THE Storage SHALL persist the trimmed User_Name so that it survives a page reload.
3. WHEN the page loads, THE Greeting_Widget SHALL read the User_Name from Storage and display it within 300 milliseconds of the page becoming interactive.
4. WHEN the user clears the User_Name field and saves, THE Storage SHALL remove the User_Name entry.
5. WHEN the Storage contains no User_Name entry, THE Greeting_Widget SHALL display the greeting without a name suffix in the form "Good [Time of Day]!".
6. IF the user submits a User_Name longer than 50 characters, THEN THE Dashboard SHALL reject the input and display an inline validation message indicating the 50-character limit.
7. IF the user submits a User_Name consisting entirely of whitespace characters, THEN THE Dashboard SHALL treat the input as empty and THE Storage SHALL remove the User_Name entry.

---

### Requirement 3: Pomodoro Focus Timer

**User Story:** As a user, I want a focus timer so that I can work in structured intervals and stay productive.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a countdown in MM:SS format.
2. WHEN the Timer_Widget is first loaded and no session is active, THE Timer_Widget SHALL display the current Session_Duration as the starting value (e.g., "25:00").
3. WHEN the user presses Start, THE Timer_Widget SHALL begin counting down one second per tick, reducing the displayed MM:SS value by one second each tick.
4. WHEN the user presses Stop, THE Timer_Widget SHALL pause the countdown without resetting it, transitioning the session to a paused state.
5. WHEN the user presses Reset, THE Timer_Widget SHALL stop the countdown and restore the display to the current Session_Duration.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop automatically, play an audible alert, and, if browser notification permission has been granted, display a browser notification indicating the session has ended.
7. IF browser notification permission has not been granted, THEN THE Timer_Widget SHALL rely solely on the audible alert when the countdown reaches 00:00.
8. WHILE a session is running (Start has been pressed and Stop has not been pressed and 00:00 has not been reached), THE Timer_Widget SHALL disable the Start button and enable the Stop button.
9. WHILE no session is running (on initial load, after Stop is pressed, after Reset is pressed, or after the countdown reaches 00:00), THE Timer_Widget SHALL enable the Start button and disable the Stop button.

---

### Requirement 4: Configurable Pomodoro Session Duration

**User Story:** As a user, I want to change the Pomodoro duration so that I can adapt the timer to my preferred focus intervals.

#### Acceptance Criteria

1. THE Timer_Widget SHALL provide a numeric input or selector that allows the user to set the Session_Duration in whole minutes between 1 and 90.
2. WHILE the timer is not active, WHEN the user changes the Session_Duration, THE Timer_Widget SHALL update the displayed countdown to reflect the new Session_Duration within 200 milliseconds.
3. WHEN the user confirms a new Session_Duration value by submitting the input or committing the selector choice, THE Storage SHALL persist the value so that it survives a page reload.
4. WHEN the page loads and a Session_Duration value is present in Storage, THE Timer_Widget SHALL read and apply that stored Session_Duration as the displayed countdown.
5. IF the page loads and no Session_Duration value is present in Storage, THEN THE Timer_Widget SHALL set the Session_Duration to 25 minutes and display that value as the countdown.
6. IF the user enters a Session_Duration outside the 1–90 minute range, THEN THE Timer_Widget SHALL reject the value, retain the previously valid Session_Duration, and display an inline validation message indicating that the accepted range is 1 to 90 minutes.
7. WHILE the timer is active, IF the user attempts to change the Session_Duration, THEN THE Timer_Widget SHALL ignore the change and display an inline message indicating that the duration cannot be changed while the timer is running.

---

### Requirement 5: To-Do List Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks so that I can track what needs to be done today.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide a text input and an "Add" button to create a new Task.
2. WHEN the user submits a non-empty task description of 1–250 characters, THE Todo_Widget SHALL add the Task to the list and clear the input field.
3. IF the user submits an empty task description, THEN THE Todo_Widget SHALL reject the submission and display an inline validation message.
4. WHEN the user marks a Task as done, THE Todo_Widget SHALL apply a strikethrough style to the task text to distinguish it from incomplete tasks.
5. WHEN the user marks a completed Task as undone, THE Todo_Widget SHALL remove the strikethrough style and restore the Task to the incomplete state.
6. WHEN the user activates the edit action on a Task, THE Todo_Widget SHALL display the existing task text in an editable field inline.
7. WHEN the user saves an edited Task with a description of 1–250 characters, THE Todo_Widget SHALL update the Task text.
8. IF the user saves an edited Task with an empty description, THEN THE Todo_Widget SHALL reject the update and display an inline validation message.
9. WHEN the user deletes a Task, THE Todo_Widget SHALL remove it from the list.
10. WHEN any Task state changes (add, edit, complete, delete), THE Storage SHALL persist the full task list in the order tasks were added so that it survives a page reload.
11. IF Storage fails to persist a Task state change, THEN THE Todo_Widget SHALL display an inline error message indicating that the change could not be saved.
12. WHEN the page loads, THE Todo_Widget SHALL read all Tasks from Storage and render them in their saved state and saved order.
13. IF Storage is unavailable or returns corrupted data on page load, THEN THE Todo_Widget SHALL render an empty task list and display an error message indicating that saved tasks could not be loaded.

---

### Requirement 6: Quick Links Panel

**User Story:** As a user, I want to save and open my favorite websites from the dashboard so that I can navigate quickly without searching.

#### Acceptance Criteria

1. THE Links_Widget SHALL provide a form with a label input and a URL input to add a new Link.
2. WHEN the user submits a Link with a non-empty label and a non-empty URL that begins with "http://" or "https://", THE Links_Widget SHALL add it to the panel.
3. IF the user submits a Link with an empty label or an empty URL, THEN THE Links_Widget SHALL reject the submission and display an inline validation message identifying which field or fields are empty.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Links_Widget SHALL reject the URL and display an inline validation message indicating the URL format requirement.
5. WHEN the user clicks a Link button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
6. WHEN the user deletes a Link, THE Links_Widget SHALL remove it from the panel within one rendering cycle with no intermediate loading state visible to the user.
7. WHEN any Link state changes (add, delete), THE Storage SHALL persist the full links list so that it survives a page reload.
8. WHEN the page loads, THE Links_Widget SHALL read all Links from Storage and render them.
9. THE Links_Widget SHALL support a minimum of 20 saved Links, where all saved Links remain individually visible and accessible via scrolling with no overlapping or truncated Link buttons.
10. IF the user submits a Link whose label and URL both exactly match an existing saved Link, THEN THE Links_Widget SHALL reject the submission and display an inline validation message indicating the Link already exists.

---

### Requirement 7: Light / Dark Mode

**User Story:** As a user, I want to switch between light and dark color schemes so that the dashboard is comfortable to use in any lighting condition.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control to change the active Theme.
2. WHEN the user activates the toggle, THE Dashboard SHALL switch from the current Theme to the opposite Theme within 100 milliseconds without a page reload.
3. WHEN the Theme changes, THE Storage SHALL persist the selected Theme value so that it survives a browser restart.
4. WHEN the page loads, THE Dashboard SHALL read the Theme from Storage and apply it before any visible content is painted, preventing a flash of unstyled content.
5. WHERE no Theme has been saved in Storage, THE Dashboard SHALL default to the user's operating system color-scheme preference using the CSS `prefers-color-scheme` media query.
6. THE Dashboard SHALL apply the Theme exclusively through a single CSS file located at `css/style.css` using CSS custom properties (variables) for all color values.
7. IF Storage is unavailable on page load, THEN THE Dashboard SHALL fall back to applying the `prefers-color-scheme` preference without error.

---

### Requirement 8: Single-File Architecture Constraints

**User Story:** As a developer, I want the project to follow a strict single-file-per-type structure so that the codebase is easy to navigate and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a single `index.html` file at the project root.
2. THE Dashboard SHALL reference exactly one CSS file located at `css/style.css`.
3. THE Dashboard SHALL reference exactly one JavaScript file located at `js/app.js`.
4. THE `js/app.js` file SHALL contain all JavaScript logic with no inline `<script>` blocks in `index.html`.
5. THE `css/style.css` file SHALL contain all style rules with no inline `<style>` blocks or inline `style` attributes in `index.html`.

---

### Requirement 9: Browser Compatibility

**User Story:** As a user, I want the dashboard to work correctly in all major modern browsers so that I am not locked into a single browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render all visual elements and execute all interactive features without errors in the current stable release of Google Chrome.
2. THE Dashboard SHALL render all visual elements and execute all interactive features without errors in the current stable release of Mozilla Firefox.
3. THE Dashboard SHALL render all visual elements and execute all interactive features without errors in the current stable release of Microsoft Edge.
4. THE Dashboard SHALL render all visual elements and execute all interactive features without errors in the current stable release of Apple Safari.
5. THE Dashboard SHALL use only Web APIs available in all four browsers without polyfills or transpilation.

---

### Requirement 10: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to load quickly and feel responsive so that it does not slow me down.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render in under 2 seconds when loaded on a simulated Fast 4G network profile (10 Mbps download, 0ms added latency).
2. THE Dashboard SHALL produce a visible UI change in response to user interactions (button clicks, input submissions) within 100 milliseconds.
3. THE Dashboard SHALL render without horizontal scrolling on viewport widths from 320 px to 2560 px.
4. THE Dashboard SHALL use CSS Flexbox or CSS Grid for layout so that all widgets resize proportionally and remain fully visible without content overflow at any supported viewport width.
