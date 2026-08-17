# 04 — XML Serializer & Scan Preview Card UI

**What to build:**
A pure JavaScript XML serializer utility that formats numeric inputs, QR code data, and timestamp strings into standard XML, escaping special characters to avoid parsing errors. Add a preview card in the UI displaying a live view of the XML payload using the input reference number and a mock QR payload.

**Blocked by:** 03 — Alphanumeric Reference Input UI & Sanitization

**Status:** ready-for-agent

- [ ] XML serializer utility correctly formats and escapes characters like `<`, `>`, `&`, `"`, `'` into matching XML entities.
- [ ] Unit tests cover various inputs, proving correct escaping and structural formatting.
- [ ] A styled scan preview card is shown in the UI containing a live read-only display of the formatted XML payload.
