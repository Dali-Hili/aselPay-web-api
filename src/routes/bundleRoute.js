const express = require('express');
const router = express.Router();

const bundleController = require('../controllers/bundleController');
const { auth } = require('../middleware/authorization');
const { grantAccess } = require('../middleware/access');

//@route: GET bundle/:mvno_id
//desc: returns all the valid bundles of a given mvno
router.get('/:mvno_id', auth, grantAccess(['retailer','wholesaler','admin']), bundleController.getBundlesbyMVNO);



module.exports = router;