const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    username, bio, yearsExp, piecesDone, sterile, 
    location, hours, hygiene, faq, socials,
    artistPhoto, recentWorks, footerLogo 
  } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const artists = db.collection('artists');

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
          faq: faq || [],
          socials: socials || [],
          artistPhoto: artistPhoto || '',
          recentWorks: recentWorks || [],
          footerLogo: footerLogo || '',
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: 'Profile saved successfully' });

  } catch (error) {
    console.error('Save profile error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};