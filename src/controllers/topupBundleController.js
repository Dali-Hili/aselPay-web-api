var axios = require("axios");
const https = require("https");
const { validationResult } = require("express-validator");

const MVNO = require("../models/MVNO");
const Bundle = require("../models/Bundle");
const Retailer = require("../models/Retailer");
const TopupBundle = require("../models/TopupBundle");

axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

exports.assignBundle = async (req, res) => {
  //in case of errors in the request body, return error messages
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //destructure request body
    let { MSISDN, retailer_id, bundle_id, mvno_id } = req.body;
    var SN = "";
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
    //check bundle exists
    let bundle = await Bundle.findById(bundle_id);
    if (!bundle) {
      res.status(400).json({ msg: "Ce forfait n'existe pas" });
      return;
    }
    //check bundle is valid
    if (new Date() > new Date(bundle.validityEndDate)) {
      res.status(400).json({ msg: "Ce forfait n'est plus valide" });
      return;
    }
    //check mvno allows this bundle
    if (!mvno.bundles.includes(bundle._id)) {
      res.status(400).json({ msg: "Ce forfait n'existe pas pour ce MVNO" });
      return;
    }

    //set the bundle validity start and end dates
    let validFrom = new Date();
    validFrom.setHours(1, 0, 0, 0);
    let validUntil = new Date();
    if (bundle.validity.unit == "Days") {
      validUntil.setDate(validFrom.getDate() + bundle.validity.number);
      validUntil.setHours(1, 0, 0, 0);
    }
    if (bundle.validity.unit == "Months") {
      validUntil.setMonth(validFrom.getMonth() + bundle.validity.number);
      validUntil.setHours(1, 0, 0, 0);
    }

    //get SN from MSISDN
    var data = JSON.stringify({
      Login: mvno.api_login,
      Password: mvno.api_password,
      MSISDN: MSISDN,
    });

    var config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/serviceCLI/getSpecificCLIInfo",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    // request GetSpecificCLIInfo to ARTA
    var response;
    try {
      response = await axios(config);
      if (response.data.GetSpecificCLIInfoResult.Result != 0) {
        res.status(500).json({ msg: "La recherche du MSISDN a échoué!" });
        return;
      }
      //if response code == 0 , get SN
      SN =
        response.data.GetSpecificCLIInfoResult.ListInfo.diffgram.NewDataSet
          .SpecificCLIInfo.SN;
      console.log("SN:", SN);
    } catch (error) {
      console.log("GetSpecificCLIInfo failed");
      console.error(error.message);
      res.status(500).json({ msg: "L'affectation du forfait a échoué!" });
      return;
    }

    // request AddBundleAssignV2 to ARTA
    data = JSON.stringify({
      BundleId: `${bundle.bundleId}`,
      ContactTypeId: "-1",
      AvailableSubcustomer: "false",
      SharedUsage: "false",
      SN: `${SN}`,
      PackageId: "-1",
      ValidFrom: validFrom,
      ValidUntil: validUntil,
      Login: `${mvno.api_login}`,
      Password: `${mvno.api_password}`,
    });

    var config = {
      method: "post",
      url: "https://posbe.cayoncloud.com/ServiceBundle/AddBundleAssignV2",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    var newItemId = -1;
    try {
      response = await axios(config);
      result = response.data.AddBundleAssignV2Result;
      //return if response != 0
      if (result.Result != 0) {
        res.status(500).json({ msg: "L'affectation du forfait a échoué!" });
        return;
      }
      //if response code == 0 , get the new item ID
      newItemId = result.NewItemId;
    } catch (error) {
      console.error(error.message);
      console.log("AddBundleAssignV2 failed");
      res.status(500).json({ msg: "L'affectation du forfait a échoué!" });
      return;
    }

    //create new topup object
    let topupBundle = new TopupBundle({
      bundle: bundle._id,
      MSISDN: MSISDN,
      SN: SN,
      MVNO: mvno._id,
      topupId: newItemId,
      retailer: retailer._id,
    });
    //save the topup to DB
    await topupBundle.save();

    //deduct the bundle price from the retailer's balance (take reduction percentage into consideration)
    retailer.balance.amount -=
      bundle.price.amount -
      (bundle.price.amount * retailer.reductionPercentage) / 100;
    //save the updated retailer to DB
    await retailer.save();

    //alert the customer of the reload via SMS
    data = JSON.stringify({
      SentMessage: `Merci d'avoir activé le forfait ${
        bundle.name
      }. Il sera valide jusqu'à ${validUntil.toLocaleDateString(
        "fr-FR"
      )}. Suivi de votre consommation : *146*2#`,
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
      msg: `L'achat du forfait ${bundle.name} a été effectué!`,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.getCurrentDayTopUpBundleAmount = async (req, res) => {
  // Format the date
  const currentDate = new Date().toISOString().split("T")[0];

  try {
    // Query the bundles for the current date and populate the 'bundle' field to include the 'price' object
    const topUpBundles = await TopupBundle.find({
      createdAt: {
        $gte: new Date(`${currentDate}T00:00:00.000Z`),
        $lte: new Date(`${currentDate}T23:59:59.999Z`),
      },
    }).populate("bundle", "price");
    console.log(topUpBundles);

    // Calculate the reload amount and count the number of reloads
    const { reloadAmount, reloadCount } = topUpBundles.reduce(
      (accumulated, bundle) => {
        const amount = bundle.bundle.price.amount;
        return {
          reloadAmount: accumulated.reloadAmount + amount,
          reloadCount: accumulated.reloadCount + 1,
        };
      },
      { reloadAmount: 0, reloadCount: 0 }
    );

    console.log("Reload Amount:", reloadAmount);
    console.log("Reload Count:", reloadCount);

    res.status(200).json({
      totalReloadsAmount: reloadAmount,
      totalReloadsNumber: reloadCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
