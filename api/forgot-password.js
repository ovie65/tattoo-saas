const clientPromise = require('../lib/mongodb');
const { Resend } = require('resend');
const crypto = require('crypto');

// Initialize Resend with your new API key
const resend = new Resend('re_Jr7DsEXL_GjPAriZQ8NmfnTMeXn6hYN');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    // Find user (case-insensitive)
    const user = await users.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') } 
    });

    if (user) {
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const resetTokenExpiry = Date.now() + 3600000; 

      // Save the token and expiry to the user's document in the database
      await users.updateOne(
        { _id: user._id },
        { $set: { resetToken, resetTokenExpiry } }
      );

      // Create the reset link pointing to your reset-password page
      const resetLink = `https://tattoo-saas-8ke8-two.vercel.app/reset-password.html?token=${resetToken}`;

      // Send the email using Resend
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Replace with your verified domain if you have one (e.g., 'support@yourdomain.com')
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

    // CRITICAL: Always return success to prevent email enumeration
    return res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error.message);
    // Still return success to prevent enumeration, even if there's a server error
    return res.status(200).json({ 
      success: true, 
      message: 'If an account with that email exists, a reset link has been sent.' 
    });
  }
};