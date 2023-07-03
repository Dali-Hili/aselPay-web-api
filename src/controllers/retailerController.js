const mongoose = require("mongoose");
const Retailer = require("../models/Retailer");
const Wholesaler = require("../models/Wholesaler");
const User = require("../models/User");
const subWholesaler = require("../models/subWholesaler");
const SIM = require("../models/SIM");

//returns a retailer by id
exports.getRetailer = async (req, res) => {
  try {
    const id = req.params.id;
    const retailer = await Retailer.findById(id)
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "reductionPercentage",
        "wholesaler",
      ])
      .sort({ createdAt: -1 });
    res.send(retailer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns the current retailer details
// exports.getCurrentRetailer = async (req, res) => {
//     try{
//         const user_id = req.user.id;
//         let retailer = await Retailer
//         .findOne({user : new mongoose.Types.ObjectId(user_id)})
//         .populate({
//             path: 'user',
//             model: 'User',
//             select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber" : 1},
//         })
//         .select(['balance',"totalTransactions","totalPayments","unpaid","reductionPercentage","wholesaler","allowedBundlesByMVNO"])
//         .sort({'createdAt': -1});
//         if(!retailer){
//             res.status(400).json({msg : "Le point de vente demandé n'existe pas"});
//             return;
//         }
//         res.send(retailer);
//     }catch(error){
//         console.error(error);
//         res.status(500).json({ msg: "Une erreur s'est produite!" });
//     }
// }

exports.getCurrentRetailer = async (req, res) => {
  try {
    const user_id = req.user.id;
    const retailer = await Retailer.findOne({ user: user_id }).populate(
      "wholesaler"
    );
    if (!retailer.wholesaler) {
      const retailer = await Retailer.findOne({ user: user_id }).populate({
        path: "subWholesaler",
        populate: {
          path: "wholesaler",
        },
      });
      res.status(200).send(retailer);
      return;
    }

    return res.status(200).send(retailer);
  } catch (error) {
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns all retailers in the DB
exports.getAllRetailers = async (req, res) => {
  try {
    let retailers = await Retailer.find()
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "reductionPercentage",
        "wholesaler",
      ]);

    res.send(retailers);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns all retailers grouped by wholesalers
exports.getAllRetailersByWholesaler = async (req, res) => {
  try {
    const retailers = await Retailer.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user_details",
        },
      },
      {
        $unwind: {
          path: "$user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "wholesalers",
          localField: "wholesaler",
          foreignField: "_id",
          as: "wholesaler_details",
        },
      },
      {
        $unwind: {
          path: "$wholesaler_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "wholesaler_details.user",
          foreignField: "_id",
          as: "wholesaler_user_details",
        },
      },
      {
        $unwind: {
          path: "$wholesaler_user_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          wholesaler: {
            _id: "$wholesaler_details._id",
            balance: "$wholesaler_details.balance",
            totalTransactions: "$wholesaler_details.totalTransactions",
            totalPayments: "$wholesaler_details.totalPayments",
            unpaid: "$wholesaler_details.unpaid",
            user: {
              _id: "$wholesaler_user_details._id",
              firstName: "$wholesaler_user_details.firstName",
              lastName: "$wholesaler_user_details.lastName",
              createdAt: "$wholesaler_user_details.createdAt",
              accountStatus: "$wholesaler_user_details.accountStatus",
              passwordExpiryDate: "$wholesaler_user_details.passwordExpiryDate",
              phoneNumber: "$wholesaler_user_details.phoneNumber",
            },
          },
          _id: 1,
          balance: 1,
          totalTransactions: 1,
          totalPayments: 1,
          unpaid: 1,
          user: {
            _id: "$user_details._id",
            firstName: "$user_details.firstName",
            lastName: "$user_details.lastName",
            createdAt: "$user_details.createdAt",
            accountStatus: "$user_details.accountStatus",
            passwordExpiryDate: "$user_details.passwordExpiryDate",
            phoneNumber: "$user_details.phoneNumber",
          },
        },
      },
      {
        $sort: { "user.createdAt": -1, "wholesaler.user.createdAt": -1 },
      },
      {
        $group: {
          _id: "$wholesaler",
          retailers: {
            $push: {
              _id: "$_id",
              balance: "$balance",
              totalTransactions: "$totalTransactions",
              totalPayments: "$totalPayments",
              unpaid: "$unpaid",
              user: "$user",
            },
          },
        },
      },
    ]);
    let groupedRetailers = retailers.map((group) => {
      return { wholesaler: group._id, retailers: group.retailers };
    });
    res.send(groupedRetailers);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns retailers of the given user (wholesaler)
exports.getRetailersbyWholesaler = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wholesaler = await Wholesaler.findOne({
      user: new mongoose.Types.ObjectId(user_id),
    })
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "wholesaler",
      ]);

    if (!wholesaler) {
      res.status(400).json({ msg: "This wholesaler does not exist" });
      return;
    }

    let retailers = await Retailer.find({ wholesaler: wholesaler._id })
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "reductionPercentage",
        "wholesaler",
      ]);

    res.send({ wholesaler, retailers });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns retailers of the given user (subwholesaler)
exports.getRetailersbySubWholesaler = async (req, res) => {
  try {
    const user_id = req.user.id;
    const Subwholesaler = await subWholesaler
      .findOne({ user: new mongoose.Types.ObjectId(user_id) })
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "wholesaler",
      ]);

    if (!Subwholesaler) {
      res.status(400).json({ msg: "This wholesaler does not exist" });
      return;
    }

    let retailers = await Retailer.find({ subWholesaler: Subwholesaler._id })
      .populate({
        path: "user",
        model: "User",
        select: {
          firstName: 1,
          lastName: 1,
          createdAt: 1,
          accountStatus: 1,
          passwordExpiryDate: 1,
          phoneNumber: 1,
        },
      })
      .select([
        "balance",
        "totalTransactions",
        "totalPayments",
        "unpaid",
        "reductionPercentage",
        "wholesaler",
      ]);

    res.send({ Subwholesaler, retailers });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

//returns the retailer MVNO
exports.getRetailerMVNO = async (req, res) => {
  console.log(req.body);
  try {
    const retailerMVNO = await SIM.aggregate([
      { $match: { MSISDN: req.body.MSISDN } },
      {
        $lookup: {
          from: "mvnos",
          localField: "mvno",
          foreignField: "_id",
          as: "mvnoDetails",
        },
      },
      {
        $unwind: {
          path: "$mvnoDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    res.send(retailerMVNO);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};
