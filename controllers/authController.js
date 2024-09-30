const crypto = require('crypto');
const util = require('util'); // built in promisify function.
const jwt = require('jsonwebtoken');
const User = require('./../Models/userModel');
const AppError = require('./../utils/ErrorClass');
const catchAsyncErrors = require('./../utils/CatchAsyncError');
const sendEmail = require('./../utils/sendEmails');
const { findById, findByIdAndUpdate } = require('../Models/tourModel');

// creating a token.
const signToken = (id) => {
  // sign method to create ..
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // res.cookie('jwt', token, {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ), // to convert it into millisec..
  //   secure: true, // it only works in HTTPS.
  //   httpOnly: true,
  // });

  // // send, store and send back with every request.
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // to convert it into millisec..
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  // Don't show it in output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};
// Creating the new user..
exports.singup = catchAsyncErrors(async (req, res, next) => {
  // give specific data to the user.
  const newUser = await User.create(
    // ({
    // name: req.body.name,
    // email: req.body.email,
    // password: req.body.password,
    // passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
    // passwordResetToken: req.body.passwordResetToken,
    // passwordResetExpires: req.body.passwordResetExpires,
    // })
    req.body
  );

  // create the token..
  // to decode this go to jwt.io
  // const token = signToken(newUser._id);

  createSendToken(newUser, 201, res);
  // console.log(token);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   user: newUser,
  // });
});

// logging the user//.
exports.login = catchAsyncErrors(async (req, res, next) => {
  // destructuring..
  const { email, password } = req.body;

  // 1) Check if email and password exists.
  if (!email || !password) {
    return next(new AppError('Please enter the email and password!', 400));
  }

  // 2) if the user exist and password is correct.
  const user = await User.findOne({ email: email }).select('+password'); // explicitly select pass bcz it's hidden.

  //>>>> correct pass function in model.. to compare the passwords.
  // const correct = await user.correctPassword(password, user.password);

  // if(!user || !correct){
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password!', 401)); // 401 unauthorized.
  }

  // 3) if everything ok, send token to client.

  createSendToken(user, 200, res);

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

// to Check if user is logged in or not.
exports.protect = catchAsyncErrors(async (req, res, next) => {
  // 1} Check if token exist.

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(req.headers.authorization);
  // console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in.. Please login first.', 401)
    );
  }

  // 2) Varification Token..

  // const {promisify} = util;  can also do destructuring.
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // 2 errors in error controller......
  // console.log(decoded);

  // 3) Check if user still exists.

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does not exist!', 401)
    );
  }

  // 4) Check if user changed password after the token was issued.

  // change pass function in USER MODEL.
  if (currentUser.changedPassword(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the Password.. Please Login again',
        401
      )
    );
  }

  // GRANT EXCESS TO PROCTECTED ROUTE.
  // Must.. send user to access in restrict.
  req.user = currentUser;
  // token = signToken(currentUser.id);
  // req.body.token = token;
  next();
});

// apply restriction if admin or user.(give authorities)
exports.restrictTo = (...roles) => {
  return function (req, res, next) {
    // roles = ['admin', 'lead-guide'] default = user.

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403) // 403 for forbidden
      );
    }

    next();
  };
};

// condition for the forgot pass.
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // 1) GET USER BASED ON POSTED EMAIL.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with this Email>.<', 404));
  }

  // 2) GENERATE THE RANDOM RESET TOKEN.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // to save the password token and expires, in db.

  // 3) SEND IT TO USER EMAIL.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a patch request with a new password and a passwordConfirm to: ${resetURL}.
  If you didn't forget your password, please ignore this email.`;

  // we use try catch bcz there is no return value in sendEmail.
  try {
    // sending to email.
    await sendEmail({
      email: user.email, // req.body.email
      subject: 'Your password reset Token (valid for 10 min).',
      message, // message : message
    });

    res.status(200).json({
      status: 'success',
      message: `Token send to email ${user.email}.`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, Please try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // 1) GET USER BEASED ON THE TOKEN.

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // console.log(hashedToken);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // if not expires.
  });

  console.log(user);

  // 2) IF THE TOKEN IS NOT EXPIRED, USER EXISTS, SET NEW PASSWORD.

  if (!user) {
    return next(new AppError('Token is invalid or Expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) UPDATE changePasswordAt PROPERTY FOR THE USER.
  // middleware in userModel. (changePasswordAt). (Date.)

  // 4) LOG THE USER IN, SEND TOKEN.

  const token = signToken(user._id);

  res.status(200).json({
    status: 'Success',
    token,
  });
});

exports.updatePassword = async (req, res, next) => {
  // 1) Get user from collection.

  const user = await User.findById(req.user.id).select('+password'); // req.user.id => from protect.
  // console.log(user);

  // 2) Check if posted password id correct.

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect password!', 401));
  }

  // 3) if so, Update Password.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate() will not work as intended! bcz we use user.save.

  // 4) Log user in, send jwt.

  createSendToken(user, 200, res);

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
};

// exports.updateMe = async (req, res, next) => {
//   console.log(req.body);

//   // filteration..
//   delete req.body['role'];

//   console.log(req.body);
//   const user = await User.findByIdAndUpdate(req.user.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   // user.email = req.body.email;
//   // user.name = req.body.name;
//   // await user.save();

//   res.status(200).json({
//     status: 'success',
//     user,
//   });
// };
