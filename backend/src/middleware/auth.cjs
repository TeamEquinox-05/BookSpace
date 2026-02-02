const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

module.exports = async function (req, res, next) {
  // Get token from header or cookie
  let token;

  // Check for token in Authorization header
  if (req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    console.log('Auth header found:', authHeader);
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7, authHeader.length);
      console.log('Bearer token extracted from header');
    }
  }

  // If not in header, check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token found in cookies');
  }

  // Check if no token
  if (!token) {
    console.log('No token found in request. Auth denied.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from database to ensure role/status is current
    // This prevents issues with cached role in JWT after role changes
    const user = await User.findById(decoded.user.id).select('role status isDeleted name');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ msg: 'User not found' });
    }
    
    // Check if user account is still valid
    if (user.isDeleted) {
      console.log('User account has been deleted');
      return res.status(401).json({ msg: 'Account has been deleted' });
    }
    
    if (user.status !== 'active') {
      console.log(`User account is ${user.status}`);
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
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
