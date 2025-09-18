const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
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
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
