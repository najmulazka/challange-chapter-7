const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('../utils/nodemailer.utils');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  getPasswordForgot: async (req, res) => {
    let path = `${req.protocol}://${req.get('host')}`;
    let message = req.flash('message');
    let err = req.flash('err');
    res.render('password-forgot', { path, message: message[0], err: err[0] });
  },

  passwordForgot: async (req, res) => {
    let { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      req.flash('err', 'User does not exit !');
      return res.status(400).redirect('/api/v1/password/password-forgot');
    }

    let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
    let path = `${req.protocol}://${req.get('host')}`;
    let url = `${path}/api/v1/password/reset?token=${token}`;
    const html = await nodemailer.getHtml('reset-password.ejs', { name: user.name, url });
    nodemailer.sendEmail(user.email, 'Reset Password', html);

    req.flash('message', 'Check your email to reset password');
    return res.status(200).redirect('/api/v1/password/password-forgot');
  },

  getReset: async (req, res) => {
    let { token } = req.query;
    jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: err.message,
          data: null,
        });
      }

      let user = await prisma.user.findUnique({
        where: { email: decoded.email },
      });

      res.render('password-reset', { token, user });
    });
  },

  reset: async (req, res, next) => {
    let { token } = req.query;
    let { new_password, new_password_confirmation } = req.body;
    jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: err.message,
          data: null,
        });
      }

      const user = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (new_password != new_password_confirmation) {
        return res.status(400).json({
          status: false,
          message: 'Bad Riquest',
          err: 'new password and new password confirmation not same',
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(new_password, 10);
      const updated = await prisma.user.update({
        where: { email: decoded.email },
        data: { password: encryptedPassword },
      });

      const html = await nodemailer.getHtml('reset-password-success.ejs', { name: updated.name });
      nodemailer.sendEmail(updated.email, 'Reset Password Success', html);

      const notification = await prisma.notification.create({
        data: {
          title: 'Reset Password Success',
          body: `Hello ${updated.name}, The process of resetting your account password has been successfully carried out🎉`,
          userId: updated.id,
        },
      });

      // kirim notifikasi baru
      req.io.emit(`user-${notification.userId}`, notification);

      res.redirect(`/api/v1/auth/login`);

      // res.status(200).json({
      //   status: true,
      //   message: 'OK!',
      //   err: 'Update password succes!',
      //   data: updated,
      // });
    });
  },
};
