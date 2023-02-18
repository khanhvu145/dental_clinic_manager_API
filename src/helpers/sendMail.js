const nodemailer = require('nodemailer');
const SMTPConfig = require('../models/tw_SMTPConfig');
const IsNullOrEmpty = require('../helpers/IsNullOrEmpty');
const googleAuth = require('google-auth-library');
const OAuth2Client = googleAuth.OAuth2Client;
const dotenv = require('dotenv');
dotenv.config();

// const GOOGLE_MAILER_CLIENT_ID = process.env.GOOGLE_MAILER_CLIENT_ID;
// const GOOGLE_MAILER_CLIENT_SECRET = process.env.GOOGLE_MAILER_CLIENT_SECRET;
// const GOOGLE_MAILER_REFRESH_TOKEN = process.env.GOOGLE_MAILER_REFRESH_TOKEN;
// const ADMIN_EMAIL_ADDRESS = 'dentalclinic.mail.vn@gmail.com';

// // Khởi tạo OAuth2Client với Client ID và Client Secret 
// const myOAuth2Client = new OAuth2Client(
//   GOOGLE_MAILER_CLIENT_ID,
//   GOOGLE_MAILER_CLIENT_SECRET
// )
// // Set Refresh Token vào OAuth2Client Credentials
// myOAuth2Client.setCredentials({
//   refresh_token: GOOGLE_MAILER_REFRESH_TOKEN
// })

// module.exports = async(mail) => {
//         const myAccessTokenObject = await myOAuth2Client.getAccessToken();
//         const myAccessToken = myAccessTokenObject?.token;
//         const transport = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//               type: 'OAuth2',
//               user: ADMIN_EMAIL_ADDRESS,
//               clientId: GOOGLE_MAILER_CLIENT_ID,
//               clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
//               refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
//               accessToken: myAccessToken
//             },
//             tls: {
//                 rejectUnauthorized: false
//             }
//         });

//         const mailOptions = {
//             to: mail.to,
//             subject: mail.subject,
//             html: mail.body
//         };

//         // Gọi hành động gửi email
//         await transport.sendMail(mailOptions);

//         return;
// };

module.exports = async(mail) => {
  var config = await SMTPConfig.find({});
  if(config != null && config.length > 0){
    var smtpConfigInfo = config[0]; 
    if(!IsNullOrEmpty(smtpConfigInfo.email) && !IsNullOrEmpty(smtpConfigInfo.password) && !IsNullOrEmpty(smtpConfigInfo.host)){
      const transporter = nodemailer.createTransport({
          host: smtpConfigInfo.host,
          port: 465,
          secure: true, 
          auth: {
            user: smtpConfigInfo.email,
            pass: smtpConfigInfo.password
          },
          tls: {
              rejectUnauthorized: false
          }
      });

      const options = {
          from: smtpConfigInfo.email, // địa chỉ admin email bạn dùng để gửi
          to: mail.to, // địa chỉ gửi đến
          subject: IsNullOrEmpty(smtpConfigInfo.name) ? mail.subject : `[${smtpConfigInfo.name}] ${mail.subject}`, // Tiêu đề của mail
          html: mail.body // Phần nội dung mail mình sẽ dùng html thay vì thuần văn bản thông thường.
      };

      // Gọi hành động gửi email
      await transporter.sendMail(options);
    }
  }
  
  return;
};