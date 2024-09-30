const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const GlobalErrorHandler = require('./controllers/ErrorController');
const AppError = require('./utils/ErrorClass');
const tourRouter = require('./routes/tourRouter');
const reviewRouter = require('./routes/reviewRouter');
const userRouter = require('./routes/userRouter');
const productRouter = require('./routes/productRouter');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)Global MIDDLEWARES..

// Serving static files.
// app.use(express.static(`${__dirname}/public`)); // used to read files on server through route (html file, img).
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADER     (always on top)
app.use(helmet());

// DEVELPMENT LOGGING.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// LIMIT REQUESTS FROM SAME API.

// Allow 100 requests from same IP in 1 hour.
const limitor = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try Again in an hour.',
});
app.use('/api', limitor);

// Body parser, Read data from req.body (to create the api through post (must)).
app.use(express.json({ limit: '10kb' }));

//DATA SANITIZE AGAINST NOSQL QUERY INJECTION (AFTER BODY PARSER..)
app.use(mongoSanitize()); // remove $ sign.

//DATA SANITIZE AGAINST XSS QUERY INJECTION (AFTER BODY PARSER..)
app.use(xss()); // remove malicious HTML code. convert <> to $le or $gt..

// PARAMETRE POLLUTION.
app.use(
  hpp({
    //  allow duplicate fields.
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(morgan('tiny'));

// TEST MIDDLEWARES.
app.use((req, res, next) => {
  console.log('Hello from the Middleware..🙋‍♂️');
  next(); // can not excess the value if not written.
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next(); // can not excess the value if not written.
});

// 3) ROUTES...
app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Muaiz',
  });
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);

// (all) for all the routes(get, post, delete, update etc).
// * means everything everyroute.
// it will execute when we put invalid url.

// ==1)
// app.all('*', (req, res) => {
//   res.status(404).json({
//     status: 'fail',
//     message: `No found ${req.originalUrl} on this server!`,
//   });
// });

// ==2)
app.all('*', (req, res, next) => {
  //{ const err = new Error(`No found ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err); // passing the error.}

  next(new AppError(`No found ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING..
app.use(GlobalErrorHandler);

// 4) START SERVER...

module.exports = app;

//////////////////////////////////////////////////////////////////////////////////////////

//challenge.
// app.post('/api/v1/tours', (req, res) => {
//   console.log(req.body);
//   const body = req.body;
//   res.json({
//     Achieve: req.requestTime,
//     tour: body,
//   });
// });

// Same as URL in node farm...
// http method for the request...

// app.get('/', (req, res) => {
//   res.status(200).send('Hello from the server side!');
// });

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello from the server.', app: 'natours' }); // can also send json file.
// });

// routes
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour); // to write variables in url we use :
// app.post('/api/v1/tours', createTour); // posting..
// app.patch('/api/v1/tours/:id', updateTour); // Updating the tour.
// app.delete('/api/v1/tours/:id'); // Deleting the tour.

// app.post('/', (req, res) => {
//   res.send('You can now post it to the server....');
// });

// listening to the server..
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Listening to the Port ${port}...`);
// });
