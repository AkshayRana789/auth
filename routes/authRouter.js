const express = require('express');
const services = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');

const router = express.Router();

router.post('/signup', services.signup)
router.post('/signin', services.signin)
router.post('/signout', identifier, services.signout)

router.patch('/sendVerificationCode', identifier, services.sendVerificationCode);
router.patch('/verifyVerificationCode', identifier, services.verifyVerificationCode);
router.patch('/changePasswrod', identifier, services.changePassword);
router.patch('/sendForgotPasswordCode', services.sendForgotPasswordCode);
router.patch('/verifyForgotPasswordCode', services.verifyForgotPasswordCode);

module.exports = router;