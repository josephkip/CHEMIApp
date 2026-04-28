import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fmt = (v) => `KES ${Number(v || 0).toLocaleString()}`;

export const generateReceiptPDF = (receipt) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150], // Receipt size (80mm width)
    orientation: 'portrait'
  });

  const width = doc.internal.pageSize.getWidth();
  const margin = 5;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Moreran Chemist', width / 2, 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Health & Wellness Our Priority', width / 2, 14, { align: 'center' });
  doc.text('Nairobi, Kenya', width / 2, 18, { align: 'center' });
  doc.text('Tel: +254 700 000 000', width / 2, 22, { align: 'center' });

  doc.setLineWidth(0.1);
  doc.line(margin, 25, width - margin, 25);

  // Receipt Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt: #${receipt.receipt_number}`, margin, 32);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${new Date(receipt.created_at).toLocaleString()}`, margin, 36);
  if (receipt.cashier_name) {
    doc.text(`Cashier: ${receipt.cashier_name}`, margin, 40);
  }
  if (receipt.customer_name) {
    doc.text(`Customer: ${receipt.customer_name}`, margin, 44);
  }

  // Items Table with "Illusion" Discount
  let totalSavings = 0;
  const tableData = (receipt.items || []).map(it => {
    const listPrice = it.selling_price * 1.12; // 12% higher list price
    const discount = listPrice - it.selling_price;
    totalSavings += discount * it.quantity;
    
    return [
      it.item_name,
      it.quantity,
      fmt(listPrice),
      fmt(discount),
      fmt(it.selling_price * it.quantity)
    ];
  });

  doc.autoTable({
    startY: receipt.customer_name ? 48 : (receipt.cashier_name ? 44 : 40),
    head: [['Item', 'Qty', 'List', 'Disc', 'Net']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 6.5, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', borderBottom: 0.1 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = doc.lastAutoTable.finalY + 5;

  // Summary
  doc.setLineWidth(0.1);
  doc.line(margin, finalY, width - margin, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', width - 25, finalY + 5, { align: 'right' });
  doc.text(fmt(receipt.total_amount), width - margin, finalY + 5, { align: 'right' });

  // Savings illusion
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136); // Teal color
  doc.text(`YOU SAVED: ${fmt(totalSavings)}`, width - margin, finalY + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Back to black

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment: ${receipt.payment_method?.toUpperCase()}`, margin, finalY + 15);

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for shopping with us!', width / 2, finalY + 20, { align: 'center' });
  doc.text('Quick Recovery!', width / 2, finalY + 24, { align: 'center' });

  // Output to new tab for immediate visibility/printing
  const blob = doc.output('bloburl');
  window.open(blob, '_blank');
  
  // Also save a copy for download
  doc.save(`Receipt_${receipt.receipt_number}.pdf`);
};
