Flow for Your Chrome Extension
1. Content Script (Injects into the Coding Platform)
Detects when a new question is opened.
Monitors the code editor for changes (listens for keystrokes or input events).
Extracts the problem statement and user's code.
Identifies errors, incomplete logic, or common mistakes.
Displays a "Hint" button in the UI.
Tracks time for each question.
2. Background Script (Handles Persistent Events)
Listens for URL changes to detect when a new question is loaded.
Resets the timer when a new question is detected.
Listens for messages from the content script to analyze the code.
3. Popup UI (Optional but Useful)
Shows the current timer.
Displays hints when requested.
Allows users to enable/disable the extension or customize settings.
4. Hint Generation Mechanism
Uses OpenAI API or an inbuilt logic-based system.
Matches the user’s code with common patterns (e.g., syntax errors, inefficient approaches).
Provides a hint when the user clicks the button.
5. Data Storage (Chrome Storage API)
Stores time taken for each question.
Keeps track of solved/unsolved questions.
Saves user preferences (e.g., auto-hints, difficulty levels).
Implementation Context
Manifest File (manifest.json)

Define permissions (activeTab, storage, scripting).
Set background and content scripts.
Content Script (Detecting Code and Injecting UI)

Use MutationObserver to track changes in the coding platform.
Extract code and question text dynamically.
Add the "Hint" button near the editor.
Background Script (Timer and Question Detection)

Track URL changes.
Manage the timer and reset it on new questions.
Hint System (Logic or AI-Generated)

Use AI APIs like OpenAI for advanced hints.
Create predefined hint patterns for common mistakes.
Popup UI (For Settings & Timer)

Display hints when clicked.
Show the timer with an option to pause/reset.