# Specification: XML Serializer Utility

## Problem Statement
The app must save scanned entries using a specific XML format. We need a reliable formatting subsystem that handles arbitrary character strings safely without corrupting the file structure.

## Solution
Implement a pure JavaScript serializer helper `src/utils/xml.ts` that takes scan inputs and builds an escaped XML string strictly complying with the schema format of `Battery_DATA.xml`.

## User Stories
1. As a mobile operator, I want to see the formatted XML output contents (visual representation) in a preview card before uploading so that I can verify the final file output.

## Implementation Decisions
* **Serializer**: A pure JavaScript string layout generator with zero native code dependencies (perfect for cross-platform compatibility).
* **Field Mapping**:
  * `<BatteryCode>`: Derived from manual user input (numeric/string code).
  * `<DroneSerial>`: Derived from scanned QR code data.
  * `<Date>`: Today's date formatted as `YYYY-MM-DD`.
  * Additional elements (`<Replacement>`, `<FOM>`, `<FOMdate>`, `<FOM2>`, `<FOM2date>`, `<FOM3>`, `<FOM3date>`): Included as empty tags to match the full structure in `Battery_DATA.xml`.
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
  <?xml version="1.0" encoding="utf-8"?>
  <QRCodeScans>
    <Scan>
      <BatteryCode>[EscapedBatteryCode]</BatteryCode>
      <DroneSerial>[EscapedDroneSerial]</DroneSerial>
      <Date>[YYYY-MM-DD DateString]</Date>
      <Replacement></Replacement>
      <FOM></FOM>
      <FOMdate></FOMdate>
      <FOM2></FOM2>
      <FOM2date></FOM2date>
      <FOM3></FOM3>
      <FOM3date></FOM3date>
    </Scan>
  </QRCodeScans>
  ```

## Testing Decisions
* **Unit Tests**: Add tests verifying that special characters in input parameters are correctly escaped, date formatting output is `YYYY-MM-DD`, and the XML tag layout matches `Battery_DATA.xml`.

## Out of Scope
* Parsing XML files or local cache serialization.

## Further Notes
* None.

