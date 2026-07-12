const PDFDocument = require('pdfkit');
const sendEmail = require('./sendEmail');

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildOrderReceiptPdf = async (order, buyer, address, orderLines) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    doc.fontSize(20).text('MacSphere Order Receipt', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#444');
    doc.text(`Order ID: #${order.id}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.text(`Date: ${new Date(order.created_at || order.date_placed || order.createdAt).toLocaleString()}`);
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#000');
    doc.text('Customer Details');
    doc.fontSize(10).fillColor('#444');
    doc.text(`Name: ${buyer?.name || 'Customer'}`);
    doc.text(`Email: ${buyer?.email || ''}`);
    doc.text(`Address: ${address ? `${address.street_address || ''}, ${address.city || ''}, ${address.province || ''}` : ''}`);
    doc.moveDown(0.8);

    doc.fontSize(12).fillColor('#000');
    doc.text('Items');
    doc.moveDown(0.3);

    let subtotal = 0;
    orderLines.forEach((line, index) => {
        const productName = line.Product?.name || `Product #${line.product_id}`;
        const qty = line.quantity || 0;
        const price = Number(line.price_at_purchase || 0);
        const lineTotal = price * qty;
        subtotal += lineTotal;
        doc.fontSize(10).fillColor('#444');
        doc.text(`${index + 1}. ${productName} x${qty}   ${formatCurrency(lineTotal)}`);
    });

    doc.moveDown(0.8);
    doc.fontSize(12).fillColor('#000');
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`);
    doc.text(`Payment Method: ${order.payment_method || 'Cash on Delivery'}`);

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
};

const getStatusCopy = (statusLabel) => {
    switch (statusLabel) {
        case 'shipped':
            return {
                title: 'Your order has been shipped',
                headline: 'Your MacSphere order is on its way.',
                body: 'Your order has been shipped and is heading to your delivery address. Your receipt is attached below.'
            };
        case 'completed':
            return {
                title: 'Your order is complete',
                headline: 'Your MacSphere order has been completed.',
                body: 'Your purchase has been finalized and your receipt is attached below for your records.'
            };
        case 'cancelled':
            return {
                title: 'Your order was cancelled',
                headline: 'Your MacSphere order has been cancelled.',
                body: 'We have attached the receipt for your records in case you need it later.'
            };
        default:
            return {
                title: 'Order placed successfully',
                headline: 'Your MacSphere order has been placed successfully.',
                body: 'Thank you for shopping with us. Your receipt is attached below.'
            };
    }
};

const buildEmailHtml = (order, buyer, address, orderLines, statusLabel, message) => {
    const statusCopy = getStatusCopy(statusLabel);
    const subtotal = orderLines.reduce((sum, line) => sum + Number(line.price_at_purchase || 0) * Number(line.quantity || 0), 0);
    const productRows = orderLines.map((line, index) => {
        const productName = line.Product?.name || `Product #${line.product_id}`;
        const quantity = line.quantity || 0;
        const unitPrice = Number(line.price_at_purchase || 0);
        const total = unitPrice * quantity;
        return `
            <tr>
                <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:14px;">${index + 1}. ${productName}</td>
                <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:14px; text-align:center;">${quantity}</td>
                <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:14px; text-align:right;">₱${unitPrice.toLocaleString('en-PH')}</td>
                <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; font-size:14px; text-align:right;">₱${total.toLocaleString('en-PH')}</td>
            </tr>
        `;
    }).join('');

    return `
        <div style="font-family: Arial, sans-serif; background-color:#f5f7fb; padding:24px;">
            <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                <div style="background:linear-gradient(135deg,#0f172a,#2563eb); padding:28px 32px; color:#ffffff;">
                    <h1 style="margin:0; font-size:24px;">MacSphere</h1>
                    <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Premium Apple products, delivered with care</p>
                </div>
                <div style="padding:32px; color:#111827;">
                    <h2 style="margin:0 0 10px; font-size:22px;">${statusCopy.title}</h2>
                    <p style="margin:0 0 14px; font-size:15px; line-height:1.6;">${statusCopy.headline}</p>
                    <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">${message}</p>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 18px; margin:20px 0;">
                        <p style="margin:0 0 6px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Customer details</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Name:</strong> ${buyer?.name || 'Customer'}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Email:</strong> ${buyer?.email || 'N/A'}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Phone:</strong> ${buyer?.phone || 'N/A'}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Address:</strong> ${address ? `${address.address_line || ''}, ${address.city || ''}, ${address.zipcode || ''}`.replace(/, $/, '') : 'N/A'}</p>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 18px; margin:20px 0;">
                        <p style="margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Order summary</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Order ID:</strong> #${order.id}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Status:</strong> ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Payment:</strong> ${order.payment_method || 'Cash on Delivery'}</p>
                        <p style="margin:4px 0; font-size:15px;"><strong>Date:</strong> ${new Date(order.created_at || order.date_placed || order.createdAt).toLocaleString()}</p>
                    </div>

                    <div style="margin:20px 0;">
                        <p style="margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Products</p>
                        <table style="width:100%; border-collapse:collapse; font-size:14px;">
                            <thead>
                                <tr style="background:#e2e8f0;">
                                    <th style="padding:10px 8px; text-align:left;">Product</th>
                                    <th style="padding:10px 8px; text-align:center;">Qty</th>
                                    <th style="padding:10px 8px; text-align:right;">Unit Price</th>
                                    <th style="padding:10px 8px; text-align:right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>${productRows}</tbody>
                        </table>
                        <div style="text-align:right; margin-top:10px; font-size:16px; font-weight:bold;">Subtotal: ₱${subtotal.toLocaleString('en-PH')}</div>
                    </div>

                    <p style="margin:0 0 12px; font-size:14px; color:#475569;">Your receipt is attached as a PDF for easy reference.</p>
                    <div style="margin-top:20px;">
                        <a href="https://macsphere.com" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:999px; font-size:14px; font-weight:bold;">Visit MacSphere</a>
                    </div>
                </div>
                <div style="background:#f8fafc; padding:16px 32px; text-align:center; color:#64748b; font-size:12px; border-top:1px solid #e2e8f0;">
                    This message was sent by MacSphere. Thank you for shopping with us.
                </div>
            </div>
        </div>
    `;
};

const sendOrderReceiptEmail = async (order, buyer, address, orderLines, status) => {
    if (!buyer?.email) {
        return;
    }

    const pdfBuffer = await buildOrderReceiptPdf(order, buyer, address, orderLines);

    const validLabels = ['shipped', 'completed', 'cancelled'];
    const statusLabel = validLabels.includes(status) ? status : 'placed';

    const subjectMap = {
        placed: `Your MacSphere order #${order.id} has been placed`,
        shipped: `Your MacSphere order #${order.id} has shipped`,
        completed: `Your MacSphere order #${order.id} has been completed`,
        cancelled: `Your MacSphere order #${order.id} has been cancelled`
    };

    const messageMap = {
        placed: `Hello ${buyer.name || 'Customer'}, your order has been placed successfully. We have attached your receipt.`,
        shipped: `Hello ${buyer.name || 'Customer'}, your order has shipped and is on its way. We have attached your receipt.`,
        completed: `Hello ${buyer.name || 'Customer'}, your order has been completed. We have attached your receipt.`,
        cancelled: `Hello ${buyer.name || 'Customer'}, your order has been cancelled. We have attached the receipt for your records.`
    };

    const subject = subjectMap[statusLabel];
    const message = messageMap[statusLabel];

    await sendEmail({
        email: buyer.email,
        subject,
        message,
        html: buildEmailHtml(order, buyer, address, orderLines, statusLabel, message),
        attachments: [{
            filename: `receipt-order-${order.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    });
};

module.exports = {
    buildOrderReceiptPdf,
    sendOrderReceiptEmail
};
