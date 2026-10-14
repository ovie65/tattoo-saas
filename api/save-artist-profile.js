const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  // Get the username from the URL (e.g., ?username=Ovie65)
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const artists = db.collection('artists');

    // Find the artist's profile in the database
    const profile = await artists.findOne({ username: username });

    if (!profile) {
      // If they haven't saved anything yet, return null
      return res.status(200).json({ success: true, profile: null });
    }

    return res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};