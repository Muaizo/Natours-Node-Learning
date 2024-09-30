const AsyncError = require('./../utils/CatchAsyncError.js');
const AppError = require('./../utils/ErrorClass.js');
const ApiFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) => {
  return AsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No Document Found with this Id.'), 404);
    }

    res.status(204).json({
      doc: null,
    });
  });
};

exports.updateOne = (Model) => {
  return AsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // for validations..
    });

    if (!doc) {
      return next(new AppError('Document not found with this ID:', 404));
    }

    res.status(200).json({
      status: 'success',
      token: req.token,
      data: {
        doc,
      },
    });
  });
};

exports.createOne = (Model) => {
  return AsyncError(async (req, res, next) => {
    // const newdoc = new doc({})
    // newdoc.save()

    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      token: req.token,
      data: {
        doc,
      },
    });
  });
};

exports.getOne = (Model, popOptions) =>
  AsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    // const doc = await Model.findById(req.params.id).populate('reviews'); // same as Tour.findOne({_id : req.params.id})
    const doc = await query;
    if (!doc) {
      return next(new AppError('document not found with this ID:', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  AsyncError(async (req, res, next) => {
    // for nested GET Reviews.
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; // filter give the tour and find all reivew of tour.

    const features = new ApiFeatures(Model.find(filter), req.query) // if not filter than empty obj find() get all reviews
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // let doc = await features.query.explain();    // to give explanation.
    let doc = await features.query;
    // ===>>>. Mongoose Filter Methods.
    // const tour = await Tour.find().where("duration").equals(5).where("difficulty").equals("easy");

    // RESPONSE ..
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc,
      },
    });
  });
