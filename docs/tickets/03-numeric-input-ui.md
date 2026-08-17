# 03 — Alphanumeric Reference Input UI & Sanitization

**What to build:**
A styled input card at the top of the main screen where users enter an alphanumeric reference number for the scan. Configure the virtual keyboard to show a standard keyboard, and sanitize text updates on the fly so any non-alphanumeric characters (spaces, symbols, punctuation) are instantly stripped out.

**Blocked by:** 02 — Single-Screen Navigation and Layout Setup

**Status:** ready-for-agent

- [ ] A styled text input field is visible on the main screen with clear placeholder text.
- [ ] Focusing the text input triggers a standard keyboard.
- [ ] Any typed or pasted spaces, punctuation, or symbols are immediately stripped from the text field.
- [ ] Unit tests verify the sanitization logic correctly extracts alphanumeric characters (e.g. "123a" -> "123a", "abc-90" -> "abc90").
