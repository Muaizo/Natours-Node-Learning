const nodemailer = require('nodemailer');

const sendEmail = async (Options) => {
  //   1) CREATE A TRANSPORTER.
  const transporter = nodemailer.createTransport({
    // host: process.env.EMAIL_HOST,
    // port: process.env.EMAIL_PORT,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //   2) DEFINE THE EMAIL OPTION.
  const mailOption = {
    from: `Abdulmuaiz <${process.env.EMAIL_USERNAME}`,
    to: Options.email,
    subject: Options.subject,
    text: Options.message,
    // html:
  };

  //   3) ACTUALLY SEND THE EMAIL.
  await transporter.sendMail(mailOption); // return promise that's why await.
};

module.exports = sendEmail;
