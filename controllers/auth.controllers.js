const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('../utils/nodemailer.utils');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  getRegister: async (req, res) => {
    let path = `${req.protocol}://${req.get('host')}`;

    let message = req.flash('message');
    let err = req.flash('err');
    res.render('register', { path, message: message[0], err: err[0] });
  },

  register: async (req, res, next) => {
    try {
      let { name, email, password, passwordConfirmation } = req.body;

      if (password != passwordConfirmation) {
        req.flash('err', 'password and password confirmation not same !!');
        return res.status(400).redirect(`/api/v1/auth/register`);
      }

      let userExist = await prisma.User.findUnique({ where: { email } });
      if (userExist) {
        req.flash('err', 'User has already been used !!');
        return res.status(400).redirect(`/api/v1/auth/register`);
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
        },
      });

      let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
      let path = `${req.protocol}://${req.get('host')}`;
      let url = `${path}/api/v1/auth/email-activation?token=${token}`;

      // Mailer
      const html = await nodemailer.getHtml('activation-email.ejs', { name, url });
      nodemailer.sendEmail(email, 'Email Activation', html);

      req.flash('message', 'User successfully created, Check your email to activated');
      res.redirect(`/api/v1/auth/register`);
    } catch (err) {
      next(err);
    }
  },

  getLogin: (req, res) => {
    let path = `${req.protocol}://${req.get('host')}`;
    let err = req.flash('err');
    res.render('login', { path, err: err[0] });
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      let user = await prisma.User.findUnique({ where: { email } });
      if (!user) {
        req.flash('err', 'invalid email or password !');
        return res.status(400).redirect('/api/v1/auth/login');
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        req.flash('err', 'invalid email or password !');
        return res.status(400).redirect('/api/v1/auth/login');
      }

      let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);

      res.redirect(`/api/v1/home?token=${token}`);
    } catch (err) {
      next(err);
    }
  },

  getActivate: (req, res) => {
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

      // let { token } = req.query;
      res.render('email-activation', { token, user });
    });
  },

  activate: (req, res) => {
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

      let updated = await prisma.user.update({
        where: { email: decoded.email },
        data: { isVerified: true },
      });

      const html = await nodemailer.getHtml('welcome.ejs', { name: updated.name });
      nodemailer.sendEmail(updated.email, 'Register Success', html);

      const notification = await prisma.notification.create({
        data: {
          title: 'Register Success',
          body: `Hello ${updated.name}, Congratulations on our application, your account registration process has been successfully created🎉`,
          userId: updated.id,
        },
      });

      // kirim notifikasi baru
      req.io.emit(`user-${notification.userId}`, notification);
      console.log(`Server user-${notification.userId}`);

      let path = `${req.protocol}://${req.get('host')}`;
      res.redirect(`${path}/api/v1/home?token=${token}`);
    });
  },

  whoami: (req, res, next) => {
    res.status(200).json({
      status: true,
      message: 'OK',
      err: null,
      data: { user: req.user },
    });
  },
};
