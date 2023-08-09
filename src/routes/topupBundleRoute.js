const express = require("express");
const router = express.Router();

const topupBundleController = require("../controllers/topupBundleController");
const { auth } = require("../middleware/authorization");
const { grantAccess } = require("../middleware/access");
const { validTopupBundle } = require("../validation/topupValidation");

//@route: POST topup/bundle/add
//desc: assigns bundle to a given MSISDN
router.post(
  "/assign",
  auth,
  grantAccess(["retailer"]),
  validTopupBundle,
  topupBundleController.assignBundle
);

// =========== ADMIN ===========

router.post(
  "/reloadAmount/currentDay",
  topupBundleController.getCurrentDayTopUpBundleAmount
);

router.post(
  "/reloadAmount/currentMonth",
  topupBundleController.getCurrentMonthTopUpBundleAmount
);

// =========== RETAILER ===========

router.post(
  "/reloadAmount/currentDay/retailer",
  topupBundleController.getCurrentDayTopUpBundleAmountRetailer
);

router.post(
  "/reloadAmount/currentMonth/retailer",
  topupBundleController.getCurrentMonthTopUpBundleAmountRetailer
);

router.post(
  "/history/retailer",
  topupBundleController.getBundleHistoryRetailer
);

module.exports = router;
