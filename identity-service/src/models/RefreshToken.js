const mongoose = require('mongoose')

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        // reference the User collection, establishing a relationship between tokens and users
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true})  //Automatically adds createdAt and updatedAt fields to each document

//This line adds a TTL (Time To Live) index on the expiresAt field, which tells MongoDB to automatically delete the document once the expiration time has passed. (work on Date only)
refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
module.exports = RefreshToken

// The TTL index works on a Date field in a document that represents the expiration time
// MongoDB runs a background thread every 60 seconds to check and remove expired documents.