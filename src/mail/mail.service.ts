import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;
    private readonly templates: Map<string, Handlebars.TemplateDelegate> = new Map();

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('resend.apiKey');
        this.resend = new Resend(apiKey);
        this.fromEmail = this.configService.get<string>('resend.from') || 'Appointment System <onboarding@resend.dev>';

        // Load templates
        this.loadTemplates();
    }

    private loadTemplates() {
        const templatesDir = path.join(__dirname, 'templates');
        const templateFiles = ['appointment-created', 'appointment-confirmed', 'appointment-canceled'];

        templateFiles.forEach(name => {
            try {
                const filePath = path.join(templatesDir, `${name}.hbs`);
                const source = fs.readFileSync(filePath, 'utf-8');
                this.templates.set(name, Handlebars.compile(source));
                this.logger.log(`Loaded template: ${name}`);
            } catch (error) {
                this.logger.warn(`Template ${name}.hbs not found, using fallback`);
            }
        });
    }

    private renderTemplate(name: string, data: any): string {
        const template = this.templates.get(name);
        if (template) {
            return template(data);
        }
        // Fallback to simple HTML
        return `<p>${JSON.stringify(data)}</p>`;
    }

    async sendAppointmentCreatedEmail(hostEmail: string, data: {
        hostName: string;
        guestName: string;
        guestEmail: string;
        date: string;
        time: string;
        reason?: string;
    }) {
        try {
            const html = this.renderTemplate('appointment-created', data);

            await this.resend.emails.send({
                from: this.fromEmail,
                to: hostEmail,
                subject: '🔔 New Appointment Request',
                html,
            });
            this.logger.log(`Appointment created email sent to ${hostEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${hostEmail}:`, error.message);
        }
    }

    async sendAppointmentConfirmedEmail(guestEmail: string, data: {
        guestName: string;
        hostName: string;
        date: string;
        time: string;
    }) {
        try {
            const html = this.renderTemplate('appointment-confirmed', data);

            await this.resend.emails.send({
                from: this.fromEmail,
                to: guestEmail,
                subject: '✅ Appointment Confirmed',
                html,
            });
            this.logger.log(`Appointment confirmed email sent to ${guestEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${guestEmail}:`, error.message);
        }
    }

    async sendAppointmentCanceledEmail(email: string, data: {
        recipientName: string;
        otherPartyName: string;
        date: string;
        time: string;
        cancelReason?: string;
        canceledBy: 'host' | 'guest';
    }) {
        try {
            const html = this.renderTemplate('appointment-canceled', data);

            await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: '❌ Appointment Canceled',
                html,
            });
            this.logger.log(`Appointment canceled email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${email}:`, error.message);
        }
    }
}
