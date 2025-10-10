export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const error = {
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(error);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

