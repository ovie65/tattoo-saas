const clientPromise = require('../lib/mongodb');
const { ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const testimonials = db.collection('testimonials');

    // GET: Fetch testimonials for an artist
    if (req.method === 'GET') {
      const artistName = req.query.artist;
      if (!artistName) return res.status(400).json({ error: 'Artist name required' });

      const list = await testimonials.find({ artistName }).toArray();
      return res.status(200).json({ success: true, testimonials: list });
    }

    // POST: Save a new testimonial
    if (req.method === 'POST') {
      const { artistName, clientName, rating, text } = req.body;
      if (!artistName || !clientName || !rating || !text) {
        return res.status(400).json({ error: 'All fields required' });
      }

      await testimonials.insertOne({
        artistName,
        clientName,
        rating: parseInt(rating),
        text,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true });
    }

    // DELETE: Delete a testimonial
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Testimonial ID required' });

      await testimonials.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('Testimonials API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};