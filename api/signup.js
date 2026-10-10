const clientPromise = require('../lib/mongodb');
const bcrypt = require('bcryptjs');

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

    await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      plan: 'free',
      bookingsUsed: 0
    });

    return res.status(200).json({ success: true, message: 'Account created!' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};