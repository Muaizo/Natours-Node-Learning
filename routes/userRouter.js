const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// these 4 are not protected everyOne can use this.
router.post('/signup', authController.singup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// this middleware runs for all middlewares that are after use.
// all routes are protected after this middleware. Now bcz it runs first for all.
router.use(authController.protect);

router.get(
  '/me',
  // authController.protect,    // no need to put now
  userController.getMe,
  userController.getUser
);

router.patch(
  '/updateMe',
  /*authController.protect,*/ userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', /*authController.protect,*/ userController.deleteMe);
router.patch(
  '/updateMyPassword',
  /*authController.protect,*/
  authController.updatePassword
);

// Only admins can do changes in these middlewares..
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .patch(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
module.exports = router;
