const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/authorization');
const { grantAccess, switchRoutebyRole } = require('../middleware/access');
const { validPayment } = require('../validation/paymentValidation');

//@route: POST payment/add
//desc: add a payment from wholesaler to retailer
router.post('/add', auth, grantAccess(['wholesaler','admin','SuperAdmin','sub-wholesaler']), switchRoutebyRole('admin'), validPayment, paymentController.addPaymentLevel1);

//@route: POST payment/add
//desc: add a payment from retailer to wholesaler
router.post('/add', validPayment, paymentController.addPaymentLevel2);

//@route: POST payment/add
//desc: add a payment from  wholesaler to superadmin
router.post('/wholesaler/superadmin' , auth, validPayment, paymentController.addPaymentLevel3);

//@route: GET payment/history
//desc: get all payments (user is an admin)
router.get('/history', auth, grantAccess(['admin','wholesaler']), switchRoutebyRole('admin'), paymentController.getAllPayments);

//@route: GET payment/history
//desc: get all payments of the current user (wholesaler)
router.get('/history', paymentController.getPaymentsWholesaler);

//@route: GET payment/history
//desc: get all payments of the current user (wholesaler)
router.get('/history/superadmin', auth ,paymentController.getPaymentsSuperAdmin);

//@route: GET payment/history
//desc: get all payments of the current user (sub-wholesaler)
router.get('/history/subwholesaler', auth ,paymentController.getPaymentsSubWholesaler);

module.exports = router;