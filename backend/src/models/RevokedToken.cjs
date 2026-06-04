const mongoose = require('mongoose');

// Stores revoked JWT jti/token hash until their natural expiry.
// A TTL index auto-purges expired entries so the collection stays small.
const RevokedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('revokedtoken', RevokedTokenSchema);
