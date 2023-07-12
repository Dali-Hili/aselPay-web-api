const mongoose = require('mongoose');
const Wholesaler = require("../models/Wholesaler");
const User = require("../models/User");
const subWholesaler = require("../models/subWholesaler");
const Retailer = require("../models/Retailer");

//returns wholesaler by id
exports.getWholesaler = async (req, res) => {
    try{
        const id = req.params.id;
        let wholesaler = await Wholesaler
        .findById(id)
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        res.send(wholesaler);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns the current wholesaler details
exports.getCurrentWholesaler = async (req, res) => {
    try{
        const user_id = req.user.id;
        let wholesaler = await Wholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        if(!wholesaler){
            res.status(400).json({msg : "This wholesaler does not exist"});
            return;
        }
        res.send(wholesaler);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all the wholesalers (to the admin)
exports.getAllWholesalers = async (req, res) => {
    try{
        let wholesalers = await Wholesaler
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1,"shopName": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        wholesalers = wholesalers.filter(wholesaler => {
            if(wholesaler.user?.shopName !== undefined) {
            return !wholesaler.user.shopName.startsWith('Franchise');
            }
        });
        res.send(wholesalers);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all alpha franchese wholesalers 
exports.getAlphaWholesalers = async (req, res) => {
    try{
        let wholesalers = await Wholesaler
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1,"shopName": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        var filtredWholesalers = wholesalers.filter((element)=>{
            if(element.user?.shopName !== undefined) {
                return element.user.shopName.startsWith("Franchise")
            }
        })
        res.send(filtredWholesalers);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns Wholesaler childrens
exports.getWholesalerChildren = async (req, res) => {
    console.log("eghh");
    try{
        const user_id = req.user.id;
        const wholesaler = await Wholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","wholesaler","role"])
        
        if(!wholesaler){
            res.status(400).json({msg : "This wholesaler does not exist"});
            return;
        }

        let SubWholesalers = await subWholesaler
        .find({wholesaler : wholesaler._id})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1,"role":1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid", "reductionPercentage","wholesaler","role"])
        let retailers = await Retailer
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1,"shopName": 1,"wholesaler":1,"role":1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid", "reductionPercentage","wholesaler","role"])
        var filtredRetailers = retailers.filter((element)=>{
            if(element.wholesaler !== undefined){
                   return element.wholesaler.toString() === wholesaler._id.toString()
            }
        })
        console.log({filtredRetailers, SubWholesalers});
        res.send({wholesaler,filtredRetailers, SubWholesalers});

    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}