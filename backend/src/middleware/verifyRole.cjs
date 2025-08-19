module.exports = (roles) => (req, res, next) => {
  // roles can be a single string or an array of strings
  if (typeof roles === 'string') {
    roles = [roles];
  }

  if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Access denied: Insufficient role' });
  }
  next();
};