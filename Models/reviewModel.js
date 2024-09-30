const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A Review can not be empty.'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // PARENT REFERENCING..
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A Review must belong to a User.'],
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A Review must belong to a Tour.'],
    },
  },
  // not stored in DB but show in P.M
  { toJSON: { virtuals: true }, toObj: { virtuals: true } }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// population.
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: '-__v -passwordChangedAt -email',
  // }).populate({
  //   path: 'tour',
  //   select: 'name difficulty duration price',
  // });

  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});

// static method(calls only on Model itself).
reviewSchema.statics.calcAvgRatings = async function (tourId) {
  // this points to the current model
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this point to the current review. and constructor is who created that doc.
  this.constructor.calcAvgRatings(this.tour); // tour id in review.
  // Reviews.calcAvgRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne();   // does not work here, query has already executed.
  this.r.constructor.calcAvgRatings(this.r.tour);
});

const Reviews = mongoose.model('Reviews', reviewSchema);

module.exports = Reviews;
