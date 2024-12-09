// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB Connected:', conn.connection.host);

        // Log database name
        console.log('Database Name:', conn.connection.name);

        // Log collections
        const collections = await mongoose.connection.db.collections();
        console.log('Collections:', collections.map(c => c.collectionName));

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;