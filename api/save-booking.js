const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artistName, clientName, clientEmail, placement, date, description } = req.body;

  // Check if all required fields are present
  if (!artistName || !clientName || !clientEmail || !placement || !date || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Simple sanitization to prevent XSS (strips HTML tags)
  const sanitize = (str) => str.replace(/<[^>]*>?/gm, '');

  try {
    const client = await clientPromise;
    const db = client.db('inkplatform');
    const bookings = db.collection('bookings');

    // Save the booking to the database
    await bookings.insertOne({
      artistName: sanitize(artistName),
      clientName: sanitize(clientName),
      clientEmail: sanitize(clientEmail),
      placement: sanitize(placement),
      date: sanitize(date),
      description: sanitize(description),
      status: 'pending', // This will be 'pending', 'accepted', or 'declined'
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, message: 'Booking request sent' });

  } catch (error) {
    console.error('Save booking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};