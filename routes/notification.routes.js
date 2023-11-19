const router = require('express').Router();
const { notifications, notificatioRead, createNotification } = require('../controllers/notification.controllers');

router.get('/', notifications);
router.get('/:id/mark-is-read', notificatioRead);
router.post('/', createNotification);

module.exports = router;
