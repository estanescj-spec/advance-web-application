const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // If no SMTP is configured at all, log the email content to the console
    // so local development doesn't crash. Once SMTP_HOST is set (e.g. Mailtrap),
    // this always sends a real email through that SMTP server.
    if (!process.env.SMTP_HOST) {
        console.log(`[EMAIL - no SMTP configured, logging instead]`);
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        return;
    }

    try {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const message = {
            from: `${process.env.SMTP_FROM_NAME || 'MacSphere'} <${process.env.SMTP_FROM_EMAIL || 'noreply@macsphere.com'}>`,
            to: options.email,
            subject: options.subject,
            html: `<p>${options.message}</p>`
        };

        await transporter.sendMail(message);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};

module.exports = sendEmail;