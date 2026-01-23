import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Team Up" <noreply@teamup.com>',
                to,
                subject,
                html,
            });
            console.log(`Email sent to ${to}`);
        } else {

            console.log('---------------------------------------------------');
            console.log(`[Mock Email Service] To: ${to}`);
            console.log(`[Mock Email Service] Subject: ${subject}`);
            console.log(`[Mock Email Service] HTML Content:`);
            console.log(html);
            console.log('---------------------------------------------------');
        }
    } catch (error) {
        console.error('Error sending email:', error);

    }
};