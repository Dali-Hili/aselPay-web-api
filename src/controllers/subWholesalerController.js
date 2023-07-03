const mongoose = require('mongoose');
const Retailer = require("../models/Retailer");
const Wholesaler = require("../models/Wholesaler");
const User = require("../models/User");
const subWholesaler = require("../models/subWholesaler");
//returns a SubWholesaler by id
exports.getSubWholesaler = async (req, res) => {
    try{
        const id = req.params.id;
        const SubWholesaler = await subWholesaler
        .findById(id)
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1,"phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","reductionPercentage","wholesaler"])
        .sort({'createdAt': -1});
        res.send(SubWholesaler);
    }catch(error){
        console.error(error);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns the current subWholesaler details
exports.getCurrentsubWholesaler = async (req, res) => {
    try{
        const user_id = req.user.id;
        let SubWholesaler = await subWholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","reductionPercentage","wholesaler"])
        .sort({'createdAt': -1});
        if(!SubWholesaler){
            res.status(400).json({msg : "Le point de vente demandé n'existe pas"});
            return;
        }
        res.send(SubWholesaler);
    }catch(error){
        console.error(error);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all subWholesaler in the DB
exports.getAllSubWholesaler = async (req, res) => {
    try{
        let allSubWholesaler = await subWholesaler
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","reductionPercentage","wholesaler"])

        res.send(allSubWholesaler);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all SubWholesaler grouped by wholesalers
exports.getAllSubWholesalerByWholesalers = async (req, res) => {
    try{
        const SubWholesalers = await subWholesaler.aggregate([
            {
                $lookup: 
                {
                  'from': 'users', 
                  'localField': 'user', 
                  'foreignField': '_id', 
                  'as': 'user_details'
                }
            },
            {
                $unwind: 
                {
                  path: "$user_details",
                  preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: 
                {
                  'from': 'wholesalers', 
                  'localField': 'wholesaler', 
                  'foreignField': '_id', 
                  'as': 'wholesaler_details'
                }
            },
            {
                $unwind: 
                {
                  path: "$wholesaler_details",
                  preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: 
                {
                  'from': 'users', 
                  'localField': 'wholesaler_details.user',
                  'foreignField': '_id', 
                  'as': 'wholesaler_user_details'
                }
            },
            {
                $unwind: 
                {
                  path: "$wholesaler_user_details",
                  preserveNullAndEmptyArrays: true
                }
            },
            {
                $project : {
                    'wholesaler': {
                        '_id' : '$wholesaler_details._id',
                        'balance': '$wholesaler_details.balance',
                        'totalTransactions': '$wholesaler_details.totalTransactions',
                        'totalPayments' : '$wholesaler_details.totalPayments',
                        'unpaid': '$wholesaler_details.unpaid',
                        'user' : {
                            '_id': '$wholesaler_user_details._id',
                            'firstName' : '$wholesaler_user_details.firstName',
                            'lastName' : '$wholesaler_user_details.lastName',
                            'createdAt': '$wholesaler_user_details.createdAt',
                            'accountStatus' : '$wholesaler_user_details.accountStatus',
                            'passwordExpiryDate' : '$wholesaler_user_details.passwordExpiryDate',
                            'phoneNumber' : '$wholesaler_user_details.phoneNumber',
                        }
                    },
                    '_id' : 1,
                    'balance' : 1,
                    'totalTransactions': 1,
                    'totalPayments' : 1,
                    'unpaid' : 1,
                    'user' : {
                        '_id': '$user_details._id',
                        'firstName': '$user_details.firstName',
                        'lastName': '$user_details.lastName',
                        'createdAt': '$user_details.createdAt',
                        'accountStatus' : '$user_details.accountStatus',
                        'passwordExpiryDate' : '$user_details.passwordExpiryDate',
                        'phoneNumber' : '$user_details.phoneNumber',
                    }
                }
            },
            {
                $sort: {'user.createdAt': -1, 'wholesaler.user.createdAt' : -1} 
            },
            {
                $group: {
                    _id : "$wholesaler",
                    SubWholesalers: {$push: {
                        _id : '$_id',
                        balance:"$balance",
                        totalTransactions : '$totalTransactions',
                        totalPayments : '$totalPayments',
                        unpaid : '$unpaid',
                        user : '$user'
                    }}
                }
            },
        
        ]);
        let groupedsubWholesalers = SubWholesalers.map((group)=>{
            return {wholesaler : group._id, subWholesalers : group.SubWholesalers}
        })
        res.send(groupedsubWholesalers);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns subWholesalers of the given user (wholesaler)
exports.getSubWholesalersbyWholesaler = async (req, res) => {
    try{
        const user_id = req.user.id;
        const wholesaler = await Wholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","wholesaler"])
        
        if(!wholesaler){
            res.status(400).json({msg : "This wholesaler does not exist"});
            return;
        }

        let SubWholesalers = await subWholesaler
        .find({wholesaler : wholesaler._id})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid", "reductionPercentage","wholesaler"])

        res.send({wholesaler, SubWholesalers});
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns retailers of the given user (subwholesaler)
exports.getRetailersBySubWholesaler = async (req, res) => {
    try{
        const user_id = req.user.id;
        const SubWholesaler = await subWholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","wholesaler"])
        
        if(!SubWholesaler){
            res.status(400).json({msg : "This sub-wholesaler does not exist"});
            return;
        }

        let retailers = await Retailer
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1,"shopName": 1,"subWholesaler":1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid", "reductionPercentage","subWholesaler"])
        var filtredRetailers = retailers.filter((element)=>{
            if(element.subWholesaler !== undefined){
                   return element.subWholesaler.toString() === SubWholesaler._id.toString()
            }
        })
        res.send({SubWholesaler, filtredRetailers});
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}


