const express = require('express');
const router = express.Router();

const wholesalerController = require('../controllers/wholesalerController');
const { auth } = require('../middleware/authorization');
const { grantAccess } = require('../middleware/access');

//@route: GET wholesaler/current
//desc: returns the details of the current user (wholesaler)
router.get('/current', auth, grantAccess(['wholesaler']), wholesalerController.getCurrentWholesaler);

//@route: GET alpha wholesaler/all
//desc: returns all the alpha wholesalers
router.get('/alpha', auth, grantAccess(['admin','SuperAdmin']), wholesalerController.getAlphaWholesalers);

//@route: GET wholesaler/all
//desc: returns all the wholesalers
router.get('/all', auth, grantAccess(['admin','SuperAdmin']), wholesalerController.getAllWholesalers);

//@route: GET wholesaler/:id
//desc: returns the wholesaler
router.get('/:id', auth, grantAccess(['admin']), wholesalerController.getWholesaler);


//@route: GET all wholesaler children
//desc: returns all the retailers&subwholesalers available to the current user (Wholesaler)
router.get('/all/children', auth,wholesalerController.getWholesalerChildren);

module.exports = router;