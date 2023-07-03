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
router.post(
  "/reloadAmount/currentDay",
  topupBundleController.getCurrentDayTopUpBundleAmount
);

module.exports = router;
