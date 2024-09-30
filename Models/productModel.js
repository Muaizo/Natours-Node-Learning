const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  brandName: {
    type: String,
    required: [true, 'a Product Must have a Brand.'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'a Product Must have a model No.'],
    trim: true,
  },
  memory: {
    ram: {
      type: String,
      required: [true, 'a Product Must have a memory.'],
    },
    rom: {
      internal: {
        type: String,
        required: [true, 'a Product Must have Ram.'],
      },
      external: {
        type: String,
        required: [true, 'a Product Must have Ram.'],
      },
    },
  },
  battery: {
    battery: {
      type: String,
      required: [true, 'a Product Must have a name.'],
    },
    batterhealth: {
      type: String,
      required: [true, 'A battery Must have a battery health.'],
    },
    batteryType: {
      type: String,
      default: 'Simple',
    },
  },
  fingerPrint: {
    type: Boolean,
    required: [true, 'a Product Must give Info.'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  body: {
    weight: {
      type: Number,
      required: [true, 'a Product Must have a weight.'],
    },
    display: {
      type: Number,
      required: [true, 'a Product Must have a display.'],
    },
    sim: { type: Number, default: 1 },
  },

  doubleCamera: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: [true, 'a Product Must have a Price.'],
  },
  maxDuration: {
    type: String,
    required: [true, 'a Product Must have a Duration.'],
  },
  imageType: {
    type: String,
    default: '📱',
  },
  quality: {
    type: String,
    required: [true, 'a Product Must give Quality.'],
  },
  lounch: {
    type: Date,
    default: Date.now(),
  },
  expire: {
    type: String,
    default: '23-01-2030',
  },
});

const productModel = mongoose.model('Products', productSchema);

module.exports = productModel;
