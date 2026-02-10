import nodemailer from 'nodemailer';

export class EmailProvider {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        await this.transporter.sendMail({
            from: `"Team Up" <${process.env.EMAIL_FROM || 'noreply@teamup.com'}>`,
            to,
            subject,
            html,
        });
    }
}
