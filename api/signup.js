const clientPromise = require('../lib/mongodb');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Save the user as unverified with the token
    await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      plan: 'free',
      bookingsUsed: 0,
      verified: false,
      verificationToken: verificationToken
    });

    // Build the verification link
    const siteUrl = process.env.SITE_URL || 'https://tattoo-saas-8ke8-two.vercel.app';
    const verificationLink = `${siteUrl}/verify-email.html?token=${verificationToken}`;

    // Send the verification email
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verify your email — INK',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to INK!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for signing up. Please verify your email address to activate your account.
            </p>
            <p style="margin: 24px 0;">
              <a href="${verificationLink}" style="background-color: #0a0a0a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Verify My Email
              </a>
            </p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If the button above doesn't work, copy and paste this link into your browser:<br/>
              <a href="${verificationLink}" style="color: #dc2626; word-break: break-all;">${verificationLink}</a>
            </p>
            <p style="font-size: 13px; color: #999; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        `
      });
      console.log('Verification email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup if email fails — user can request a new one later
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Account created! Please check your email to verify your account.',
      needsVerification: true
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};