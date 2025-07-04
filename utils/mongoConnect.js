require('dotenv').config();
const mongoose = require('mongoose');

let connection;
async function connectToMongoDB() {
    try {
        if (connection) {
            return connection; // Return existing connection if already established
        }

        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        connection = await mongoose.connect(mongoUri);

        console.log('Connected to MongoDB successfully');
        return connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

async function getMongoConnection() {
    if (!connection) {
        connection = await connectToMongoDB();
    }
    return connection;
}

module.exports = {
    connectToMongoDB,
    getMongoConnection
};

