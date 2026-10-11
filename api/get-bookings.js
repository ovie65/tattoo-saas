const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the artist's name from the URL instead of email
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Missing artist name' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const bookings = db.collection('bookings');

    // Find bookings where the artistName matches the logged-in user's name
    const userBookings = await bookings.find({ artistName: name }).toArray();

    return res.status(200).json({ success: true, bookings: userBookings });

  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};