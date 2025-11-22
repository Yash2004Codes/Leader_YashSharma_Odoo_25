import jsPDF from 'jspdf';

export interface ReceiptData {
  receipt_number: string;
  supplier_name?: string;
  warehouse_name?: string;
  created_at: string;
  created_by_name?: string;
  notes?: string;
  status: string;
  items: Array<{
    product_name: string;
    sku: string;
    quantity: number;
    unit_price?: number;
    unit_of_measure: string;
    notes?: string;
  }>;
}

export function generateReceiptPDF(receipt: ReceiptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Colors
  const primaryColor = [2, 132, 199]; // primary-600
  const grayColor = [107, 114, 128]; // gray-500
  const lightGrayColor = [243, 244, 246]; // gray-100

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('StockMaster', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Inventory Management System', margin, 35);
  
  yPos = 60;

  // Receipt Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 10;

  // Receipt Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Receipt Number: ${receipt.receipt_number}`, margin, yPos);
  doc.text(`Date: ${new Date(receipt.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 15;

  // Supplier and Warehouse Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  if (receipt.supplier_name) {
    doc.text(`Supplier: ${receipt.supplier_name}`, margin, yPos);
    yPos += 7;
  }
  
  if (receipt.warehouse_name) {
    doc.text(`Warehouse: ${receipt.warehouse_name}`, margin, yPos);
    yPos += 7;
  }
  
  if (receipt.created_by_name) {
    doc.text(`Created by: ${receipt.created_by_name}`, margin, yPos);
    yPos += 7;
  }

  yPos += 5;

  // Items Table Header
  doc.setFillColor(...lightGrayColor);
  doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  doc.text('Item', margin + 2, yPos);
  doc.text('SKU', margin + 60, yPos);
  doc.text('Qty', margin + 100, yPos);
  doc.text('Unit Price', margin + 120, yPos);
  doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
  
  yPos += 10;

  // Items
  let totalAmount = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  receipt.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    const itemTotal = (item.unit_price || 0) * item.quantity;
    totalAmount += itemTotal;

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(...lightGrayColor);
    }
    doc.rect(margin, yPos - 4, contentWidth, 8, 'F');

    doc.setTextColor(0, 0, 0);
    doc.text(item.product_name || 'N/A', margin + 2, yPos);
    doc.text(item.sku || 'N/A', margin + 60, yPos);
    doc.text(`${item.quantity} ${item.unit_of_measure || ''}`, margin + 100, yPos);
    doc.text(item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'N/A', margin + 120, yPos);
    doc.text(item.unit_price ? `$${itemTotal.toFixed(2)}` : 'N/A', pageWidth - margin - 2, yPos, { align: 'right' });
    
    yPos += 8;
  });

  yPos += 5;

  // Total Line
  doc.setDrawColor(...grayColor);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', pageWidth - margin - 50, yPos);
  doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });

  yPos += 10;

  // Notes
  if (receipt.notes) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(receipt.notes, contentWidth);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5;
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`Status: ${receipt.status.toUpperCase()}`, margin, footerY);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - margin, footerY, { align: 'right' });

  // Save PDF
  doc.save(`receipt-${receipt.receipt_number}.pdf`);
}

