const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const smtpHost = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
    const smtpPort = Number(process.env.SMTP_PORT || 2525);
    const smtpUser = process.env.SMTP_EMAIL || '7228d32baf338c';
    const smtpPass = process.env.SMTP_PASSWORD || '938517bf73b42c';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'macsphere-admin@macsphere.com';
    const fromName = process.env.SMTP_FROM_NAME || 'MacSphere';

    if (!smtpPass) {
        console.log('[EMAIL - SMTP password not configured. Set SMTP_PASSWORD in backend/.env]');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        return;
    }

    try {
        let transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            requireTLS: true
        });

        const message = {
            from: `${fromName} <${fromEmail}>`,
            to: options.email,
            subject: options.subject,
            html: options.html || `<p>${options.message}</p>`,
            text: options.text || options.message,
            attachments: options.attachments || []
        };

        await transporter.sendMail(message);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};

module.exports = sendEmail;