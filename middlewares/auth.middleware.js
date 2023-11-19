const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  restrict: (req, res, next) => {
    try {
      let { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({
          status: false,
          message: 'Unauthorized',
          err: 'Missing token on header!',
          data: null,
        });
      }

      let token = authorization.split(' ')[1];

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: false,
            message: 'Unauthorized',
            err: err.message,
            data: null,
          });
        }

        req.user = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (!req.user.isVerified) {
          return res.status(401).json({
            status: false,
            message: 'Unauthorized',
            err: 'Your email is not activated',
            data: null,
          });
        }
        next();
      });
    } catch (err) {
      next(err);
    }
  },
};
