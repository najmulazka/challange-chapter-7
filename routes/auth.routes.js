const router = require('express').Router();
const { register, login, activate, whoami, getActivate, getLogin, getRegister } = require('../controllers/auth.controllers');
const { restrict } = require('../middlewares/auth.middleware');

router.get('/register', getRegister);
router.post('/register', register);
router.get('/login', getLogin);
router.post('/login', login);
router.get('/whoami', restrict, whoami);

router.get('/email-activation', getActivate);
router.post('/email-activation', activate);

module.exports = router;
