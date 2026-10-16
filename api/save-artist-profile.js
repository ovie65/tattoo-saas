const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    username, bio, tagline, yearsExp, piecesDone, sterile, 
    services, rules, aftercare, process, location, hours, hygiene, 
    faq, socials, artistPhoto, recentWorks, footerLogo 
  } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const artists = db.collection('artists');

    await artists.updateOne(
      { username: username },
      { 
        $set: { 
          username: username,
          bio: bio || '',
          tagline: tagline || '',
          yearsExp: yearsExp || '',
          piecesDone: piecesDone || '',
          sterile: sterile || '',
          services: services || '',
          rules: rules || '',
          aftercare: aftercare || '',
          process: process || '',
          location: location || '',
          hours: hours || '',
          hygiene: hygiene || '',
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

    return res.status(200).json({ success: true, message: 'Profile saved' });
  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};