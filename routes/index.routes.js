const router = require('express').Router();
const auth = require('./auth.routes');
const password = require('./password.routes');
const notifications = require('./notification.routes');
const home = require('./home.routes');
const { getIndex } = require('../controllers/index.controllers');

router.get('/', getIndex);
router.use('/auth', auth);
router.use('/home', home);
router.use('/password', password);
router.use('/notifications', notifications);

module.exports = router;
