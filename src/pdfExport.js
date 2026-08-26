import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// The one shared place that turns a piece of the page into a downloaded PDF.
// Takes a snapshot of the element exactly as it's styled (same fonts, same
// colors, same layout), then slices that snapshot across as many A4 pages as
// it needs - no browser print dialog involved.
export async function exportElementAsPDF(element, filename) {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
  // JPEG instead of PNG: for a page of mostly flat-colored bubbles and text,
  // this keeps the file a few hundred KB instead of several MB, with no
  // visible loss at this quality level.
  const imgData = canvas.toDataURL('image/jpeg', 0.85);

  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
