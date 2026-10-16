const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist } = req.query;

  if (!artist) {
    return res.status(400).json({ error: 'Artist name is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const testimonials = db.collection('testimonials');

    // Find all testimonials for this artist, sorted by newest first
    const list = await testimonials.find({ artistName: artist })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ success: true, testimonials: list });
  } catch (error) {
    console.error('Get testimonials error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};