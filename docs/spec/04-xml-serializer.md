# Specification: XML Serializer Utility

## Problem Statement
The app must save scanned entries using a specific XML format. We need a reliable formatting subsystem that handles arbitrary character strings safely without corrupting the file structure.

## Solution
Implement a pure JavaScript serializer helper `src/utils/xml.ts` that takes scan inputs and builds an escaped XML string strictly complying with the Option A tag format.

## User Stories
1. As a mobile operator, I want to see the formatted XML output contents (visual representation) in a preview card before uploading so that I can verify the final file output.

## Implementation Decisions
* **Serializer**: A pure JavaScript string layout generator with zero native code dependencies (perfect for cross-platform compatibility).
* **XML Escaping**: Characters like `<`, `>`, `&`, `"`, and `'` must be correctly formatted to prevent parsing failures downstream:
  ```typescript
  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };
  ```
* **Output Format**:
  ```xml
  <ScanRecord>
    <InputNumber>[EscapedNumber]</InputNumber>
    <QRCodeData>[EscapedQRData]</QRCodeData>
    <Timestamp>[ISO 8601 DateString]</Timestamp>
  </ScanRecord>
  ```

## Testing Decisions
* **Unit Tests**: Add tests verifying that special characters in input parameters are correctly escaped, and the formatting output tags match requirements perfectly.

## Out of Scope
* Parsing XML files or local cache serialization.

## Further Notes
* None.
