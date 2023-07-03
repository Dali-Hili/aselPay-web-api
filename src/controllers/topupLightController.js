var axios = require("axios");
const https = require("https");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const MVNO = require("../models/MVNO");
const Bundle = require("../models/Bundle");
const Retailer = require("../models/Retailer");
const TopupLight = require("../models/TopupLight");
const SIM = require("../models/SIM");
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

exports.reload = async (req, res) => {
  //in case of errors in the request body, return error messages
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //destructure request body
    let { MSISDN, retailer_id, reloadAmount, mvno_id } = req.body;

    //check mvno exists
    let mvno = await MVNO.findById(mvno_id);
    if (!mvno) {
      res.status(400).json({ msg: "Ce MVNO n'existe pas" });
      return;
    }
    //check mvno allows topups
    if (!mvno.allowTopups) {
      res.status(400).json({ msg: "Ce MVNO n'accepte pas les recharges" });
      return;
    }
    //check retailer exists
    let retailer = await Retailer.findById(retailer_id);
    if (!retailer) {
      res.status(400).json({ msg: "Ce point de vente n'existe pas" });
      return;
    }

    //reload api call
    var data = JSON.stringify({
      Msisdn: MSISDN,
      ReloadAmount: reloadAmount.amount,
      ReloadType: 311,
      ReloadSubType: 3,
      Login: mvno.api_login,
      Password: mvno.api_password,
    });

    var config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/ServiceReload/ReloadWithOutPinVoucher",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    try {
      var response = await axios(config);
      console.log(JSON.stringify(response.data));
      const result = response.data.ReloadResult;
      //return if response != 0
      if (result.Result != 0) {
        console.log("reload api call failed");
        res.status(500).json({ msg: "La recharge a échoué!" });
        return;
      }
    } catch (error) {
      console.error(error.message);
      console.log("Reload failed");
      res.status(500).json({ msg: "La recharge a échoué!" });
      return;
    }

    //create new topup object
    let topupLight = new TopupLight({
      retailer: retailer._id,
      MSISDN: MSISDN,
      reloadAmount: reloadAmount,
      MVNO: mvno._id,
    });
    //save topup to DB
    await topupLight.save();

    //deduct the reload amount from the retailer's balance (take reduction percentage into consideration)
    retailer.balance.amount -=
      reloadAmount.amount -
      (reloadAmount.amount * retailer.reductionPercentage) / 100;
    //save the updated retailer to DB
    await retailer.save();

    //alert the customer of the reload via SMS
    data = JSON.stringify({
      SentMessage: `Votre opération de recharge de ${reloadAmount.amount} ${process.env.SHORT_CURRENCY} a été effectuée avec succès. Pour consulter votre solde tapez *146#`,
      SentMSISDN: `${MSISDN}`,
      SentTon: "1",
      SentNpi: "0",
      Login: `${mvno.api_login}`,
      Password: `${mvno.api_password}`,
    });

    config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/serviceSMS/AddSMSSent",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    try {
      const response = await axios(config);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }

    res.send({
      msg: `Une recharge de ${reloadAmount.amount} ${reloadAmount.unit} a été effectuée à ${MSISDN} `,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

// used to make topups using our API in other apps (example: khallesli)
exports.reloadV2 = async (req, res) => {
  //in case of errors in the request body, return error messages
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //destructure request body
    let { MSISDN, retailer_id, reloadAmount } = req.body;

    //check mvno exists
    console.log(MSISDN);
    let sim = await SIM.find({ MSISDN: MSISDN });
    if (!sim) {
      res.status(400).json({ msg: "Cette SIM n'existe pas" });
      return;
    }
    const mvnoID = sim[0].mvno;
    let mvno = await MVNO.findById({ _id: mvnoID });
    if (!mvno) {
      res.status(400).json({ msg: "Ce MVNO n'existe pas" });
      return;
    }
    // //check mvno allows topups
    if (!mvno.allowTopups) {
      res.status(400).json({ msg: "Ce MVNO n'accepte pas les recharges" });
      return;
    }
    // //check retailer exists
    let retailer = await Retailer.findById({ _id: retailer_id });
    if (!retailer) {
      res.status(400).json({ msg: "Ce point de vente n'existe pas" });
      return;
    }
    console.log(mvno.api_login, "tyuik", mvno.api_password);
    // //reload api call
    var data = JSON.stringify({
      Msisdn: MSISDN,
      ReloadAmount: reloadAmount.amount,
      ReloadType: 311,
      ReloadSubType: 3,
      Login: mvno.api_login,
      Password: mvno.api_password,
    });

    var config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/ServiceReload/ReloadWithOutPinVoucher",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    try {
      var response = await axios(config);
      console.log(JSON.stringify(response.data));
      const result = response.data.ReloadResult;
      console.log(response, "resss");
      //return if response != 0
      if (result.Result != 0) {
        console.log("reload api call failed");
        res.status(500).json({ msg: "La recharge a échoué!" });
        return;
      }
    } catch (error) {
      console.error(error.message);
      console.log("Reload failed");
      res.status(500).json({ msg: "La recharge a échoué!" });
      return;
    }

    //create new topup object
    let topupLight = new TopupLight({
      retailer: retailer._id,
      MSISDN: MSISDN,
      reloadAmount: reloadAmount,
      MVNO: mvno._id,
    });
    //save topup to DB
    await topupLight.save();

    //deduct the reload amount from the retailer's balance (take reduction percentage into consideration)
    retailer.balance.amount -=
      reloadAmount.amount -
      (reloadAmount.amount * retailer.reductionPercentage) / 100;
    //save the updated retailer to DB
    await retailer.save();

    //alert the customer of the reload via SMS
    data = JSON.stringify({
      SentMessage: `Votre opération de recharge de ${reloadAmount.amount} DT a été effectuée avec succès. Pour consulter votre solde tapez *146#`,
      SentMSISDN: `${MSISDN}`,
      SentTon: "1",
      SentNpi: "0",
      Login: `${mvno.api_login}`,
      Password: `${mvno.api_password}`,
    });

    config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/serviceSMS/AddSMSSent",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    try {
      const response = await axios(config);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }

    res.send({
      msg: `Une recharge de ${reloadAmount.amount} DT a été effectuée à ${MSISDN} `,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

// =========== ADMIN ===========

exports.getCurrentDayTopUpLightAmount = async (req, res) => {
  const currentDate = new Date().toISOString().split("T")[0];
  try {
    const topupLight = await TopupLight.find({
      createdAt: {
        $gte: new Date(`${currentDate}T00:00:00.000Z`),
        $lte: new Date(`${currentDate}T23:59:59.999Z`),
      },
    });

    const { reloadAmount, reloadCount } = topupLight.reduce(
      (accumulated, reload) => {
        const amount = reload.reloadAmount.amount;
        return {
          reloadAmount: accumulated.reloadAmount + amount,
          reloadCount: accumulated.reloadCount + 1,
        };
      },
      { reloadAmount: 0, reloadCount: 0 }
    );

    res.status(200).json({
      totalReloadsAmount: reloadAmount,
      totalReloadsNumber: reloadCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCurrentMonthTopUpLightAmount = async (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  try {
    const topupLight = await TopupLight.find({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const { reloadAmount, reloadCount } = topupLight.reduce(
      (accumulated, reload) => {
        const amount = reload.reloadAmount.amount;
        return {
          reloadAmount: accumulated.reloadAmount + amount,
          reloadCount: accumulated.reloadCount + 1,
        };
      },
      { reloadAmount: 0, reloadCount: 0 }
    );

    res.status(200).json({
      totalReloadsAmount: reloadAmount,
      totalReloadsNumber: reloadCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// =========== RETAILER ===========

exports.getCurrentDayTopUpLightAmountRetailer = async (req, res) => {
  const currentDate = new Date().toISOString().split("T")[0];
  try {
    const topupLight = await TopupLight.find({
      retailer: mongoose.Types.ObjectId(req.body.retailerId),
      createdAt: {
        $gte: new Date(`${currentDate}T00:00:00.000Z`),
        $lte: new Date(`${currentDate}T23:59:59.999Z`),
      },
    });

    const { reloadAmount, reloadCount } = topupLight.reduce(
      (accumulated, reload) => {
        const amount = reload.reloadAmount.amount;
        return {
          reloadAmount: accumulated.reloadAmount + amount,
          reloadCount: accumulated.reloadCount + 1,
        };
      },
      { reloadAmount: 0, reloadCount: 0 }
    );

    res.status(200).json({
      totalReloadsAmount: reloadAmount,
      totalReloadsNumber: reloadCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCurrentMonthTopUpLightAmountRetailer = async (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  try {
    const topupLight = await TopupLight.find({
      retailer: mongoose.Types.ObjectId(req.body.retailerId),
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const { reloadAmount, reloadCount } = topupLight.reduce(
      (accumulated, reload) => {
        const amount = reload.reloadAmount.amount;
        return {
          reloadAmount: accumulated.reloadAmount + amount,
          reloadCount: accumulated.reloadCount + 1,
        };
      },
      { reloadAmount: 0, reloadCount: 0 }
    );

    res.status(200).json({
      totalReloadsAmount: reloadAmount,
      totalReloadsNumber: reloadCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};