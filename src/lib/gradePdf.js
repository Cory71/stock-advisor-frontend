// Draws a stock's grade report as a PDF and saves it.
//
// Loaded only when someone clicks "Download PDF" on the grade page, so the PDF
// library never slows down the rest of the app. The content comes from
// gradeReport.js and the chart positions from pdfChart.js; this file only
// draws.
//
// Colours are fixed for a white page and never read the site's theme, so a
// visitor in dark mode still gets a normal, printable report.

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { gradeReport } from './gradeReport';
import { chartLayout } from './pdfChart';

const LEFT = 14;                      // page margin, in millimetres
const TEXT = [33, 37, 41];            // near-black body text
const MUTED = [108, 117, 125];        // grey for secondary text
const BLUE = [13, 110, 253];          // revenue bars and table headers
const TEAL = [32, 201, 151];          // second series bars
const GRID = [222, 226, 230];         // chart gridlines

// Letter colours, matching the page (amber darkened so it reads on white).
const GRADE_COLORS = {
  A: [25, 135, 84], B: [13, 110, 253], C: [204, 140, 0], D: [204, 140, 0], F: [220, 53, 69],
};
const RESULT_COLORS = { Pass: [25, 135, 84], Fail: [220, 53, 69], 'N/A': MUTED };

// ---------- Small drawing helpers ----------

function setColor(doc, rgb) {
  doc.setTextColor(...rgb);
}

// Width of the writable area.
function contentWidth(doc) {
  return doc.internal.pageSize.getWidth() - LEFT * 2;
}

// Start a new page when fewer than `needed` millimetres are left.
function makeRoom(doc, y, needed) {
  if (y + needed < doc.internal.pageSize.getHeight() - 15) return y;
  doc.addPage();
  return 20;
}

// Wrapped text. Returns the y position just below it.
function paragraph(doc, text, y, { size = 10, color = TEXT } = {}) {
  doc.setFontSize(size);
  setColor(doc, color);
  const lines = doc.splitTextToSize(text, contentWidth(doc));
  y = makeRoom(doc, y, lines.length * size * 0.45);
  doc.text(lines, LEFT, y);
  return y + lines.length * size * 0.42 + 3;
}

function heading(doc, text, y) {
  y = makeRoom(doc, y, 25);
  doc.setFontSize(13);
  setColor(doc, TEXT);
  doc.text(text, LEFT, y);
  return y + 3;
}

// ---------- Sections ----------

// Ticker, company name, price and when it was graded, with the letter on the right.
function drawHeader(doc, report) {
  doc.setFontSize(22);
  setColor(doc, TEXT);
  doc.text(report.ticker, LEFT, 22);
  doc.setFontSize(11);
  setColor(doc, MUTED);
  if (report.name) doc.text(report.name, LEFT, 29);
  if (report.details) doc.text(report.details, LEFT, 35);

  // The letter in a coloured box, like the card on the page.
  const color = GRADE_COLORS[report.grade] || MUTED;
  const boxX = doc.internal.pageSize.getWidth() - LEFT - 30;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(boxX, 12, 30, 26, 2, 2);
  doc.setFontSize(report.grade.length > 1 ? 18 : 30);
  setColor(doc, color);
  doc.text(report.grade, boxX + 15, 29, { align: 'center' });
  return 46;
}

// A striped table. Returns the y position below it.
function table(doc, y, options) {
  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 9, textColor: TEXT, cellPadding: 2 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255] },
    margin: { left: LEFT, right: LEFT },
    ...options,
  });
  return doc.lastAutoTable.finalY + 8;
}

function drawCriteria(doc, criteria, y) {
  y = heading(doc, 'Why this grade?', y);
  return table(doc, y, {
    head: [['Result', 'Check', 'Explanation']],
    body: criteria.map((c) => [c.result, c.name, c.explanation]),
    columnStyles: { 0: { cellWidth: 16, fontStyle: 'bold' }, 1: { cellWidth: 48 } },
    // Colour each Pass / Fail / N/A like the badges on the page.
    didParseCell: (cell) => {
      if (cell.section === 'body' && cell.column.index === 0) {
        cell.cell.styles.textColor = RESULT_COLORS[cell.cell.raw] || TEXT;
      }
    },
  });
}

function drawSector(doc, sector, y) {
  y = heading(doc, sector.heading, y);
  y = table(doc, y, {
    head: [['Measure', 'Where it sits', 'Detail']],
    body: sector.rows,
  });
  return paragraph(doc, sector.footnote, y - 4, { size: 9, color: MUTED });
}

// The trend chart, drawn as plain rectangles from the yearly numbers.
function drawChart(doc, chart, y) {
  // Kept short so a typical report fits on one page; the whole chart (title,
  // bars, legend, caption) needs about 70 mm and moves to a new page if not.
  y = heading(doc, chart.title, makeRoom(doc, y, 70));
  const box = { x: LEFT + 20, y: y + 4, width: contentWidth(doc) - 20, height: 42 };
  const layout = chartLayout(chart.series, chart.keys, box);

  // Gridlines with their dollar labels down the left side.
  doc.setFontSize(8);
  setColor(doc, MUTED);
  doc.setLineWidth(0.2);
  doc.setDrawColor(...GRID);
  for (const line of layout.gridlines) {
    doc.line(box.x, line.y, box.x + box.width, line.y);
    doc.text(line.label, box.x - 2, line.y + 1, { align: 'right' });
  }

  // Bars: revenue in blue, the second series in teal.
  for (const bar of layout.bars) {
    doc.setFillColor(...(bar.key === chart.keys[0] ? BLUE : TEAL));
    doc.rect(bar.x, bar.y, bar.width, Math.max(bar.height, 0.3), 'F');
  }

  // A darker zero line, so a cash-burning year clearly sits below it.
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.4);
  doc.line(box.x, layout.zeroY, box.x + box.width, layout.zeroY);

  for (const year of layout.years) {
    doc.text(year.label, year.x, box.y + box.height + 5, { align: 'center' });
  }

  // Legend: a coloured square and a label for each series.
  const legendY = box.y + box.height + 11;
  chart.labels.forEach((label, i) => {
    const x = box.x + i * 45;
    doc.setFillColor(...(i === 0 ? BLUE : TEAL));
    doc.rect(x, legendY - 2.5, 3, 3, 'F');
    doc.text(label, x + 5, legendY);
  });

  return paragraph(doc, chart.caption, legendY + 7, { size: 8, color: MUTED });
}

// ---------- Whole report ----------

// Build the PDF for a graded result. Returned rather than saved so tests can
// look at it. `now` fixes the file's creation date, so two builds of the same
// result are byte-for-byte identical.
export function buildGradePdf(result, { now = new Date() } = {}) {
  const report = gradeReport(result);
  const doc = new jsPDF();
  doc.setCreationDate(now);
  doc.setFileId('00000000000000000000000000000000');

  let y = drawHeader(doc, report);
  for (const note of report.notes) y = paragraph(doc, note, y, { color: MUTED });
  if (report.summary) y = paragraph(doc, report.summary, y + 2, { size: 11 });
  if (report.sector) y = drawSector(doc, report.sector, y + 4);
  if (report.criteria.length) y = drawCriteria(doc, report.criteria, y + 4);
  if (report.chart) y = drawChart(doc, report.chart, y + 2);
  paragraph(doc, report.scale, y + 2, { size: 9 });
  drawFooters(doc, report.footer);
  return doc;
}

// The footer sits at the bottom of every page, below the content area that
// makeRoom keeps clear, so it never pushes anything onto an extra page.
function drawFooters(doc, text) {
  const bottom = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(8);
  setColor(doc, MUTED);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.text(text, LEFT, bottom);
  }
}

// Build the PDF and hand it to the browser as a normal file download.
export function downloadGradePdf(result, fileName) {
  buildGradePdf(result).save(fileName);
}
