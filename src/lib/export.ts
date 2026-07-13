export type ExportSlide = {
  id: string;
  role: string;
  eyebrow: string;
  title: string;
  body: string;
  points?: string[];
  number?: string;
};

export type ExportTheme = {
  background: string;
  text: string;
  muted: string;
  accent: string;
  surface: string;
};

export type ExportBrand = {
  name: string;
  handle: string;
};

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function visualUnits(character: string): number {
  if (/\s/u.test(character)) return 0.32;
  if (/[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff]/u.test(character)) return 1;
  if (/[A-Z0-9]/u.test(character)) return 0.64;
  if (/[a-z]/u.test(character)) return 0.53;
  return 0.48;
}

function measureUnits(value: string): number {
  return Array.from(value).reduce((sum, character) => sum + visualUnits(character), 0);
}

/** Wrap Latin words at spaces while still allowing natural character wrapping for Korean. */
function wrapText(value: string, maxUnits: number, maxLines: number): string[] {
  const lines: string[] = [];

  for (const paragraph of String(value ?? "").replace(/\r\n?/g, "\n").split("\n")) {
    if (!paragraph) {
      if (lines.length) lines.push("");
      continue;
    }

    let remaining = paragraph.trim();
    while (remaining && lines.length < maxLines) {
      const characters = Array.from(remaining);
      let width = 0;
      let fit = 0;
      let lastWhitespace = -1;

      for (let index = 0; index < characters.length; index += 1) {
        width += visualUnits(characters[index]);
        if (/\s/u.test(characters[index])) lastWhitespace = index;
        if (width > maxUnits) break;
        fit = index + 1;
      }

      if (fit >= characters.length) {
        lines.push(remaining.trim());
        remaining = "";
        continue;
      }

      const breakAt = lastWhitespace > 0 && lastWhitespace <= fit ? lastWhitespace : Math.max(1, fit);
      lines.push(characters.slice(0, breakAt).join("").trimEnd());
      remaining = characters
        .slice(breakAt + (lastWhitespace === breakAt ? 1 : 0))
        .join("")
        .trimStart();
    }

    if (lines.length >= maxLines) break;
  }

  const hasOverflow = lines.length === maxLines && measureUnits(lines.join(" ")) < measureUnits(String(value));
  if (hasOverflow && lines.length) {
    let last = lines[lines.length - 1].trimEnd();
    while (last && measureUnits(`${last}…`) > maxUnits) last = Array.from(last).slice(0, -1).join("");
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }

  return lines.length ? lines : [""];
}

function textBlock(
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  attributes: string,
): string {
  return `<text x="${x}" y="${y}" ${attributes}>${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

export function renderSlideSvg(
  slide: ExportSlide,
  theme: ExportTheme,
  brand: ExportBrand,
  index: number,
  total: number,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): string {
  const sx = width / DEFAULT_WIDTH;
  const sy = height / DEFAULT_HEIGHT;
  const scale = Math.min(sx, sy);
  const x = (value: number) => Math.round(value * sx * 100) / 100;
  const y = (value: number) => Math.round(value * sy * 100) / 100;
  const font = (value: number) => Math.round(value * scale * 100) / 100;
  const titleLines = wrapText(slide.title, 17.2, slide.points?.length ? 3 : 4);
  const bodyLines = wrapText(slide.body, 34, slide.points?.length ? 3 : 6);
  const visiblePoints = (slide.points ?? []).filter(Boolean).slice(0, 4);
  const pageNumber = slide.number?.trim() || String(index + 1).padStart(2, "0");
  const safeTotal = Math.max(1, total);
  const progress = Math.min(1, Math.max(0, (index + 1) / safeTotal));
  const titleY = titleLines.length <= 2 ? 405 : titleLines.length === 3 ? 355 : 320;
  const titleLineHeight = 103;
  const titleBottom = titleY + (titleLines.length - 1) * titleLineHeight;
  const bodyY = Math.max(690, titleBottom + 145);
  const pointsY = bodyY + bodyLines.length * 46 + 66;

  const pointsMarkup = visiblePoints
    .map((point, pointIndex) => {
      const pointLines = wrapText(point, 30, 2);
      const top = pointsY + pointIndex * 94;
      return `<g>
        <circle cx="${x(98)}" cy="${y(top - 8)}" r="${font(5)}" fill="${escapeXml(theme.accent)}"/>
        ${textBlock(pointLines, x(128), y(top), y(38), `fill="${escapeXml(theme.text)}" font-size="${font(29)}" font-weight="620"`)}
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="slide-title slide-desc">
  <title id="slide-title">${escapeXml(slide.title)}</title>
  <desc id="slide-desc">${escapeXml(slide.body)}</desc>
  <rect width="${width}" height="${height}" fill="${escapeXml(theme.background)}"/>
  <circle cx="${x(1000)}" cy="${y(105)}" r="${font(260)}" fill="${escapeXml(theme.accent)}" opacity="0.08"/>
  <circle cx="${x(1030)}" cy="${y(30)}" r="${font(116)}" fill="none" stroke="${escapeXml(theme.accent)}" stroke-width="${font(2)}" opacity="0.35"/>
  <path d="M ${x(74)} ${y(122)} H ${x(1006)}" stroke="${escapeXml(theme.surface)}" stroke-width="${font(2)}"/>
  <g font-family="Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif">
    <rect x="${x(74)}" y="${y(72)}" width="${x(11)}" height="${y(11)}" rx="${font(3)}" fill="${escapeXml(theme.accent)}"/>
    <text x="${x(102)}" y="${y(86)}" fill="${escapeXml(theme.muted)}" font-size="${font(24)}" font-weight="700" letter-spacing="${font(2.4)}">${escapeXml((slide.eyebrow || slide.role).toUpperCase())}</text>
    <text x="${x(1006)}" y="${y(86)}" text-anchor="end" fill="${escapeXml(theme.muted)}" font-size="${font(22)}" font-weight="650">${escapeXml(pageNumber)} / ${String(safeTotal).padStart(2, "0")}</text>
    <rect x="${x(74)}" y="${y(230)}" width="${x(54)}" height="${y(6)}" rx="${font(3)}" fill="${escapeXml(theme.accent)}"/>
    ${textBlock(titleLines, x(74), y(titleY), y(titleLineHeight), `fill="${escapeXml(theme.text)}" font-size="${font(81)}" font-weight="830" letter-spacing="${font(-2.7)}"`)}
    ${textBlock(bodyLines, x(76), y(bodyY), y(46), `fill="${escapeXml(theme.muted)}" font-size="${font(31)}" font-weight="480" letter-spacing="${font(-0.35)}"`)}
    ${pointsMarkup}
    <rect x="${x(74)}" y="${y(1254)}" width="${x(932)}" height="${y(3)}" rx="${font(1.5)}" fill="${escapeXml(theme.surface)}"/>
    <rect x="${x(74)}" y="${y(1254)}" width="${x(932 * progress)}" height="${y(3)}" rx="${font(1.5)}" fill="${escapeXml(theme.accent)}"/>
    <text x="${x(74)}" y="${y(1306)}" fill="${escapeXml(theme.text)}" font-size="${font(23)}" font-weight="760">${escapeXml(brand.name)}</text>
    <text x="${x(1006)}" y="${y(1306)}" text-anchor="end" fill="${escapeXml(theme.muted)}" font-size="${font(21)}" font-weight="560">${escapeXml(brand.handle)}</text>
  </g>
</svg>`;
}

export function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("이 브라우저에서는 Canvas를 사용할 수 없습니다.");
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("PNG 이미지 생성에 실패했습니다."));
        }, "image/png");
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("SVG 이미지를 불러오지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function slideFilename(index: number): string {
  return `cardnews-${String(index + 1).padStart(2, "0")}.png`;
}

export async function exportSinglePng(
  slide: ExportSlide,
  theme: ExportTheme,
  brand: ExportBrand,
  index = 0,
  total = 1,
  filename = slideFilename(index),
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): Promise<void> {
  const svg = renderSlideSvg(slide, theme, brand, index, total, width, height);
  const png = await svgToPngBlob(svg, width, height);
  downloadBlob(png, filename);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()): { date: number; time: number } {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

function uint16(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function uint32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

type ZipEntry = { name: string; data: Uint8Array };

function createStoredZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  const { date, time } = dosDateTime();
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(time),
      uint16(date),
      uint32(checksum),
      uint32(entry.data.length),
      uint32(entry.data.length),
      uint16(name.length),
      uint16(0),
      name,
    ]);
    localChunks.push(localHeader, entry.data);

    centralChunks.push(
      concatBytes([
        uint32(0x02014b50),
        uint16(20),
        uint16(20),
        uint16(0x0800),
        uint16(0),
        uint16(time),
        uint16(date),
        uint32(checksum),
        uint32(entry.data.length),
        uint32(entry.data.length),
        uint16(name.length),
        uint16(0),
        uint16(0),
        uint16(0),
        uint16(0),
        uint32(0),
        uint32(localOffset),
        name,
      ]),
    );

    localOffset += localHeader.length + entry.data.length;
  }

  const localData = concatBytes(localChunks);
  const centralDirectory = concatBytes(centralChunks);
  const endOfCentralDirectory = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(localData.length),
    uint16(0),
  ]);

  return new Blob(
    [localData as BlobPart, centralDirectory as BlobPart, endOfCentralDirectory as BlobPart],
    { type: "application/zip" },
  );
}

export async function exportPngZip(
  slides: ExportSlide[],
  theme: ExportTheme,
  brand: ExportBrand,
  filename = "cardnews.zip",
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): Promise<void> {
  if (!slides.length) throw new Error("내보낼 카드가 없습니다.");

  const entries: ZipEntry[] = [];
  for (let index = 0; index < slides.length; index += 1) {
    const svg = renderSlideSvg(slides[index], theme, brand, index, slides.length, width, height);
    const png = await svgToPngBlob(svg, width, height);
    entries.push({ name: slideFilename(index), data: new Uint8Array(await png.arrayBuffer()) });
  }

  downloadBlob(createStoredZip(entries), filename);
}

export async function printDeckPdf(
  slides: ExportSlide[],
  theme: ExportTheme,
  brand: ExportBrand,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
): Promise<void> {
  if (!slides.length) throw new Error("인쇄할 카드가 없습니다.");

  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("PDF 인쇄 창이 차단되었습니다. 팝업을 허용해 주세요.");

  const pages = slides
    .map(
      (slide, index) =>
        `<section class="page">${renderSlideSvg(slide, theme, brand, index, slides.length, width, height)}</section>`,
    )
    .join("");

  const ready = new Promise<void>((resolve) => {
    printWindow.addEventListener("load", () => resolve(), { once: true });
  });

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(brand.name)} 카드뉴스</title>
  <style>
    @page { size: ${width}px ${height}px; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .page { width: ${width}px; height: ${height}px; margin: 0; break-after: page; page-break-after: always; overflow: hidden; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    svg { display: block; width: 100%; height: 100%; }
    @media screen { body { background: #ddd; } .page { margin: 24px auto; box-shadow: 0 8px 30px #0003; } }
    @media print { .page { margin: 0; box-shadow: none; } }
  </style>
</head>
<body>${pages}</body>
</html>`);
  printWindow.document.close();

  await Promise.race([ready, new Promise<void>((resolve) => window.setTimeout(resolve, 500))]);
  await printWindow.document.fonts?.ready;
  printWindow.focus();
  printWindow.print();
}
