const AppError = require('../utils/ErrorClass');
const Tour = require('./../Models/tourModel');
const catchAsyncErrors = require('./../utils/CatchAsyncError');
const factory = require('./factoryFunction.js');
// const AppError = require('./../utils/ErrorClass');
// const ApiFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,duration,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsyncErrors(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews'); // same as Tour.findOne({_id : req.params.id})

//   if (!tour) {
//     return next(new AppError('Tour not found with this ID:', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsyncErrors(async (req, res, next) => {
//   // const tour = await Tour.findOneAndUpdate({ _id: req.params.id });
//   // tour = Object.keys(tour).map((el) => {
//   //   if (el === Object.keys(req.body)) {
//   //     el = req.body;
//   //   }
//   // });

//   // model middleware will not work ..
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true, // for validations..
//   });

//   if (!tour) {
//     return next(new AppError('Tour not found with this ID:', 404));
//   }

//   res.status(200).json({
//     status: 200,
//     data: {
//       tour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        totalTour: { $sum: 1 }, // counter
        totalRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 /*  1 for assecding..*/ },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 200,
    stats,
  });
});

exports.getMonthlyYear = catchAsyncErrors(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDate',
    },
    {
      $match: {
        startDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDate' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getWithIn = catchAsyncErrors(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3965.2 : distance / 6378.1;
  console.log(radius);

  if (!lat || !lng) {
    next(new AppError('Please Provide latitude and longitude!', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'Success',
    results: tours.length,
    tours,
  });
});

exports.getDistances = catchAsyncErrors(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  console.log(unit);
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please Provide latitude and longitude!', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    distances,
  });
});

// exports.getMonthlyYear = async (req, res) => {
//
//     const year = req.params.year * 1;

//     const plan = await Tour.aggregate([
//       {
//         $unwind: '$startDate',
//       },
//       {
//         $match: {
//           $gte: new Date(`${year}-01-01`),
//           $lte: new Date(`${year}-12-31`),
//         },
//       },
//       {
//         $group: {
//           $_id: { $month: '$startDate' },
//           $numTourStarts: { $sum: 1 },
//         },
//       },
//     ]);

//     res.status(200).json({
//       status: 200,
//       data: {
//         plan,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };
/////

// /
// /
// /
// /
// /
// /
// /
// /
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// /
// /
// /
// /
// /
// /
// //
// /

// // const fs = require('fs');
// const Tour = require('./../Models/tourModel');
// const features = require('./../utils/apiFeatures');

// // const tours = JSON.parse(
// //   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// // );

// // exports.check = (req, res, next, val) => {
// //   console.log(`id is = ${val}`);

// //   // if (!tour)
// //   if (req.params.id > tours.length) {
// //     return res.status(404).json({
// //       status: 'fail',
// //       message: 'Invalid ID.',
// //     });
// //   }
// //   next();
// // };

// exports.aliasTopTours = (req, res, next) => {
//   req.query.limit = '5';
//   req.query.sort = '-ratingsAverage,price';
//   req.query.fields = 'name,price,ratingsAverage,duration,difficulty';
//   next();
// };

// exports.getAllTours = async (req, res) => {
//
//     console.log(req.query);

//     // BUILD QUERY..
//     // 1) FILTERING..

//     // const queryObj = { ...req.query };
//     // const excludedQuery = ['page', 'sort', 'limit', 'fields'];
//     // excludedQuery.forEach((el) => delete queryObj[el]);
//     // console.log(queryObj);

//     // const tours = await Tour.find();   // to find all the tours.

//     // const tours = await Tour.find({ duration: 5, difficulty: 'easy' });    // find manually
//     // const tours = await Tour.find(req.query); // req.query = { duration: 5, difficulty: 'easy' }.
//     // console.log(req.query);

//     // 2) ADVANCE FILTERING ( > <  >= <= )

//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // gte to $gte
//     // // console.log(JSON.parse(queryStr));

//     // let query = Tour.find(JSON.parse(queryStr));

//     // { difficulty: 'easy', duration: { $gte : 5} }
//     // { difficulty: 'easy', duration: { gte: '5' } }

//     // 3) SORT...

//     // if (req.query.sort) {
//     //   const sortBy = req.query.sort.split(',').join(' ');
//     //   console.log(sortBy); // req.query.sort === ( 'price ratingsAverage').

//     //   query = query.sort(sortBy); // ===  sort(-price -ratingsAverage)
//     // } else {
//     //   query.sort('-createdAt');
//     // }

//     // 4) FIELDS LIMITING..

//     // if (req.query.fields) {
//     //   const field = req.query.fields.split(',').join(' ');
//     //   console.log(field);
//     //   query = query.select(field);
//     // } else {
//     //   query = query.select('-__v'); // (-) to remove this field.
//     // }

//     // 5) PAGINATION...

//     // const page = req.query.page * 1 || 1;
//     // const limit = req.query.limit * 1 || 100;
//     // const skip = (page - 1) * limit;

//     // console.log('Skip is', skip);
//     // query = query.skip(skip).limit(limit);

//     // if (req.query.page) {
//     //   const countPage =await Tour.countDocuments(); // to count the documents..
//     //   if (skip >= countPage) {
//     //     throw new Error("This page doesn't exist....")
//     //   }
//     // }

//     // EXECUTE QUERY.

//     // let tours = await query.limit(limit);
//     const features = new ApiFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     let tours = await features.query;

//     // tours = await Tour.find().skip(skip).limit(limit);
//     // ===>>>. Mongoose Filter Methods.
//     // const tours = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy");

//     // RESPONSE ..
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours, // if property and the key are same then just write one => tours: tours  === tours,
//       },
//     });
//   } catch (err) {
//     res.status(401).json({
//       status: 'Fail',
//       message: err,
//     });
//   }
// };

// exports.getTour = async (req, res) => {
//
//     const tour = await Tour.findById(req.params.id); // same as Tour.findOne({_id : req.params.id})

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(401).json({
//       status: 'Fail',
//       message: err,
//     });
//   }
// };

// exports.createTour = async (req, res) => {
//
//     // const newTour = new Tour({})
//     // newTour.save()

//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

// exports.updateTour = async (req, res) => {
//
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true, // for validations..
//     });

//     res.status(200).json({
//       status: 200,
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

// exports.deleteTour = async (req, res) => {
//
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 200,
//       tour: null,
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };
