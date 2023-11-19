const router = require('express').Router();
const { getHome } = require('../controllers/home.controllers');
const { activation } = require('../middlewares/activation.middleware');

router.get('/', activation, getHome);

module.exports = router;
