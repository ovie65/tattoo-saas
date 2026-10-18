const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing verification token' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    // Find the user with this specific token
    const user = await users.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    // If found, mark them as verified and delete the token so it can't be used again
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { verified: true },
        $unset: { verificationToken: 1 }
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully! You can now log in.' 
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};