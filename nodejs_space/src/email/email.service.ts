import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetCode: string, userName: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Recuperación de Contraseña - Acrosodos',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6200ea 0%, #b388ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code-box { background: white; border: 2px dashed #6200ea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .code { font-size: 32px; font-weight: bold; color: #6200ea; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${userName}</strong>,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Acrosodos</strong>.</p>
                <p>Usa el siguiente código para restablecer tu contraseña:</p>
                
                <div class="code-box">
                  <div class="code">${resetCode}</div>
                  <p style="margin: 10px 0 0 0; color: #666;">Este código expira en 30 minutos</p>
                </div>

                <div class="warning">
                  <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este correo. Tu contraseña permanecerá segura.
                </div>

                <p>Si tienes algún problema, contacta a nuestro equipo de soporte.</p>
                
                <p style="margin-top: 30px;">Bendiciones,<br><strong>Equipo Acrosodos</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Acrosodos. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
