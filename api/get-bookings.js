const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the artist's email from the URL
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    
    // Look in the 'bookings' collection
    const bookings = db.collection('bookings');

    // Find all bookings where the artistEmail matches the logged-in user
    const userBookings = await bookings.find({ artistEmail: email }).toArray();

    // Send the bookings back to the dashboard
    return res.status(200).json({ success: true, bookings: userBookings });

  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};