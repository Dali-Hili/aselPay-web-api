const express = require('express');
const router = express.Router();

const mvnoController = require('../controllers/mvnoController');
const { auth } = require('../middleware/authorization');
const { grantAccess } = require('../middleware/access');

//@route: GET mvno/all
//desc: returns all the mvnos
router.get('/all', auth, grantAccess(['retailer','wholesaler','admin']), mvnoController.getAllMVNOs);

//@route: GET mvno/available
//desc: returns the available mvnos
router.get('/available', auth, grantAccess(['retailer','wholesaler','admin']), mvnoController.getAvailableMVNOs);



module.exports = router;