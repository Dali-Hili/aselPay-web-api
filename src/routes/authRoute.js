const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { auth } = require('../middleware/authorization');
const { grantAccess } = require('../middleware/access');
const { validRegister, validLogin } = require("../validation/userValidation");
const { validRetailer } = require("../validation/retailerValidation");

//@route: GET auth/
//desc: test the route
router.get('/', auth, authController.getCurrentUser);

//@route: POST auth/login
//desc: login 
router.post('/login', validLogin, authController.login)

//@route: POST auth/register/retailer
//desc: register a retailer
router.post('/register/retailer', auth, grantAccess(['admin']), validRegister, validRetailer, authController.registerRetailer);

//@route: POST auth/register/wholesaler
//desc: register a wholesaler
router.post('/register/wholesaler', auth, grantAccess(['admin']), validRegister, authController.registerWholesaler);

//@route: POST auth/register/wholesaler
//desc: register a wholesaler
router.post('/register/subWholesaler', auth, grantAccess(['admin']), validRegister, authController.registerSubWholesaler);

//@route: POST auth/register/admin
//desc: register an admin
router.post('/register/admin', auth, grantAccess(['admin']), validRegister, authController.registerAdmin);

router.post('/register/SuperAdmin', auth, grantAccess(['admin']), validRegister, authController.registerSuperAdmin);


module.exports = router;