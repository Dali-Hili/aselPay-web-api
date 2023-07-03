const mongoose = require('mongoose');
const SuperAdmin = require("../models/SuperAdmin");
const Wholesaler = require("../models/Wholesaler");




//returns the current super admin details
exports.getCurrentSuperAdmin = async (req, res) => {
    try{
        const user_id = req.user.id;
        console.log(req.user);
        let superAdmin = await SuperAdmin
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        if(!superAdmin){
            res.status(400).json({msg : "This Super Admin does not exist"});
            return;
        }
        res.send(superAdmin);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.getSuperAdmin = async (req, res) => {
    try{
        const id = req.params.id;
        let superAdmin = await SuperAdmin
        .findById(id)
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        res.send(superAdmin);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all the SuperAdmins (to the admin)
exports.getAllSuperAdmins = async (req, res) => {
    try{
        let SuperAdmins = await SuperAdmin
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate": 1, "phoneNumber": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid"]);
        res.send(SuperAdmins);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns wholesalers of the given user (superadmin)
exports.getWholesalersBySuperAdmin = async (req, res) => {
    try{
        const user_id = req.user.id;
        const superAdmin = await SuperAdmin
        .findOne({user : new mongoose.Types.ObjectId(user_id)})
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid","wholesaler"])
        
        if(!superAdmin){
            res.status(400).json({msg : "This super admin does not exist"});
            return;
        }

        let wholesalers = await Wholesaler
        .find()
        .populate({
            path: 'user',
            model: 'User',
            select: { 'firstName': 1,'lastName':1, 'createdAt':1, 'accountStatus' : 1, "passwordExpiryDate" : 1, "phoneNumber" : 1,"shopName": 1},
        })
        .select(['balance',"totalTransactions","totalPayments","unpaid", "reductionPercentage","wholesaler"])
        var filtredWholesalers = wholesalers.filter((element)=>{
            if(element.user?.shopName !== undefined) {
                return element.user.shopName.startsWith("Franchise")
            }
            // console.log(element);
        })
        res.send({superAdmin, filtredWholesalers});
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}