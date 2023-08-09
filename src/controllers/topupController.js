const mongoose = require("mongoose");
const MVNO = require("../models/MVNO");
const Bundle = require("../models/Bundle");
const Retailer = require("../models/Retailer");
const TopupLight = require("../models/TopupLight");
const TopupBundle = require("../models/TopupBundle");
const Wholesaler = require("../models/Wholesaler");
const Transaction = require("../models/Transaction");
const subWholesaler = require("../models/subWholesaler");

exports.getAllTopups = async (req, res) => {
  try {
    let topupBundle = await TopupBundle.aggregate([
      {
        $lookup: {
          from: "retailers",
          localField: "retailer",
          foreignField: "_id",
          as: "retailer_details",
        },
      },
      {
        $unwind: {
          path: "$retailer_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "retailer_details.user",
          foreignField: "_id",
          as: "retailer_user_details",
        },
      },
      {
        $unwind: {
          path: "$retailer_user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "mvnos",
          localField: "MVNO",
          foreignField: "_id",
          as: "mvno_details",
        },
      },
      {
        $unwind: {
          path: "$mvno_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "bundles",
          localField: "bundle",
          foreignField: "_id",
          as: "bundle_details",
        },
      },
      {
        $unwind: {
          path: "$bundle_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          topupType: "Bundle",
          retailer: {
            _id: "$retailer_details._id",
            user: {
              _id: "$retailer_user_details._id",
              firstName: "$retailer_user_details.firstName",
              lastName: "$retailer_user_details.lastName",
            },
            wholesaler: "$retailer_details.wholesaler",
          },
          MSISDN: 1,
          bundle: {
            _id: "$bundle_details._id",
            name: "$bundle_details.name",
            price: "$bundle_details.price",
          },
          createdAt: 1,
          MVNO: {
            _id: "$mvno_details._id",
            name: "$mvno_details.name",
          },
        },
      },
    ])
      .sort({ createdAt: -1 })
      .limit(30);

    let topupLight = await TopupLight.aggregate([
      {
        $lookup: {
          from: "retailers",
          localField: "retailer",
          foreignField: "_id",
          as: "retailer_details",
        },
      },
      {
        $unwind: {
          path: "$retailer_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "retailer_details.user",
          foreignField: "_id",
          as: "retailer_user_details",
        },
      },
      {
        $unwind: {
          path: "$retailer_user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "mvnos",
          localField: "MVNO",
          foreignField: "_id",
          as: "mvno_details",
        },
      },
      {
        $unwind: {
          path: "$mvno_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          topupType: "Light",
          retailer: {
            _id: "$retailer_details._id",
            user: {
              _id: "$retailer_user_details._id",
              firstName: "$retailer_user_details.firstName",
              lastName: "$retailer_user_details.lastName",
            },
            wholesaler: "$retailer_details.wholesaler",
          },
          MSISDN: 1,
          reloadAmount: 1,
          createdAt: 1,
          MVNO: {
            _id: "$mvno_details._id",
            name: "$mvno_details.name",
          },
        },
      },
    ])
      .sort({ createdAt: -1 })
      .limit(30);

    //concat arrays and sort by date
    let topups = topupBundle.concat(topupLight);
    topups.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.send(topups);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.getTopupsWholesaler = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findOne({
      user: new mongoose.Types.ObjectId(req.user.id),
    });
    const retailers = await Retailer.find({ wholesaler: wholesaler._id });
    let retailerIds = retailers.map((retailer) => retailer._id);
    let topupBundle = await TopupBundle.find({ retailer: { $in: retailerIds } })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .populate("bundle")
      .select({
        _id: 1,
        topupType: "Bundle",
        MSISDN: 1,
        createdAt: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
        "bundle._id": 1,
        "bundle.name": 1,
        "bundle.price": 1,
      })
      .lean();
    topupBundle.forEach((item) => {
      item.topupType = "Bundle";
    });

    const topupLight = await TopupLight.find({ retailer: { $in: retailerIds } })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .select({
        _id: 1,
        MSISDN: 1,
        createdAt: 1,
        reloadAmount: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
      })
      .lean();
    topupLight.forEach((item) => {
      item.topupType = "Light";
    });
    //concat arrays and sort by date
    let topups = topupBundle.concat(topupLight);
    topups.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.send(topups);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.getDailyTopupsWholesaler = async (req, res) => {
  try {
    const retailers = await Retailer.find({ wholesaler: req.body.wholesalerId });

    let retailerIds = retailers.map((retailer) => retailer._id);

    let topupBundle = await TopupBundle.find({
      retailer: { $in: retailerIds },
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
        $lte: new Date().setHours(23, 59, 59, 999) // End of the day
      }
    }).populate("bundle");

    let topupLight = await TopupLight.find({
      retailer: { $in: retailerIds },
      createdAt: {
        $gte: new Date().setHours(0, 0, 0, 0), // Start of the day
        $lte: new Date().setHours(23, 59, 59, 999) // End of the day
      }
    });

    // Calculate the total of topupBundle prices
    let totalTopupBundle = topupBundle.reduce((total, bundle) => {
      return total + bundle.bundle.price.amount;
    }, 0);

    // Calculate the total of topupLight reload amounts
    let totalTopupLight = topupLight.reduce((total, light) => {
      return total + light.reloadAmount.amount;
    }, 0);

    // Concatenate arrays and sort by date
    let topups = topupBundle.concat(topupLight);
    topups.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      totalTopupBundle: totalTopupBundle,
      totalTopupLight: totalTopupLight
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "An error occurred!" });
  }
};

exports.getTopupsSubWholesaler = async (req, res) => {
  try {
    const subwholesaler = await subWholesaler.findOne({
      user: new mongoose.Types.ObjectId(req.user.id),
    });
    const retailers = await Retailer.find({ subWholesaler: subwholesaler._id });
    let retailerIds = retailers.map((retailer) => retailer._id);
    console.log(retailerIds);
    let topupBundle = await TopupBundle.find({ retailer: { $in: retailerIds } })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .populate("bundle")
      .select({
        _id: 1,
        topupType: "Bundle",
        MSISDN: 1,
        createdAt: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
        "bundle._id": 1,
        "bundle.name": 1,
        "bundle.price": 1,
      })
      .lean();
    topupBundle.forEach((item) => {
      item.topupType = "Bundle";
    });

    const topupLight = await TopupLight.find({ retailer: { $in: retailerIds } })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .select({
        _id: 1,
        MSISDN: 1,
        createdAt: 1,
        reloadAmount: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
      })
      .lean();
    topupLight.forEach((item) => {
      item.topupType = "Light";
    });
    //concat arrays and sort by date
    let topups = topupBundle.concat(topupLight);
    topups.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.send(topups);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.getTopupsRetailer = async (req, res) => {
  try {
    const retailer = await Retailer.findOne({
      user: new mongoose.Types.ObjectId(req.user.id),
    });

    let topupBundle = await TopupBundle.find({ retailer: retailer._id })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .populate("bundle")
      .select({
        _id: 1,
        topupType: "Bundle",
        MSISDN: 1,
        createdAt: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
        "bundle._id": 1,
        "bundle.name": 1,
        "bundle.price": 1,
      })
      .lean();
    topupBundle.forEach((item) => {
      item.topupType = "Bundle";
    });
    const topupLight = await TopupLight.find({ retailer: retailer._id })
      .populate({
        path: "retailer",
        populate: { path: "user" },
      })
      .populate("MVNO")
      .select({
        _id: 1,
        MSISDN: 1,
        createdAt: 1,
        reloadAmount: 1,
        "retailer._id": 1,
        "retailer.user._id": 1,
        "retailer.user.firstName": 1,
        "retailer.user.lastName": 1,
        "retailer.wholesaler": 1,
        "MVNO._id": 1,
        "MVNO.name": 1,
      })
      .lean();
    topupLight.forEach((item) => {
      item.topupType = "Light";
    });
    //concat arrays and sort by date
    let topups = topupBundle.concat(topupLight);
    topups.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.send(topups);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.getTopupsSuperAdmin = async (req, res) => {
  try {
    let trans = await Transaction.aggregate([
      {
        $match: { level: 2 },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: "wholesalers",
          localField: "sender",
          foreignField: "_id",
          as: "sender_info",
        },
      },
      {
        $lookup: {
          from: "retailers",
          localField: "recipient",
          foreignField: "_id",
          as: "recipient_info",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "recipient_info.user",
          foreignField: "_id",
          as: "recipient_user_info",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sender_info.user",
          foreignField: "_id",
          as: "sender_user_info",
        },
      },
      {
        $match: { "sender_user_info.shopName": /^Franchise/ },
      },
      {
        $project: {
          _id: 0,
          level: 1,
          sender: {
            user: {
              firstName: "$sender_user_info.firstName",
              lastName: "$sender_user_info.lastName",
              role: "$sender_user_info.role",
            },
          },
          recipient: {
            user: {
              firstName: "$recipient_user_info.firstName",
              lastName: "$recipient_user_info.lastName",
              role: "$recipient_user_info.role",
            },
          },
          transactionAmount: {
            amount: "$transactionAmount.amount",
            unit: "$transactionAmount.unit",
          },
          createdAt: "$createdAt",
        },
      },
    ]);
    res.send(trans);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};
