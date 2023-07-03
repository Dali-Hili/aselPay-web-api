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
router.post(
  "/reloadAmount/currentDay",
  topupLightController.getCurrentDayTopUpLightAmount
);

module.exports = router;
