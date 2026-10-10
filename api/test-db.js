const clientPromise = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("inkplatform");
    
    res.status(200).json({ 
      message: "Successfully connected to MongoDB!", 
      database: db.databaseName 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to connect to MongoDB", 
      details: error.message 
    });
  }
};