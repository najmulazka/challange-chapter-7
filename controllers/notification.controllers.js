const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  notifications: async (req, res) => {
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

      let notification;
      if (user.id) {
        notification = await prisma.notification.findMany({ where: { userId: Number(user.id) } });
      }

      let path = `${req.protocol}://${req.get('host')}`;
      res.render('notification', { notification, userId: user.id, path, token });
    });

    // let { userId } = req.params;
    // let notification;
    // if (userId) {
    //   notification = await prisma.notification.findMany({ where: { userId: Number(userId) } });
    // }
    // res.render('notification', { notification, userId });
  },

  createNotification: async (req, res) => {
    let { title, body, userId } = req.body;
    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        userId,
      },
    });

    // kirim notifikasi baru
    req.io.emit(`user-${notification.userId}`, notification);
    console.log(`Server user-${notification.userId}`);

    res.json({ status: true, data: notification });
  },

  notificatioRead: async (req, res) => {
    let { token } = req.query;
    let notificationId = req.params.id;

    let notification = await prisma.notification.findUnique({ where: { id: Number(notificationId) } });
    if (notification) {
      await prisma.notification.update({
        where: { id: Number(notificationId) },
        data: { isRead: true },
      });
      res.redirect(`/api/v1/notifications?token=${token}`);
    } else {
      res.status(404).json({
        status: false,
        message: `Notification ${notificationId} not found`,
      });
    }
  },
  // server,
};
