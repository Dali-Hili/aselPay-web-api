const express = require("express");
const router = express.Router();

const topupLightController = require("../controllers/topupLightController");
const { auth } = require("../middleware/authorization");
const { grantAccess } = require("../middleware/access");
const { validTopupLight } = require("../validation/topupValidation");

//@route: POST topup/light/reload
//desc: reloads given MSISDN
router.post(
  "/reload",
  auth,
  grantAccess(["retailer"]),
  validTopupLight,
  topupLightController.reload
);
router.post(
  "/reloadV2",
  auth,
  grantAccess(["retailer"]),
  topupLightController.reloadV2
);

// =========== ADMIN ===========

router.post(
  "/reloadAmount/currentDay",
  topupLightController.getCurrentDayTopUpLightAmount
);

router.post(
  "/reloadAmount/currentMonth",
  topupLightController.getCurrentMonthTopUpLightAmount
);

// =========== RETAILER ===========
router.post(
  "/reloadAmount/currentDay/retailer",
  topupLightController.getCurrentDayTopUpLightAmountRetailer
);

router.post(
  "/reloadAmount/currentMonth/retailer",
  topupLightController.getCurrentMonthTopUpLightAmountRetailer
);

router.post(
  "/history/retailer",
  topupLightController.getLightHistoryRetailer
);
module.exports = router;
