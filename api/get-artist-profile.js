const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const users = db.collection('users');
    const artists = db.collection('artists');

    // STEP 1: Check if the user actually exists in the database
    const user = await users.findOne({ name: username });

    if (!user) {
      // User doesn't exist - show 404
      return res.status(404).json({ error: 'Artist not found' });
    }

    // STEP 2: User exists, now check for their artist profile
    const profile = await artists.findOne({ username: username });

    if (!profile) {
      // User exists but hasn't created a profile yet - return empty profile
      return res.status(200).json({ 
        success: true, 
        profile: {
          username: username,
          bio: '',
          portfolio: [],
          services: [],
          maxTestimonials: 5
        } 
      });
    }

    return res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};