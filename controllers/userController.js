// const { findOne } = require('../Models/tourModel');
const AppError = require('../utils/ErrorClass');
const User = require('./../Models/userModel');
const multer = require('multer');
const sharp = require('sharp');
const catchAsyncErrors = require('./../utils/CatchAsyncError');
const factory = require('./factoryFunction.js');

// when doin img processing after uploading then not save in disk but save in memory.

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); // 1 param err if not then null
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]; //to get jpeg.
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please upload an image', 400), false);
  }
};

// SIMPLE METHOD.
// const upload = multer({ dest: 'data/img/users' }); // destination where to save photo.

// NEW METHOD.
const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); // destination where to save photo.

exports.uploadUserPhoto = upload.single('photo'); // photo property names

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

// to filter the allowed fields.
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUser = (req, res) => {
  // 500 for internal Error
  res.status(500).json({
    status: 'Error',
    message: 'This Route is not defined. Please signUp.',
  });
};

// CAN GET HIS DATA..
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // to convert id to params.
  next();
};

// user can update his data.
exports.updateMe = catchAsyncErrors(async (req, res, next) => {
  // 1) CREATE ERROR IF USER UPDATE PASSWORD.
  if (req.body.password || req.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for update Passwords. Please hit /updateMyPassword`,
        400
      )
    );
  }

  // 2) FILTER UNWANTED FIELDS NAME TAHT ARE NOT ALLOWED TO UPDATE.

  // we can't pass whole body but we restrict it to change/update few parametres.
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3)  UPDATE USER DOCUMENTS.

  // CAN'T DO THIS..
  // user.name = req.body.name;
  // await user.save();
  // SINCE WE ARE NOT DEALING WITH PASSWORDS OR ANY SENSITIVE DATA NOW WE USE FindByIdAndUpdate.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

// User can inactive his account still store in DB.
exports.deleteMe = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    user: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// Do NOT update Passwords here.
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
