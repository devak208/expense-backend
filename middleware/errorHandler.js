const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Clerk authentication errors
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid or missing authentication token'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;