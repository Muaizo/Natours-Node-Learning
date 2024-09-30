const express = require('express');
const productController = require('./../controllers/productController');

const Router = express.Router();

Router.route('/')
  .post(productController.createProducts)
  .get(productController.getAllProducts);

Router.route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProducts)
  .delete(productController.deleteProducts);

module.exports = Router;
