const Product = require('./../Models/productModel');

exports.createProducts = async (req, res) => {
  try {
    const prod = await Product.create(req.body);
    // console.log(prod);
    res.status(200).json({
      status: 'Success',
      body: {
        products: prod,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const prod = await Product.find();

    res.status(200).json({
      status: 'Success',
      totalProducts: prod.length,
      body: {
        products: prod,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);

    if (!prod) throw Error('No document found with this id.');

    res.status(200).json({
      status: 'Success',
      body: {
        products: prod,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.updateProducts = async (req, res) => {
  try {
    const prod = await Product.findByIdAndUpdate(req.params.id, {
      new: true,
      validator: true,
    });

    res.status(200).json({
      status: 'Success',
      body: {
        products: prod,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.deleteProducts = async (req, res) => {
  try {
    const prod = await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'Success',
      body: {
        products: prod,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'error',
      message: err.message,
    });
  }
};
