import nodemailer from 'nodemailer';

// Nota: Em um ambiente real, use variáveis de ambiente para estas credenciais
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const MailService = {
  async sendReport(to: string, subject: string, text: string, html: string) {
    try {
      const info = await transporter.sendMail({
        from: '"Moreira Brasil Conectado" <noreply@moreirabrasil.com>',
        to,
        subject,
        text,
        html,
      });
      console.log('Mensagem enviada: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw error;
    }
  }
};
