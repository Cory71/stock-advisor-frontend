// Draws the "download my data" report as a PDF and saves it.
//
// Loaded only when someone clicks the download button (see Account.jsx), so
// the PDF library never slows down the rest of the app.

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { dataReport } from './account';

const LEFT = 14;            // left margin, in millimetres
const BRAND_BLUE = [13, 110, 253];  // Bootstrap's primary blue

// Start a new page when there isn't room left for a heading and a row or two.
function makeRoom(doc, y) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y < pageHeight - 30) return y;
  doc.addPage();
  return 20;
}

// One section: its heading, then a table — or a sentence if it's empty.
// Returns where the next section should start.
function drawSection(doc, section, y) {
  y = makeRoom(doc, y);
  doc.setFontSize(13);
  doc.text(section.heading, LEFT, y);

  if (!section.rows.length) {
    doc.setFontSize(10);
    doc.text(section.empty, LEFT, y + 7);
    return y + 17;
  }

  autoTable(doc, {
    startY: y + 3,
    head: section.head ? [section.head] : undefined,
    body: section.rows,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: BRAND_BLUE },
    margin: { left: LEFT, right: LEFT },
  });
  return doc.lastAutoTable.finalY + 12;
}

// Build the PDF document for an export. Returned rather than saved so tests
// can look at it.
export function buildDataPdf(data) {
  const report = dataReport(data);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(report.title, LEFT, 20);
  doc.setFontSize(10);
  doc.text(report.exportedOn, LEFT, 27);

  let y = 38;
  for (const section of report.sections) {
    y = drawSection(doc, section, y);
  }
  return doc;
}

// Build the PDF and hand it to the browser as a normal file download.
export function downloadDataPdf(data, fileName) {
  buildDataPdf(data).save(fileName);
}
