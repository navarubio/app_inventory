import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Route hit:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to, subject, message, config } = req.body;
    
    // Log de la configuración (ocultando la contraseña)
    console.log('Received request with config:', {
      server: config.server,
      port: config.port,
      from: config.from,
      secure: false,
      to: to
    });

    if (!to || !subject || !message || !config) {
      console.error('Missing required fields:', { 
        hasTo: !!to, 
        hasSubject: !!subject, 
        hasMessage: !!message, 
        hasConfig: !!config 
      });
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { 
          hasTo: !!to, 
          hasSubject: !!subject, 
          hasMessage: !!message, 
          hasConfig: !!config 
        }
      });
    }

    // Crear el transportador con logging detallado
    const transporter = nodemailer.createTransport({
      host: config.server,
      port: parseInt(config.port),
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: config.from,
        pass: config.password,
      },
      debug: true, // Habilita logs detallados
      logger: true  // Habilita el logger interno
    });

    // Verificar la conexión antes de enviar
    console.log('Verificando conexión SMTP...');
    try {
      await transporter.verify();
      console.log('Conexión SMTP verificada exitosamente');
    } catch (verifyError) {
      console.error('Error al verificar conexión SMTP:', verifyError);
      return res.status(500).json({
        message: 'Error al verificar conexión SMTP',
        error: verifyError instanceof Error ? verifyError.message : 'Unknown verification error'
      });
    }

    // Intentar enviar el correo
    console.log('Attempting to send email to:', to);
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html: message,
    });

    console.log('Email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return res.status(200).json({ 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Detailed error sending email:', {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });

    return res.status(500).json({ 
      message: 'Error sending email',
      error: error instanceof Error ? {
        message: error.message,
        name: error.name
      } : 'Unknown error',
    });
  }
}