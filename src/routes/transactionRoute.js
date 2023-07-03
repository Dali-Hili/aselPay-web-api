const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/authorization');
const { grantAccess, switchRoutebyRole} = require('../middleware/access');
const { validTransaction } = require('../validation/transactionValidation');

//@route: POST transaction/add
//desc: creates new transaction between admin and wholesaler
router.post('/add', auth, grantAccess(['admin','wholesaler']), switchRoutebyRole('admin'), validTransaction, transactionController.addTransactionLevel1);

//@route: POST transaction/add
//desc: creates new transaction between wholesaler and retailer
router.post('/add',  transactionController.addTransactionLevel2);

//@route: POST transaction/add
//desc: creates new transaction between super admin and wholesaler
router.post('/superAdd', auth, grantAccess(['SuperAdmin']), transactionController.addTransactionLevel3);

//@route: POST transaction/add
//desc: creates new transaction between sub-wholesaler and retailer
router.post('/subWholesaler', auth, grantAccess(['sub-wholesaler']), transactionController.addTransactionLevel4);

//@route: POST transaction/history

//desc: gets all transactions
router.get('/history',  transactionController.getAllTransactions);

//@route: POST transaction/history
//desc: gets all transactions of given wholesaler
router.get('/history', auth, transactionController.getTransactionsbyWholesaler);

//@route: POST transaction/history
//desc: gets all transactions
router.get('/superAdmin/history', auth, grantAccess(['SuperAdmin']), transactionController.getTransactionsbySuperAdmin);

//@route: POST transaction/history
//desc: gets all transactions of subwholesaler
router.get('/subWholesaler/history', auth, grantAccess(['sub-wholesaler']), transactionController.getTransactionsbySubWholesaler);


// ============== ADMIN ==============
router.post('/admin',  transactionController.getAdminTransactions);
 

module.exports = router;