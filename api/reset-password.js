const clientPromise = require('../lib/mongodb');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // 1. Find the user with this specific token, and make sure it hasn't expired
    const user = await users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // $gt means "greater than" current time
    });

    // 2. If no user is found, or the token is expired, reject it
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // 3. Hash the new password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update the user's password and delete the used token from the database
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
};