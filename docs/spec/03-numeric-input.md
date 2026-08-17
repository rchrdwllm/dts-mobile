# Specification: Alphanumeric Reference Input UI

## Problem Statement
Operators need to associate a manual reference code with each scan. Typing errors (such as entering symbol characters) can invalidate downstream accounting records.

## Solution
Implement a styled text input card at the top of the main screen. The input field must restrict typing to alphanumeric characters only and dynamically filter the input string to strip out non-alphanumeric characters during change events.

## User Stories
1. As a mobile operator, I want to enter a custom alphanumeric identifier into an input field so that I can label my upcoming scan.
2. As a mobile operator, I want the alphanumeric input field to reject symbol characters so that input format errors are prevented at the source.

## Implementation Decisions
* **Component Selection**: Use native React Native `<TextInput>` styled with native styles (no external CSS utilities).
* **Keyboard Configuration**: Set `keyboardType="default"` to support text and numbers.
* **Input Sanitization**: Process change events using state hooks:
  ```typescript
  const handleTextChange = (text: string) => {
    const alphanumericOnly = text.replace(/[^a-zA-Z0-9]/g, '');
    setInputNumber(alphanumericOnly);
  };
  ```
* **Visual Polish**: Add active focus indicator borders and a placeholder text (e.g. `Enter Reference Number...`).

## Testing Decisions
* **Unit Tests**: Test sanitization utility logic with inputs like `"123a"`, `"abc-123!"`, and `"90-12"` to ensure they resolve to `"123a"`, `"abc123"`, and `"9012"`.
* **Manual Verification**: Focus the input field on iOS/Android to verify that a standard keyboard shows up. Attempt to type symbols (e.g. using copy-paste) to ensure they are immediately stripped.

## Out of Scope
* Integration with the scanner state or drive upload handlers.

## Further Notes
* None.
