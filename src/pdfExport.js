import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Same named colors as src/styles.css's design tokens, so the PDF's header
// and footer match the app's own look instead of picking their own colors.
const BRAND = {
  amber: '#C17F2B',
  paper: '#FBFAF6',
  ink: '#232722',
  inkSoft: '#5B6058',
  line: '#DAD5C8',
};

function drawHeader(pdf, { margin, pageWidth, title, subtitle }) {
  const markSize = 22;

  pdf.setFillColor(BRAND.amber);
  pdf.roundedRect(margin, margin, markSize, markSize, 5, 5, 'F');
  pdf.setTextColor(BRAND.paper);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('P', margin + markSize / 2, margin + markSize / 2 + 4, { align: 'center' });

  pdf.setTextColor(BRAND.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('RusTalk', margin + markSize + 10, margin + 10);

  pdf.setTextColor(BRAND.inkSoft);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('dialogs for the trip', margin + markSize + 10, margin + 20);

  pdf.setTextColor(BRAND.ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(title, margin, margin + 46);

  if (subtitle) {
    pdf.setTextColor(BRAND.inkSoft);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(subtitle, margin, margin + 60);
  }

  pdf.setDrawColor(BRAND.line);
  pdf.setLineWidth(0.75);
  pdf.line(margin, margin + 72, pageWidth - margin, margin + 72);
}

function drawFooter(pdf, { margin, pageWidth, contentBottom, pageNum, totalPages }) {
  pdf.setDrawColor(BRAND.line);
  pdf.setLineWidth(0.5);
  pdf.line(margin, contentBottom + 8, pageWidth - margin, contentBottom + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(BRAND.inkSoft);
  pdf.text('RusTalk', margin, contentBottom + 20);
  pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, contentBottom + 20, { align: 'right' });
}

// The one shared place that turns a piece of the page into a downloaded PDF.
// Takes a snapshot of the element exactly as it's styled (same fonts, same
// colors, same layout), then slices that snapshot across as many A4 pages as
// it needs, each with a matching header/footer and a margin around the
// content - no browser print dialog involved.
export async function exportElementAsPDF(element, filename, { title = '', subtitle = '' } = {}) {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const headerHeight = 84; // space below the top margin reserved for the header block
  const footerHeight = 28; // space above the bottom margin reserved for the footer block
  const contentTop = margin + headerHeight;
  const contentBottom = pageHeight - margin - footerHeight;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = contentBottom - contentTop;

  // How many source-canvas pixels fit in one page's worth of content height.
  // Each page gets its own cropped slice of the canvas (rather than drawing
  // the full image on every page and hoping the page edge clips it) so the
  // content can never paint over the header or footer.
  const pxPerPt = canvas.width / contentWidth;
  const pageSlicePx = Math.floor(contentHeight * pxPerPt);
  const totalPages = Math.max(1, Math.ceil(canvas.height / pageSlicePx));

  const sliceCanvas = document.createElement('canvas');
  sliceCanvas.width = canvas.width;
  const sliceCtx = sliceCanvas.getContext('2d');

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();
    drawHeader(pdf, { margin, pageWidth, title, subtitle });

    const srcY = page * pageSlicePx;
    const srcHeight = Math.min(pageSlicePx, canvas.height - srcY);
    sliceCanvas.height = srcHeight;
    sliceCtx.fillStyle = '#ffffff';
    sliceCtx.fillRect(0, 0, sliceCanvas.width, srcHeight);
    sliceCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
    // JPEG instead of PNG: for a page of mostly flat-colored bubbles and
    // text, this keeps the file a few hundred KB instead of several MB,
    // with no visible loss at this quality level.
    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.85);
    const sliceHeightPt = srcHeight / pxPerPt;
    pdf.addImage(sliceData, 'JPEG', margin, contentTop, contentWidth, sliceHeightPt);

    drawFooter(pdf, { margin, pageWidth, contentBottom, pageNum: page + 1, totalPages });
  }

  pdf.save(`${filename}.pdf`);
}
