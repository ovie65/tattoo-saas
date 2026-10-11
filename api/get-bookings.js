const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const bookings = db.collection('bookings');

    // Get ALL bookings for now
    const allBookings = await bookings.find({}).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({ success: true, bookings: allBookings });

  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};