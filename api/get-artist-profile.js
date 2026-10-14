const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const artists = db.collection('artists');

    const profile = await artists.findOne({ username: username });

    if (!profile) {
      return res.status(200).json({ success: true, profile: null });
    }

    return res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};