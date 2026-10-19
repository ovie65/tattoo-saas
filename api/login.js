const clientPromise = require('../lib/mongodb');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    // Strict, case-sensitive search. 
    // It looks for an exact match of the email OR an exact match of the username.
    const user = await users.findOne({
      $or: [
        { email: email },
        { name: email } 
      ]
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid email/username or password' });
    }

    // NEW: Check if the user has verified their email
    // If it is explicitly false, block them. 
    // (Note: Users who signed up before this update won't have this field, so they can still log in).
    if (user.verified === false) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid email/username or password' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};