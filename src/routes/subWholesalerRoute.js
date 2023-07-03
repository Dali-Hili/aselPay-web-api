const express = require('express');
const router = express.Router();

const subWholesalerController = require('../controllers/subWholesalerController');
const { auth } = require('../middleware/authorization');
const { grantAccess, switchRoutebyRole } = require('../middleware/access');


//@route: GET subWholesaler/current
//desc: returns the details of the current user (subWholesaler)
router.get('/current', auth, grantAccess(['sub-wholesaler']), subWholesalerController.getCurrentsubWholesaler);

//@route: GET subWholesaler/:id
//desc: returns the subWholesaler by id
router.get('/:id', auth, grantAccess(['admin']), subWholesalerController.getSubWholesaler);

//@route: GET subWholesaler/all
//desc: returns all the subWholesalers
router.get('/all/subWholesaler', auth, grantAccess(['admin']), subWholesalerController.getAllSubWholesaler);

//@route: GET subWholesaler/all/current
//desc: returns all the subWholesalers available to the current user (admin) grouped by wholesalers 
router.get('/all/current', auth, grantAccess(['admin','wholesaler']), switchRoutebyRole('admin'), subWholesalerController.getAllSubWholesalerByWholesalers);

//@route: GET subWholesaler/all/current
//desc: returns all the subWholesalers available to the current user (subWholesaler)
router.get('/all/current', subWholesalerController.getSubWholesalersbyWholesaler);

//@route: GET subWholesaler/all/retailers
//desc: returns all the retailers available to the current user (subWholesaler)
router.get('/all/retailers', auth,subWholesalerController.getRetailersBySubWholesaler);


module.exports = router;