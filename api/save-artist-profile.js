const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  // Only allow POST requests (saving data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, bio, yearsExp, piecesDone, sterile, location, hours, hygiene } = req.body;

  // Make sure we know which artist is saving
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const artists = db.collection('artists');

    // This is the magic part: 
    // If the artist already has a profile, it UPDATES it.
    // If they don't have a profile yet, it CREATES a new one.
    const result = await artists.updateOne(
      { username: username },
      { 
        $set: { 
          username: username,
          bio: bio,
          yearsExp: yearsExp,
          piecesDone: piecesDone,
          sterile: sterile,
          location: location,
          hours: hours,
          hygiene: hygiene,
          updatedAt: new Date()
        } 
      },
      { upsert: true } // 'upsert' means update or insert
    );

    return res.status(200).json({ success: true, message: 'Profile saved successfully' });

  } catch (error) {
    console.error('Save profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};