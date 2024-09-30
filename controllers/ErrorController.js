const AppError = require('../utils/ErrorClass');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  // console.log('hello');
  return new AppError(message, 404);
};

const handleDuplicateErrorDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate Field Value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); // give the value in the object.
  const message = `Invalid data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid Token. Please login first!', 401);

const handleJWTExpireError = (err) =>
  new AppError('Token Expired!, Please login again.', 401);

const ErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const ErrorProduction = (err, res) => {
  // Operational or trusted error: send message to client.
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error.
    console.log('ERROR: ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    ErrorDev(err, res);
  }
  if (process.env.NODE_ENV === 'production') {
    // let error = { ...err, name: err.name, messeage: err.messeage };

    // console.log(error);
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateErrorDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);
    if (err.name === 'TokenExpiredError') err = handleJWTExpireError(err);

    ErrorProduction(err, res);
  }
};
