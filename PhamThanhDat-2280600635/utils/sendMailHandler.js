const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT || '587', 10),
  auth: {
    user: process.env.MAILTRAP_USER || 'MAILTRAP_USER',
    pass: process.env.MAILTRAP_PASS || 'MAILTRAP_PASS',
  },
});

async function sendPasswordEmail({ to, username, password }) {
  if (!to || !username || !password) {
    throw new Error('Missing mail information');
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@example.com',
    to,
    subject: 'Welcome - Your account credentials',
    html: `
      <p>Xin chào <strong>${username}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo thành công.</p>
      <ul>
        <li>Username: <strong>${username}</strong></li>
        <li>Password: <strong>${password}</strong></li>
        <li>Role: <strong>user</strong></li>
      </ul>
      <p>Vui lòng đăng nhập và thay đổi mật khẩu ngay khi nhận được email này.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = {
  sendPasswordEmail,
};
