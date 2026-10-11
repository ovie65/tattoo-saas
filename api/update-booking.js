const { ObjectId } = require('mongodb');
const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing ID or status' });
  }

  // Make sure the status is either 'accepted' or 'declined'
  if (status !== 'accepted' && status !== 'declined') {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const bookings = db.collection('bookings');

    // Find the booking by its ID and update the status
    await bookings.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    return res.status(200).json({ success: true, message: 'Booking updated' });

  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};