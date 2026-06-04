const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const RevokedToken = require('../models/RevokedToken.cjs');
const logger = require('../utils/logger.cjs');

module.exports = async function (req, res, next) {
  // Get token from header or cookie
  let token;

  // Check for token in Authorization header
  if (req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    logger.debug('Auth header found');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7, authHeader.length);
      logger.debug('Bearer token extracted from header');
    }
  }

  // If not in header, check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    logger.debug('Token found in cookies');
  }

  // Check if no token
  if (!token) {
    logger.debug('No token found in request. Auth denied.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Reject revoked tokens (logged-out sessions)
    const revoked = await RevokedToken.findOne({ token });
    if (revoked) {
      return res.status(401).json({ msg: 'Token has been revoked' });
    }
    
    // Fetch fresh user data from database to ensure role/status is current
    // This prevents issues with cached role in JWT after role changes
    const user = await User.findById(decoded.user.id).select('role status isDeleted name');
    
    if (!user) {
      logger.debug('User not found in database');
      return res.status(401).json({ msg: 'User not found' });
    }
    
    // Check if user account is still valid
    if (user.isDeleted) {
      logger.debug('User account has been deleted');
      return res.status(401).json({ msg: 'Account has been deleted' });
    }
    
    if (user.status !== 'active') {
      logger.debug(`User account is ${user.status}`);
      return res.status(401).json({ msg: `Account is ${user.status}` });
    }
    
    // Use fresh role from database instead of JWT cached role
    req.user = {
      id: decoded.user.id,
      name: user.name,
      role: user.role  // Fresh role from database
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    logger.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
