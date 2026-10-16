const clientPromise = require('../lib/mongodb');
const { ObjectId } = require('mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { testimonialId, username } = req.body;

  if (!testimonialId || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const testimonials = db.collection('testimonials');

    // Delete the testimonial. 
    // We check both the ID and the username so an artist can only delete their OWN reviews.
    const result = await testimonials.deleteOne({ 
      _id: new ObjectId(testimonialId),
      artistName: username 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    return res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};