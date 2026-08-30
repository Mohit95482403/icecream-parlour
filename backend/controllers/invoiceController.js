const db = require('../config/db');
const PDFDocument = require('pdfkit');

function generateTableRow(doc, y, item, qty, price, total) {
  doc.text(item, 50, y, { width: 260 })
     .text(qty, 320, y, { width: 50, align: 'right' })
     .text(price, 380, y, { width: 80, align: 'right' })
     .text(total, 470, y, { width: 70, align: 'right' });
}

function generateTotalsRow(doc, y, label, amount) {
  doc.text(label, 280, y, { width: 170, align: 'right' })
     .text(amount, 470, y, { width: 70, align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#cccccc')
     .lineWidth(1)
     .moveTo(50, y)
     .lineTo(540, y)
     .stroke();
}

const generateInvoicePDF = (res, order, items, payment, refund = null) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  const invoiceNumber = `GLACE-INV-${order.order_number}`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(24).font('Times-Bold').fillColor('#1a1a1a').text('GLACÉ', { align: 'center' });
  doc.fontSize(12).font('Times-Italic').fillColor('#666666').text('Premium Ice Cream', { align: 'center' });
  doc.moveDown(2);
  
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a').text('INVOICE / RECEIPT', { align: 'center', letterSpacing: 2 });
  doc.moveDown();
  
  doc.fontSize(10).font('Helvetica-Bold').text(`Invoice No: `, { continued: true }).font('Helvetica').text(invoiceNumber);
  
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(formattedDate);

  doc.font('Helvetica-Bold').text(`Order Status: `, { continued: true }).font('Helvetica').text(order.order_status.toUpperCase());
  doc.moveDown(2);
  
  // Bill To & Shipping Address
  const startY = doc.y;
  
  // Left Column (Bill To)
  doc.font('Helvetica-Bold').text('BILL TO', 50, startY);
  
  let address = {};
  try {
    address = JSON.parse(order.delivery_address_snapshot || '{}');
  } catch (e) {
    // Ignore parse error
  }
  
  const guestName = order.guest_first_name ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim() : null;
  const name = guestName || address.fullName || 'Customer';
  const email = order.guest_email || address.email || '';
  const phone = order.guest_phone || address.phone || '';
  
  let currentY = startY + 15;
  doc.font('Helvetica').text(name, 50, currentY);
  if (email) { currentY += 15; doc.text(email, 50, currentY); }
  if (phone) { currentY += 15; doc.text(phone, 50, currentY); }
  
  // Right Column (Shipping / Gift Delivery)
  if (order.is_gift_order) {
    // Gift Order: Deliver To uses recipient info
    let shipY = startY;
    doc.font('Helvetica-Bold').fillColor('#b45309').text('🎁 GIFT ORDER - DELIVER TO', 300, shipY);
    doc.fillColor('#1a1a1a');
    shipY += 15;
    doc.font('Helvetica').text(order.gift_recipient_name || '', 300, shipY);
    shipY += 15;
    if (order.gift_recipient_phone) { doc.text(`Phone: ${order.gift_recipient_phone}`, 300, shipY); shipY += 15; }
    if (order.gift_recipient_address) { doc.text(order.gift_recipient_address, 300, shipY); shipY += 15; }
    const cityStateZip = [order.gift_recipient_city, order.gift_recipient_state, order.gift_recipient_postal_code].filter(Boolean).join(', ');
    if (cityStateZip) { doc.text(cityStateZip, 300, shipY); shipY += 15; }
    if (order.gift_message) {
      shipY += 5;
      doc.font('Helvetica-Oblique').fillColor('#666666').text(`Gift Message: "${order.gift_message}"`, 300, shipY, { width: 220 });
      doc.fillColor('#1a1a1a');
    }
  } else if (order.delivery_method === 'delivery' && (address.addressLine1 || address.address_line_1)) {
    let shipY = startY;
    doc.font('Helvetica-Bold').text('DELIVERY ADDRESS', 300, shipY);
    shipY += 15;
    
    const line1 = address.addressLine1 || address.address_line_1 || '';
    const line2 = address.addressLine2 || address.address_line_2 || '';
    const city = address.city || '';
    const state = address.state || '';
    const zip = address.postalCode || address.postal_code || '';
    const country = address.country || '';
    
    doc.font('Helvetica').text(line1, 300, shipY);
    if (line2) { shipY += 15; doc.text(line2, 300, shipY); }
    shipY += 15; doc.text(`${city}, ${state} ${zip}`.trim(), 300, shipY);
    if (country) { shipY += 15; doc.text(country, 300, shipY); }
  }
  
  doc.moveDown(3);
  doc.x = 50; // reset x
  
  // Order Information
  doc.font('Helvetica-Bold').text(`ORDER #${order.order_number}`);
  doc.moveDown();
  
  // Table Header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  generateTableRow(doc, tableTop, 'ITEM', 'QTY', 'PRICE', 'TOTAL');
  generateHr(doc, tableTop + 15);
  doc.font('Helvetica');
  
  let position = tableTop + 25;
  
  // Items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemName = item.product_name + (item.variant_name ? ` - ${item.variant_name}` : '');
    const price = `₹${parseFloat(item.unit_price).toFixed(2)}`;
    const lineTotal = item.line_total != null ? item.line_total : item.total_price != null ? item.total_price : (item.unit_price * item.quantity);
    const total = `₹${parseFloat(lineTotal).toFixed(2)}`;
    
    // Add page if position is too low
    if (position > 700) {
      doc.addPage();
      position = 50;
      doc.font('Helvetica-Bold');
      generateTableRow(doc, position, 'ITEM', 'QTY', 'PRICE', 'TOTAL');
      generateHr(doc, position + 15);
      doc.font('Helvetica');
      position += 25;
    }
    
    doc.font('Helvetica');
    generateTableRow(doc, position, itemName, item.quantity, price, total);
    generateHr(doc, position + 15);
    position += 25;
  }
  
  // Totals
  position += 10;
  doc.font('Helvetica');
  generateTotalsRow(doc, position, 'Subtotal', `₹${parseFloat(order.subtotal).toFixed(2)}`);
  
  if (parseFloat(order.discount_amount) > 0) {
    position += 15;
    const couponLabel = order.coupon_code ? ` (${order.coupon_code})` : '';
    generateTotalsRow(doc, position, `Coupon Discount${couponLabel}`, `-₹${parseFloat(order.discount_amount).toFixed(2)}`);
  }
  
  position += 15;
  generateTotalsRow(doc, position, 'Delivery', `₹${parseFloat(order.delivery_fee).toFixed(2)}`);
  
  if (parseFloat(order.tax_amount) > 0) {
    position += 15;
    generateTotalsRow(doc, position, 'Tax', `₹${parseFloat(order.tax_amount).toFixed(2)}`);
  }
  
  position += 15;
  generateHr(doc, position);
  position += 10;
  doc.font('Helvetica-Bold');
  generateTotalsRow(doc, position, 'TOTAL', `₹${parseFloat(order.total_amount).toFixed(2)}`);
  
  // Payment Information
  if (payment) {
    position += 40;
    if (position > 680) {
      doc.addPage();
      position = 50;
    }
    doc.font('Helvetica-Bold').text('PAYMENT DETAILS', 50, position);
    position += 15;
    
    let statusDisplay = payment.status.toUpperCase();
    if (payment.status === 'paid' || payment.status === 'success') statusDisplay = 'PAID';
    if (payment.status === 'refunded') statusDisplay = 'REFUNDED';
    
    doc.font('Helvetica').text(`Payment Status: ${statusDisplay}`, 50, position);
    position += 15;

    // Payment method
    const methodNames = {
      'upi': 'UPI',
      'demo_upi': 'UPI',
      'card': 'Credit / Debit Card',
      'demo_card': 'Credit / Debit Card',
      'netbanking': 'Net Banking',
      'demo_netbanking': 'Net Banking',
      'wallet': 'Digital Wallet',
      'demo_wallet': 'Digital Wallet'
    };
    const methodDisplay = payment.payment_method ? (methodNames[payment.payment_method] || payment.payment_method.toUpperCase()) : 'Online Payment';
    doc.text(`Method: ${methodDisplay}`, 50, position);
    position += 15;

    // Transaction reference
    if (payment.transaction_reference) {
      doc.text(`Transaction Reference: ${payment.transaction_reference}`, 50, position);
      position += 15;
    }

    // Refund info
    const refRef = payment.refund_reference || (refund ? refund.refund_reference : null);
    const refAmount = payment.refund_amount || (refund ? refund.amount : null);
    if (refRef || order.payment_status === 'refunded') {
      position += 10;
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text('REFUND INFORMATION', 50, position);
      doc.fillColor('#1a1a1a');
      position += 15;
      if (refRef) {
        doc.font('Helvetica').text(`Refund Reference: ${refRef}`, 50, position);
        position += 15;
      }
      if (refAmount) {
        doc.text(`Refund Amount: ₹${parseFloat(refAmount).toFixed(2)}`, 50, position);
        position += 15;
      }
      doc.text(`Refund Status: REFUNDED (Simulated Internal Settlement)`, 50, position);
      position += 15;
    }
  }
  
  // Footer
  doc.moveDown(4);
  doc.font('Helvetica').fillColor('#666666').text('Thank you for choosing GLACÉ.', { align: 'center' });
  doc.text('Made with care. Served with joy.', { align: 'center' });
  doc.moveDown();
  doc.font('Helvetica-Bold').fillColor('#1a1a1a').text('GLACÉ', { align: 'center' });
  doc.font('Helvetica').fillColor('#666666').text('Premium Ice Cream', { align: 'center' });
  
  doc.end();
};

const getInvoiceData = async (orderNumber) => {
  const [orders] = await db.query('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
  if (orders.length === 0) return null;
  const order = orders[0];
  
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [order.id]);
  const [refunds] = await db.query('SELECT * FROM refunds WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [order.id]);
  
  return { 
    order, 
    items, 
    payment: payments.length > 0 ? payments[0] : null,
    refund: refunds.length > 0 ? refunds[0] : null
  };
};

const invoiceController = {
  downloadInvoice: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { orderNumber } = req.params;
      
      const invoiceData = await getInvoiceData(orderNumber);
      
      if (!invoiceData) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      const { order, items, payment, refund } = invoiceData;
      
      // Verify ownership
      if (String(order.user_id) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'You are not authorized to access this invoice.' });
      }
      
      generateInvoicePDF(res, order, items, payment, refund);
      
    } catch (error) {
      console.error('Download invoice error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while generating your invoice.' });
    }
  },
  
  downloadInvoiceAdmin: async (req, res) => {
    try {
      const { orderNumber } = req.params;
      
      const invoiceData = await getInvoiceData(orderNumber);
      
      if (!invoiceData) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      const { order, items, payment, refund } = invoiceData;
      
      generateInvoicePDF(res, order, items, payment, refund);
      
    } catch (error) {
      console.error('Admin download invoice error:', error);
      res.status(500).json({ success: false, message: 'Something went wrong while generating the invoice.' });
    }
  }
};

module.exports = invoiceController;
