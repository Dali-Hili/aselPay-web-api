const express = require('express');
const router = express.Router();

const topupController = require('../controllers/topupController');
const { auth } = require('../middleware/authorization');
const { grantAccess, switchRoutebyRole } = require('../middleware/access');


//@route: GET topup/history
//desc: returns topup history (admin)
router.get('/history', auth, grantAccess(['admin','wholesaler','retailer','SuperAdmin']), switchRoutebyRole('admin'), topupController.getAllTopups);

//@route: GET topup/history
//desc: returns topup history (wholesaler)
router.get('/history', switchRoutebyRole('wholesaler'), topupController.getTopupsWholesaler);


//@route: GET topup/history
//desc: returns daily topup history (wholesaler)
router.post('/history/daily', topupController.getDailyTopupsWholesaler);

//@route: GET topup/history
//desc: returns topup history (wholesaler)
router.get('/history/subWholesaler',auth, topupController.getTopupsSubWholesaler);

//@route: GET topup/history
//desc: returns topup history (retailer)
router.get('/history', topupController.getTopupsRetailer);


//@route: GET topup/superadmin
//desc: returns topup history (retailer)
router.get('/history/superadmin', topupController.getTopupsSuperAdmin);

module.exports = router;