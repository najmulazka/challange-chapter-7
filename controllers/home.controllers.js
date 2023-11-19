const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  getHome: async (req, res) => {
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
      let user = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: 'Bad Request',
          err: 'Post with email does not exist',
          data: null,
        });
      }

      let path = `${req.protocol}://${req.get('host')}`;
      res.render('home', { token, user, path });
    });
  },
};
