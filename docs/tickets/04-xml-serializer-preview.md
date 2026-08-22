# 04 — XML Serializer & Scan Preview Card UI

**What to build:**
A pure JavaScript XML serializer utility that formats Battery Serial No. inputs, Drone Serial No. QR code data, and timestamp strings into standard XML, escaping special characters to avoid parsing errors. Add a preview card in the UI displaying a live view of the XML payload using the input Battery Serial No. and a mock Drone Serial No. payload.

**Blocked by:** 03 — Alphanumeric Battery Serial No. Input UI & Sanitization

**Status:** ready-for-agent

- [ ] XML serializer utility correctly formats and escapes characters like `<`, `>`, `&`, `"`, `'` into matching XML entities.
- [ ] Unit tests cover various inputs, proving correct escaping and structural formatting.
- [ ] A styled scan preview card is shown in the UI containing a live read-only display of the formatted XML payload.
