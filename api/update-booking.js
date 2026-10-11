const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing ID or status' });
  }

  if (status !== 'accepted' && status !== 'declined' && status !== 'pending') {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const bookings = db.collection('bookings');

    // Convert string ID to ObjectId
    const { ObjectId } = require('mongodb');
    const objectId = new ObjectId(id);

    const result = await bookings.updateOne(
      { _id: objectId },
      { $set: { status: status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json({ success: true, message: 'Booking updated' });

  } catch (error) {
    console.error('Update booking error:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};