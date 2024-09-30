const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// to merge the files(tour router) and get access of Id from tour.
const router = express.Router({ mergeParams: true });

// work for both
// POST /tours/2345fb2/reviews    (nested.)
// POST /reviews.

router.use(authController.protect); // to protect all the reviews.

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'),
  reviewController.setTourReviewId, // middleware.
  reviewController.createReview
);

// router
//   .route('/')
//   .get(reviewController.getAllReviews)
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router
  .route('/:id')
  .get(reviewController.getOneReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'), // only admins and users can delete or update reviews
    reviewController.deleteReview
  );

module.exports = router;
