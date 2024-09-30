const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A User must have a name..'],
    // maxlength: [25, 'A name must be less than 25 characters.'],
    minlength: [4, 'A name must be greater than 4 characters.'],
  },
  email: {
    type: String,
    required: [true, 'enter an email.'],
    validate: [validator.isEmail, 'please provide a valid Email.'],
    lowercase: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'entre the password.'],
    minlength: 8,
    select: false, // don't show password in get all users.
  },
  photo: {
    type: String,
  },
  passwordConfirm: {
    type: String,
    required: [true, ' confirm the password.'],
    // This only works on create and save..
    validate: {
      // validator to confirm password.
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password not matched!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Encrypting the Password.
userSchema.pre('save', async function (next) {
  // Only runs this function if password was actually modified( having been changed slightly).
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12.
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// To hide the user account which is inactive.
userSchema.pre(/^find/, function (next) {
  // this belongs to the current query.
  this.find({ active: { $ne: false } });
  return next();
});
// Instance method.. access on every document query.
userSchema.methods.correctPassword = function (candidatePass, userPass) {
  // to compare both passwords.
  return bcrypt.compare(candidatePass, userPass);
};

userSchema.methods.changedPassword = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = this.passwordChangedAt.getTime() / 1000;
    // console.log(changeTimeStamp, jwtTimeStamp);
    return jwtTimeStamp < changeTimeStamp; //  if token time after password change.
  }

  // IF password is not changed.
  return false;
};

// for making the reset Token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // (not incrypted.)

  // Incrypted and stored in DB.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min.
  console.log(
    { resetToken },
    this.passwordResetToken,
    this.passwordResetExpires
  );
  return resetToken;
};

const User = new mongoose.model('User', userSchema);

module.exports = User;
