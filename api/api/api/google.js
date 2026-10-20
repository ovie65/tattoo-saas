const { OAuth2Client } = require('google-auth-library');
const clientPromise = require('../lib/mongodb');

const GOOGLE_CLIENT_ID = '941593687164-djt4kj57ql7hemhpf0sdru4vj8iu7s44.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, credential, email, name } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');

    // ACTION 1: Verify Google Login
    if (action === 'verify') {
      if (!credential) return res.status(400).json({ error: 'Credential required' });
      
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const existingUser = await users.findOne({ email: payload.email });

      if (existingUser) {
        return res.status(200).json({
          success: true,
          user: { email: existingUser.email, name: existingUser.name }
        });
      } else {
        return res.status(200).json({
          success: true,
          needsUsername: true,
          email: payload.email
        });
      }
    } 
    
    // ACTION 2: Create New User
    else if (action === 'create') {
      if (!email || !name) return res.status(400).json({ error: 'Email and username required' });
      if (!/^[a-z0-9_-]+$/.test(name)) return res.status(400).json({ error: 'Invalid username format' });

      const existingUsername = await users.findOne({ name: name });
      if (existingUsername) return res.status(400).json({ error: 'This username is already taken.' });

      await users.insertOne({
        email: email,
        name: name,
        password: null,
        isGoogleUser: true,
        emailVerified: true,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Google API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};