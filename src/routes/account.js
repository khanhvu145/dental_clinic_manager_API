const express = require('express');
const accountController = require('../controllers/AccountController');
const verifyToken = require('../middlewares/verifyToken');
const router = express.Router();

router.get('/listRole', accountController.listRole);
router.get('/info', verifyToken, accountController.info);
router.post('/login', accountController.login);

module.exports = router;