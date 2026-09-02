# Specification: XML Serializer & Manipulator Utility

## Problem Statement
The app must manage scan records stored in `Battery_DATA.xml`. When saving new scans, the app must either format a fresh XML payload or parse an existing `Battery_DATA.xml` string fetched from Google Drive and append the new scan record to it safely without corrupting the file structure or existing data.

## Solution
Implement pure JavaScript XML serializer and manipulator helpers in `src/utils/xml.ts` that:
1. Formats individual scan entries into XML nodes complying strictly with the `Battery_DATA.xml` schema.
2. Parses an existing `Battery_DATA.xml` string and appends/inserts the new scan record inside the root `<QRCodeScans>` container element.

## User Stories
1. As a mobile operator, I want to see the formatted XML output contents (visual representation) in a preview card before uploading so that I can verify the final scan data.
2. As a mobile operator, I want new scans to be appended into the existing `Battery_DATA.xml` document so that historic scan data in Google Drive is preserved.

## Implementation Decisions
* **Serializer & Manipulator Engine**: Pure JavaScript string and layout manipulation with zero native code dependencies (ensuring cross-platform compatibility with React Native / Expo).
* **Field Mapping for Scan Record**:
  * `<BatteryCode>`: Derived from scanned Battery Serial No. QR code data (restricted to max 9 characters).
  * `<DroneSerial>`: Derived from manual Drone Serial No. user input (restricted to max 9 characters).
  * `<Date>`: Today's date formatted as `YYYY-MM-DD`.
  * Additional elements (`<Replacement>`, `<FOM>`, `<FOMdate>`, `<FOM2>`, `<FOM2date>`, `<FOM3>`, `<FOM3date>`): Included as empty tags to match the schema format in `Battery_DATA.xml`.
* **Field Length Constraints**: `<BatteryCode>` and `<DroneSerial>` elements must never exceed 9 characters. The serializer truncates values to a maximum of 9 characters before XML escaping.
* **XML Escaping**: Characters like `<`, `>`, `&`, `"`, and `'` must be safely escaped using `escapeXml`.
* **Appending Scan Data**:
  * Utility function (e.g. `appendScanToXml(existingXmlString, newScanData)`):
    * If `existingXmlString` is non-empty and valid `Battery_DATA.xml`: Inserts the serialized `<Scan>...</Scan>` block directly before the closing `</QRCodeScans>` tag.
    * If `existingXmlString` is empty, missing, or invalid: Generates a complete fresh XML document with the root header `<?xml version="1.0" encoding="utf-8"?>` and `<QRCodeScans>` wrapper surrounding the single scan.
* **Duplicate Battery Code Checking**:
  * Utility function `batteryCodeExistsInXml(existingXmlString, batteryCode)`:
    * Parses existing XML content and returns `true` if any existing `<Scan>` block contains a matching `<BatteryCode>` element (case-insensitive, trimmed).
* **Output Format**:
  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <QRCodeScans>
    <Scan>
      <BatteryCode>GE0588927</BatteryCode>
      <DroneSerial>R12022019</DroneSerial>
      <Date>2025-08-08</Date>
      <Replacement></Replacement>
      <FOM></FOM>
      <FOMdate></FOMdate>
      <FOM2></FOM2>
      <FOM2date></FOM2date>
      <FOM3></FOM3>
      <FOM3date></FOM3date>
    </Scan>
    <!-- Appended new scan entry -->
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
* **Unit Tests**:
  * Verify single scan XML serialization and tag structure.
  * Verify XML special character escaping.
  * Verify appending a scan entry to an existing `Battery_DATA.xml` string with single and multiple existing `<Scan>` elements.
  * Verify fallback generation of fresh root document when existing XML is empty or malformed.

## Out of Scope
* Native DOM/SAX XML parsers requiring native C/C++ bindings.
* Editing or deleting existing `<Scan>` records already present in the XML.

## Further Notes
* Simple string insertion before `</QRCodeScans>` avoids heavy external XML parser dependencies while guaranteeing strict compatibility with the target `Battery_DATA.xml` format.


