const express = require('express');
const router = express.Router();

const superAdminController = require('../controllers/superAdminController.js');
const transactionController = require('../controllers/transactionController.js')
const { auth } = require('../middleware/authorization');
const { grantAccess } = require('../middleware/access');


//@route: GET SuperAdmin/all
//desc: returns all the SuperAdmins
router.get('/all',auth, grantAccess(['admin','SuperAdmin']), superAdminController.getAllSuperAdmins);

//@route: GET wholesaler/:id
//desc: returns the wholesaler
router.get('/:id', auth, grantAccess(['admin','SuperAdmin']), superAdminController.getSuperAdmin);

//@route: GET superadmin/current
//desc: returns the details of the current user (superadmin)
router.get('/current', auth, grantAccess(['SuperAdmin']), superAdminController.getCurrentSuperAdmin);

//@route: GET superadmin/wholesalers
//desc: returns the wholesalers of a given superadmin
router.get('/wholesalers/all', auth, grantAccess(['SuperAdmin']), superAdminController.getWholesalersBySuperAdmin);

module.exports = router;