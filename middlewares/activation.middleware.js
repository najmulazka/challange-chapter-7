const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  activation: (req, res, next) => {
    try {
      let { token } = req.query;

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: false,
            message: 'Bad Request',
            err: err.message,
            data: null,
          });
        }

        req.user = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (!req.user.isVerified) {
          req.flash('err', 'Your email is not activated, Please check your email for activation');
          return res.status(401).redirect('/api/v1/auth/login');
        }
        next();
      });
    } catch (err) {
      next(err);
    }
  },
};
