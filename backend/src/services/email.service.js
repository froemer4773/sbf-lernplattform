const nodemailer = require('nodemailer');

// Create transporter with all-inkl SMTP settings
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.all-inkl.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email server ready');
    }
});

/**
 * Send verification email
 */
async function sendVerificationEmail(email, token, firstName) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@sbf-lernplattform.de',
        to: email,
        subject: 'E-Mail Verifizierung - SBF-Lernplattform',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1976D2;">Willkommen bei der SBF-Lernplattform!</h2>
                
                <p>Hallo ${firstName || 'User'},</p>
                
                <p>vielen Dank für deine Registrierung! Bitte verifiziere deine E-Mail-Adresse, um dein Konto zu aktivieren.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #1976D2; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        E-Mail verifizieren
                    </a>
                </div>
                
                <p>Oder kopiere diesen Link in deinen Browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    Dieser Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, 
                    ignoriere diese E-Mail einfach.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #999; font-size: 12px;">
                    SBF-Lernplattform - Deine kostenlose Plattform für Sportbootführerscheine
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Passwort zurücksetzen - SBF-Lernplattform',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1976D2;">Passwort zurücksetzen</h2>
                
                <p>Hallo ${firstName || 'User'},</p>
                
                <p>du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #FF9800; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Passwort zurücksetzen
                    </a>
                </div>
                
                <p>Oder kopiere diesen Link in deinen Browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, 
                    ignoriere diese E-Mail einfach.
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

/**
 * Send welcome email after verification
 */
async function sendWelcomeEmail(email, firstName) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Willkommen bei der SBF-Lernplattform!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1976D2;">Dein Account ist aktiviert!</h2>
                
                <p>Hallo ${firstName || 'User'},</p>
                
                <p>herzlich willkommen bei der SBF-Lernplattform! Dein Account wurde erfolgreich verifiziert.</p>
                
                <p><strong>Was du jetzt tun kannst:</strong></p>
                <ul>
                    <li>Wähle deinen Führerschein (SBF-See oder SBF-Binnen)</li>
                    <li>Starte mit dem Lernen in thematischen Kapiteln</li>
                    <li>Übe mit Prüfungssimulationen</li>
                    <li>Verfolge deinen Lernfortschritt</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/dashboard" 
                       style="background-color: #27AE60; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Jetzt loslegen
                    </a>
                </div>
                
                <p>Viel Erfolg bei deiner Prüfungsvorbereitung!</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    SBF-Lernplattform - Kostenlose Prüfungsvorbereitung
                </p>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Non-critical, don't throw
        return false;
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
