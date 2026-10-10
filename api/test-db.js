import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  try {
    // Try to connect to the database
    const client = await clientPromise;
    const db = client.db("inkplatform");
    
    // If it works, send a success message
    res.status(200).json({ 
      message: "Successfully connected to MongoDB!", 
      database: db.databaseName 
    });
  } catch (error) {
    // If it fails, show the error
    res.status(500).json({ 
      error: "Failed to connect to MongoDB", 
      details: error.message 
    });
  }
}