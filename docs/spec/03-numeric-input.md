# Specification: Alphanumeric Drone Serial No. Input UI

## Problem Statement
Operators need to associate a manual Drone Serial No. with each scan. Typing errors (such as entering symbol characters or exceeding maximum character limits) can invalidate downstream accounting records. The Drone Serial No. has a strict maximum length of 9 characters.

## Solution
Implement a styled text input card at the top of the main screen. The input field must restrict typing to alphanumeric characters only, enforce a maximum length of 9 characters (`maxLength={9}`), and dynamically filter the input string to strip non-alphanumeric characters and cap length at 9 characters during change events.

## User Stories
1. As a mobile operator, I want to enter a custom Drone Serial No. into an input field so that I can label my upcoming scan.
2. As a mobile operator, I want the alphanumeric input field to reject symbol characters and limit inputs to a maximum of 9 characters so that input format errors are prevented at the source.

## Implementation Decisions
* **Component Selection**: Use native React Native `<TextInput>` styled with native styles (no external CSS utilities), configured with `maxLength={9}`.
* **Keyboard Configuration**: Set `keyboardType="default"` to support text and numbers.
* **Input Sanitization & Length Restriction**: Process change events using state hooks:
  ```typescript
  const handleTextChange = (text: string) => {
    const alphanumericOnly = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9);
    setInputNumber(alphanumericOnly);
  };
  ```
* **Visual Polish**: Add active focus indicator borders, placeholder text (e.g. `Enter Drone Serial No....`), and a character badge/hint (e.g. `Alphanumeric (max 9 chars)`).

## Testing Decisions
* **Unit Tests**: Test sanitization utility logic with inputs like `"123a"`, `"abc-123!"`, `"90-12"`, and `"1234567890EXTRA"` to ensure they resolve to `"123a"`, `"abc123"`, `"9012"`, and `"123456789"`.
* **Manual Verification**: Focus the input field on iOS/Android to verify that a standard keyboard shows up. Attempt to type symbols or paste strings longer than 9 characters to ensure they are immediately stripped and truncated to 9 characters.

## Out of Scope
* Integration with the scanner state or drive upload handlers.

## Further Notes
* Maximum character count for Drone Serial No. is 9 characters.
