const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController'); // router.route('/:tourId/reviews')
const reviewRouter = require('./reviewRouter.js');

const router = express.Router();

// router.param('id', tourController.check);

// NESTED ROUTES ONE OF TOUR AND ONE OF REVIEW.
// GET /tours/2345fb2/reviews
// POST /tours/2345fb2/reviews/744fbd4

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// if this API hits then go to the review router.
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyYear
  );

// /tours-within/250/center/34.10606255657772, -118.13445500031689/unit/'mi'
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getWithIn);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
    // protect always first to chk if logged in or not then restrict if admin or user,
  );

module.exports = router;
