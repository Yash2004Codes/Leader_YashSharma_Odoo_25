import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptData {
  receipt_number: string;
  supplier_name?: string;
  warehouse_name?: string;
  created_at: string;
  validated_at?: string;
  status: string;
  notes?: string;
  created_by_name?: string;
  items: Array<{
    product_name?: string;
    sku?: string;
    quantity: number;
    unit_price?: number;
    unit_of_measure?: string;
    notes?: string;
  }>;
}

export function generateReceiptPDF(receipt: ReceiptData): void {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = [59, 130, 246]; // blue-500
  const grayColor = [107, 114, 128]; // gray-500
  const lightGrayColor = [243, 244, 246]; // gray-100

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('StockMaster Inventory System', 105, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let yPos = 50;

  // Receipt Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Information', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const receiptInfo = [
    ['Receipt Number:', receipt.receipt_number],
    ['Supplier:', receipt.supplier_name || 'N/A'],
    ['Warehouse:', receipt.warehouse_name || 'N/A'],
    ['Status:', receipt.status.toUpperCase()],
    ['Date:', new Date(receipt.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })],
  ];

  if (receipt.validated_at) {
    receiptInfo.push(['Validated:', new Date(receipt.validated_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })]);
  }

  if (receipt.created_by_name) {
    receiptInfo.push(['Created By:', receipt.created_by_name]);
  }

  receiptInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', 70, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Items Table
  const tableData = receipt.items.map((item, index) => [
    (index + 1).toString(),
    item.sku || 'N/A',
    item.product_name || 'N/A',
    `${item.quantity} ${item.unit_of_measure || ''}`.trim(),
    item.unit_price ? `$${Number(item.unit_price).toFixed(2)}` : 'N/A',
    item.unit_price ? `$${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}` : 'N/A',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'SKU', 'Product', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: lightGrayColor,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      2: { cellWidth: 60 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  // Calculate totals
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
  let totalY = finalY + 10;

  const totalQuantity = receipt.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = receipt.items.reduce((sum, item) => {
    return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
  }, 0);

  // Totals section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Quantity:', 140, totalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalQuantity}`, 180, totalY);

  if (totalAmount > 0) {
    totalY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 140, totalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${totalAmount.toFixed(2)}`, 180, totalY);
  }

  // Notes section
  if (receipt.notes) {
    totalY += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, totalY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(receipt.notes, 180);
    doc.text(splitNotes, 14, totalY + 6);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`Receipt-${receipt.receipt_number}.pdf`);
}

