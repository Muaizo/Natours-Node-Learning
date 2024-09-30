const mongoose = require('mongoose');
const dotenv = require('dotenv');

// error for sync code...
process.on('uncaughtException', (err) => {
  console.log('Unhandled Excepted: Shutting Down');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {         // for local host
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    // console.log(conn.connection);
    console.log('DB connected💣');
  });
// .catch((er) => console.log('ERROR'));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Listening to the server ${port}...😀`);
});

// error for async code..
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection: Shutting Down');

  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
