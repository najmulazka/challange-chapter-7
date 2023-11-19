const router = require('express').Router();
const { passwordForgot, getReset, reset, getPasswordForgot } = require('../controllers/password.controllers');

router.get('/password-forgot', getPasswordForgot);
router.post('/password-forgot', passwordForgot);
router.get('/reset', getReset);
router.post('/reset', reset);

module.exports = router;
