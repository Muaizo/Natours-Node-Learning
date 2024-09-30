const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');   // used When Embedding not in referrencing.

// basic way of defining schema.....

// const schema = mongoose.Schema({
//   name: "String",
//   ratings: "Number",
//   price: "Number",
// })

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name:'],
      unique: true,
      trim: true,
      maxlength: [40, 'The Tour must be less than or equal to  40 Charators..'],
      minlength: [
        10,
        'The Tour must be greater than or equal to  10 Charators..',
      ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a Difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'The tour has Invalid Difficulty...',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'The tour Rating must be less than 5'],
      min: [1, 'The Tour Rating must be greater then 0'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666666666 => 46.666 => 47 =>>> 4.7.
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price:'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only works for new Doc creating.. not old ones.
          return val < this.price;
        },
        message: 'The discount Price [{VALUE}] must be less than Price.',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a Description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a Cover Image'],
    },
    images: [String], // array of images in String..
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GEOJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // EMBEDDING USERS.
    // guide: Array,
    // REFFERENCING USERS.
    guides: [
      {
        type: mongoose.Schema.ObjectId, // To store the mongoose id's of user. reference id's.
        ref: 'User', // Refference.
      },
    ],
  },
  { toJSON: { virtuals: true }, toObj: { virtuals: true } }
);

// INDEXES IN DB.
// index for faster searching and retrieval of data from a data store or database
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 for accending
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// virtuals are just like schema property but not saved in dataBase.
tourSchema.virtual('durationWeekend').get(function () {
  return Math.floor(this.duration / 7);
});

// Virtual populate. (not store data in db but show in output).
// after that go to get tour and populate it
tourSchema.virtual('reviews', {
  ref: 'Reviews',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE : runs before .save() and .create()

tourSchema.pre('save', function (next) {
  // console.log(this); // this belongs to the document from save() or create().
  this.slug = slugify(this.name, { lower: true });
  next();
});

// To embed the User by ID.
// tourSchema.pre('save', async function (next) {
//   this.guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(this.guidesPromise);
// });

// tourSchema.pre('save', function (next) {
//   console.log('Document loaded.....');
//   next();
// });

// // runs after the document is save or created.
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE....

// runs before..
// tourSchema.pre("find", function(next) {    /^find/ => check all that contain find..

// REFFERENCING POPULATE(T OSHOW THE USERS LIKE EMBEDDING.)
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(
    `Query Middle ware took ${Date.now() - this.start} miliseconds...`
  );
  // console.log(doc);
  next();
});

// AGGREGATION MIDDLEWARE.....
// tourSchema.pre('aggregate', function (next) {
//   console.log(this.pipeline());

//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
