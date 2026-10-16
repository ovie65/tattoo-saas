const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artistName, clientName, rating, text } = req.body;

  if (!artistName || !clientName || !rating || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const testimonials = db.collection('testimonials');
    const artists = db.collection('artists');

    // 1. Check the artist's settings (default max is 5)
    const artistProfile = await artists.findOne({ username: artistName });
    const maxTestimonials = (artistProfile && artistProfile.maxTestimonials) ? artistProfile.maxTestimonials : 5;
    
    // 2. Count how many testimonials this artist already has
    const count = await testimonials.countDocuments({ artistName: artistName });
    
    // 3. If they are full, block the new one
    if (count >= maxTestimonials) {
      return res.status(400).json({ error: 'This artist has reached their maximum number of testimonials.' });
    }

    // 4. Save the new testimonial
    await testimonials.insertOne({
      artistName: artistName,
      clientName: clientName,
      rating: parseInt(rating),
      text: text,
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, message: 'Testimonial saved' });
  } catch (error) {
    console.error('Save testimonial error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};