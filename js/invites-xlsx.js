/**
 * Excel .xlsx de cortesías — ZIP store + sheet XML, sin dependencias (como INTEMPO).
 */
(function (global) {
  const TZ = "America/Lima";

  function xmlEscape(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function toDate(value) {
    if (value == null || value === "") return null;
    if (typeof value === "number") {
      const ms = value < 1e12 ? value * 1000 : value;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    let s = String(value).trim().replace(" ", "T");
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
      s += "Z";
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatStamp(value) {
    const d = toDate(value);
    if (!d) return "—";
    return d.toLocaleString("es-PE", {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatExpiry(sec) {
    if (!sec) return "—";
    return formatStamp(Number(sec) * 1000);
  }

  function statusOf(inv, nowSec) {
    if (inv.expiry && Number(inv.expiry) < nowSec) return "Vencida";
    if (inv.opened_at) return "Abierta";
    return "Pendiente";
  }

  function todayLong() {
    return new Date().toLocaleDateString("es-PE", {
      timeZone: TZ,
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function dateStamp() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function crc32(bytes) {
    let c = ~0;
    for (let i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  function u16(n) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  }

  function u32(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, true);
    return b;
  }

  function concatBytes(parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }

  function zipStore(files) {
    const enc = new TextEncoder();
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const { name, data } of files) {
      const nameBytes = enc.encode(name);
      const body = typeof data === "string" ? enc.encode(data) : data;
      const crc = crc32(body);
      const local = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(body.length),
        u32(body.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
        body,
      ]);
      const central = concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(body.length),
        u32(body.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    }
    const centralSize = centrals.reduce((n, p) => n + p.length, 0);
    const end = concatBytes([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralSize),
      u32(offset),
      u16(0),
    ]);
    return concatBytes([...locals, ...centrals, end]);
  }

  function inlineCell(ref, text, style) {
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xmlEscape(text)}</t></is></c>`;
  }

  function numCell(ref, n, style) {
    return `<c r="${ref}" s="${style}"><v>${n}</v></c>`;
  }

  function colLetter(i) {
    return String.fromCharCode(65 + i);
  }

  function build(rows) {
    const nowSec = Date.now() / 1000;
    const list = (rows || [])
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }));
    const headers = ["#", "Nombre", "Email", "WhatsApp", "Link", "Creado", "Vence", "Abierto", "Estado"];
    const firstDataRow = 4;
    const dataRows = list
      .map((inv, i) => {
        const r = firstDataRow + i;
        const vals = [
          inv.name || "",
          inv.email || "—",
          inv.phone || "—",
          inv.url || "—",
          formatStamp(inv.created_at),
          formatExpiry(inv.expiry),
          formatStamp(inv.opened_at),
          statusOf(inv, nowSec),
        ];
        const cells = [
          numCell(`A${r}`, i + 1, 2),
          ...vals.map((v, j) => inlineCell(colLetter(j + 1) + r, v, j === 3 || j === 2 ? 3 : 2)),
        ];
        return `<row r="${r}" ht="20" customHeight="1">${cells.join("")}</row>`;
      })
      .join("");

    const headerCells = headers.map((h, j) => inlineCell(colLetter(j) + "3", h, 1)).join("");

    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane xSplit="0" ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A4" sqref="A4"/>
    </sheetView>
  </sheetViews>
  <cols>
    <col min="1" max="1" width="5" customWidth="1"/>
    <col min="2" max="2" width="22" customWidth="1"/>
    <col min="3" max="3" width="28" customWidth="1"/>
    <col min="4" max="4" width="16" customWidth="1"/>
    <col min="5" max="5" width="42" customWidth="1"/>
    <col min="6" max="6" width="20" customWidth="1"/>
    <col min="7" max="7" width="20" customWidth="1"/>
    <col min="8" max="8" width="20" customWidth="1"/>
    <col min="9" max="9" width="12" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1" ht="28" customHeight="1">${inlineCell("A1", "Filomena — Cortesías", 5)}</row>
    <row r="2" ht="18" customHeight="1">${inlineCell("A2", list.length + " personas · " + todayLong(), 6)}</row>
    <row r="3" ht="22" customHeight="1">${headerCells}</row>
    ${dataRows}
  </sheetData>
</worksheet>`;

    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF1A1A1A"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF1A1A1A"/><name val="Consolas"/></font>
    <font><b/><sz val="11"/><color rgb="FF111111"/><name val="Consolas"/></font>
    <font><b/><sz val="16"/><color rgb="FF111111"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF010101"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left/><right/>
      <top/>
      <bottom style="thin"><color rgb="FFE8E8E8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="49" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="49" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

    const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Cortesías" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    return zipStore([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels", data: rels },
      { name: "xl/workbook.xml", data: workbook },
      { name: "xl/_rels/workbook.xml.rels", data: wbRels },
      { name: "xl/styles.xml", data: styles },
      { name: "xl/worksheets/sheet1.xml", data: sheet },
    ]);
  }

  function download(rows) {
    const list = rows || [];
    if (!list.length) return { ok: false, reason: "empty" };
    const blob = new Blob([build(list)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filomena-cortesias-${dateStamp()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, count: list.length };
  }

  // ponytail: empty list must refuse download
  console.assert(download([])?.ok === false, "xlsx empty guard");

  global.FilomenaXlsx = { build, download, dateStamp };
})(typeof window !== "undefined" ? window : globalThis);
