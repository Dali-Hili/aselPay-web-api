const express = require('express');
const router = express.Router();

const retailerController = require('../controllers/retailerController');
const { auth } = require('../middleware/authorization');
const { grantAccess, switchRoutebyRole } = require('../middleware/access');


//@route: GET retailer/current
//desc: returns the details of the current user (retailer)
router.get('/current', auth, grantAccess(['retailer']), retailerController.getCurrentRetailer);

//@route: GET retailer/:id
//desc: returns the retailer by id
router.get('/:id', auth, grantAccess(['admin']), retailerController.getRetailer);

//@route: GET retailer/all
//desc: returns all the retailers
router.get('/all', auth, grantAccess(['admin']), retailerController.getAllRetailers);

//@route: GET retailer/all/current
//desc: returns all the retailers available to the current user (admin) grouped by wholesalers 
router.get('/all/current', auth, grantAccess(['admin','wholesaler','sub-wholesaler']), switchRoutebyRole('admin'), retailerController.getAllRetailersByWholesaler);

//@route: GET retailer/all/current
//desc: returns all the retailers available to the current user (wholesaler)
router.get('/all/current',auth, grantAccess(['wholesaler','sub-wholesaler']), switchRoutebyRole('wholesaler'),retailerController.getRetailersbyWholesaler);

//@route: GET retailer/all/current
//desc: returns all the retailers available to the current user (wholesaler)
router.get('/all/current',auth, retailerController.getRetailersbySubWholesaler);
router.post('/getRetailerMVNO',auth, retailerController.getRetailerMVNO);


module.exports = router;