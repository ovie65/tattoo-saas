const clientPromise = require('../lib/mongodb');
const { Resend } = require('resend');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const resend = new Resend('re_Jr7DsEXL_GjPAriZQ8NmfnTMeXn6hYNLg');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  if (action === 'forgot') {
    return await handleForgotPassword(req, res);
  } else if (action === 'reset') {
    return await handleResetPassword(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }
};

async function handleForgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    const user = await users.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') } 
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; 

      await users.updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpiry } }
      );

      const resetLink = `https://tattoo-saas-8ke8-two.vercel.app/reset-password.html?token=${resetToken}`;

      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: user.email,
        subject: 'Reset your INK password',
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="font-family: 'Space Grotesk', sans-serif; color: #0a0a0a; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #6b6b6b; line-height: 1.6; margin-bottom: 20px;">Hello,</p>
            <p style="color: #6b6b6b; line-height: 1.6; margin-bottom: 20px;">We received a request to reset your password for your INK account. Click the button below to proceed:</p>
            <a href="${resetLink}" style="display: inline-block; background: #0a0a0a; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0;">Reset Password</a>
            <p style="color: #6b6b6b; line-height: 1.6; margin-top: 20px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <p style="color: #6b6b6b; line-height: 1.6;">This link will expire in 1 hour for your security.</p>
            <p style="color: #6b6b6b; line-height: 1.6; margin-top: 30px; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #dc2626; word-break: break-all;">${resetLink}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">INK Studio &copy; 2026. All rights reserved.</p>
          </div>
        `
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent.' 
    });
  }
}

async function handleResetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    const user = await users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword }, 
        $unset: { resetToken: "", resetTokenExpiry: "" } 
      }
    );

    return res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}