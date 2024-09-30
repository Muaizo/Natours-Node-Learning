const Reviews = require('./../Models/reviewModel');
const asyncErrors = require('./../utils/CatchAsyncError');
const factory = require('./factoryFunction.js');
// const AppError = require('./../utils/ErrorClass');

exports.setTourReviewId = (req, res, next) => {
  // Allow nested Routes. (if they are not in req.body then take from params.)
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Reviews);

exports.getOneReview = factory.getOne(Reviews);

exports.createReview = factory.createOne(Reviews);

exports.updateReview = factory.updateOne(Reviews);

exports.deleteReview = factory.deleteOne(Reviews);

// exports.deleteReview = asyncErrors(async (req, res, next) => {
//   const review = await Reviews.findByIdAndDelete(req.params.id);

//   if (!review) {
//     return next(new AppError('No review Found.'));
//   }

//   res.status(204).json({
//     status: 200,
//     review: null,
//   });
// });
