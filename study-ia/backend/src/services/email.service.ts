import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendVerificationEmail(email: string, code: string, name?: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"CoDexStuDy" <${process.env.SMTP_USER || 'noreply@codexstudy.com'}>`,
      to: email,
      subject: 'Código de verificación - CoDexStuDy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">CoDexStuDy</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            ${name ? `<p style="color: #374151;">Hola <strong>${name}</strong>,</p>` : ''}
            <p style="color: #374151;">Tu código de verificación es:</p>
            <div style="background: #3b82f6; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
              ${code}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Este código expira en 15 minutos.</p>
            <p style="color: #6b7280; font-size: 12px;">Si no solicitaste este código, ignora este email.</p>
          </div>
        </div>
      `,
      text: `Hola${name ? ` ${name}` : ''},\n\nTu código de verificación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este código, ignora este email.`,
    });
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

export default transporter;
