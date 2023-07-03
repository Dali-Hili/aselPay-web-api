const mongoose = require('mongoose');
var axios = require('axios');
const { validationResult } = require('express-validator');

const Payment = require("../models/Payment");
const Retailer = require("../models/Retailer");
const Wholesaler = require("../models/Wholesaler");
const Admin = require("../models/Admin");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const subWholesaler = require("../models/subWholesaler");

//add a payment between wholesaler and admin
exports.addPaymentLevel1 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if(!errors.isEmpty()){
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({errors});
    }
    try{
        //destructure the request body
        let {level, sender : sender_id, recipient : recipient_id, paymentAmount} = req.body;
        if(level != 1){
            res.status(400).json({msg : "Le niveau de paiement doit être 1"});
            return;
        }
        //make sure the sender (wholesaler) exists in the DB
        let sender = await Wholesaler.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if(!sender){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
        }
        //make sure the recipient (admin) exists in the DB
        let recipient = await Admin.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if(!recipient){
            res.status(400).json({msg : "L'admin demandé n'existe pas"});
            return;
        }
        //make sure the user who requested the payment is the recipient
        if(recipient.user._id.toString() != req.user.id.toString()){
            res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
            return;
        }
        //make sure the sender/recipient's account is active 
        if(recipient.user.accountStatus === "inactive" || sender.user.accountStatus === "inactive"){
            res.status(400).json({msg : "Vous ne pouvez pas effectuer un paiement de/à un compte inactif"});
            return;
        }
        //make sure the sender has an unpaid debt 
        if(sender.unpaid.amount == 0 ){
            res.status(400).json({msg : `${sender.user.firstName} ${sender.user.lastName} n'a pas de dettes à payer actuellement`});
            return;
        }
        //make sure the payment amount is lesser or equal to the sender's unpaid amount
        if(paymentAmount.amount > sender.unpaid.amount){
            res.status(400).json({msg : `Le montant du paiement doit être inférieur ou égal à ${sender.unpaid.amount} ${sender.unpaid.unit}`});
            return;
        }
        //create new payment locally
        let payment = new Payment({
            level : 1,
            sender : sender._id,
            recipient : recipient._id,
            paymentAmount : {
                amount : paymentAmount.amount,
                unit : paymentAmount.unit
            }
        });
        //deduct the payment amount from the sender's (wholesaler) unpaid amount
        sender.unpaid.amount -= paymentAmount.amount;
        //add the payment amount to the sender's (wholesaler) total payments
        sender.totalPayments.amount += paymentAmount.amount;
        //commit changes to DB through a transaction
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the payment object to the DB
            await payment.save();
            //save the updated wholesaler to the DB
            await sender.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg : `${sender.user.firstName} ${sender.user.lastName} vous a payés ce montant : ${paymentAmount.amount} ${paymentAmount.unit}`
            });
        }catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//add a payment between retailer and (wholesaler || subwholesaler) 
exports.addPaymentLevel2 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if(!errors.isEmpty()){
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({errors});
    }
    try{
        //destructure the request body
        let {level, sender : sender_id, recipient : recipient_id, paymentAmount} = req.body;
        if(level != 2){
            res.status(400).json({msg : "Le niveau de paiement doit être 2"});
            return;
        }
        //make sure the sender (retailer) exists in the DB
        let sender = await Retailer.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if(!sender){
            sender = await subWholesaler.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
            if(!sender){
                res.status(400).json({msg : "Le point de vente demandé n'existe pas"});
                return;
            }
        }
        //make sure the recipient (wholesaler) exists in the DB
        let recipient = await Wholesaler.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if(!recipient){
            recipient = await subWholesaler.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
            if(!recipient){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
            }
        }
        console.log(recipient,"resp",req.user);
        //make sure the user who requested the payment is the recipient
        //make sure the sender (retailer) works under the recipient (wholesaler || subwholesaler)
        if(req.user.role == "wholesaler"){
            if(recipient.user._id.toString() != req.user.id.toString() || sender.wholesaler.toString() != recipient._id.toString()){
                res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
                return;
            }
        } else if (req.user.role == "sub-wholesaler"){
            if(recipient.user._id.toString() != req.user.id.toString() || sender.subWholesaler.toString() != recipient._id.toString()){
                res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
                return;
            }
        }
        //make sure the sender/recipient's account is active 
        if(recipient.user.accountStatus === "inactive" || sender.user.accountStatus === "inactive"){
            res.status(400).json({msg : "Vous ne pouvez pas effectuer un paiement de/à un compte inactif"});
            return;
        }
        //make sure the sender has an unpaid debt 
        if(sender.unpaid.amount == 0 ){
            res.status(400).json({msg : `${sender.user.firstName} ${sender.user.lastName} n'a pas de dettes à payer actuellement`});
            return;
        }
        //make sure the payment amount is lesser or equal to the sender's unpaid amount
        if(paymentAmount.amount > sender.unpaid.amount){
            res.status(400).json({msg : `Le montant du paiement doit être inférieur ou égal à ${sender.unpaid.amount} ${sender.unpaid.unit}`});
            return;
        }
        //create new payment locally
        let payment = new Payment({
            level : 2,
            sender : sender._id,
            recipient : recipient._id,
            paymentAmount : {
                amount : paymentAmount.amount,
                unit : paymentAmount.unit
            }
        });
        //deduct the payment amount from the sender's (retailer) unpaid amount
        sender.unpaid.amount -= paymentAmount.amount;
        //add the payment amount to the sender's (retailer) total payments
        sender.totalPayments.amount += paymentAmount.amount;
        //commit changes to DB through a transaction
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the payment object to the DB
            await payment.save();
            //save the updated wholesaler to the DB
            await sender.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg : `${sender.user.firstName} ${sender.user.lastName} vous a payés ce montant : ${paymentAmount.amount} ${paymentAmount.unit}`
            });
        }catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }


        //alert admins of the payment via SMS
        let admins = await Admin.find().populate('user');
        admins.map( async (admin) => {
            var data = JSON.stringify({
                "SentMessage":`Le point de vente "${sender.user.firstName} ${sender.user.lastName}" a payé le commercial "${recipient.user.firstName} ${recipient.user.lastName}" ce montant : ${paymentAmount.amount} ${paymentAmount.unit} à ${new Date(payment.createdAt).toLocaleString('fr-FR')} `,
                "SentMSISDN": `${21647039611}`,
                "SentTon": "1",
                "SentNpi": "0",
                "Login": "ResellerAsel",
                "Password": "Xr4rVZ3qsdfqs78I1"
            });
              
            var config = {
                method: 'post',
                url: 'https://posbe.cayoncloud.com/serviceSMS/AddSMSSent',
                headers: { 
                  'Content-Type': 'application/json'
                },
                data : data
            };
            try{
                const response = await axios(config);
                console.log(response.data);
            }catch(error){
                console.log(error)
            }
        })
        
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//add a payment between wholesaler and superAdmin
exports.addPaymentLevel3 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if(!errors.isEmpty()){
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({errors});
    }
    try{
        //destructure the request body
        let {level, sender : sender_id, recipient : recipient_id, paymentAmount} = req.body;
        if(level != 3){
            res.status(400).json({msg : "Le niveau de paiement doit être 1"});
            return;
        }
        //make sure the sender (wholesaler) exists in the DB
        let sender = await Wholesaler.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if(!sender){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
        }
        //make sure the recipient (admin) exists in the DB
        let recipient = await SuperAdmin.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if(!recipient){
            res.status(400).json({msg : "Le super admin demandé n'existe pas"});
            return;
        }
        //make sure the user who requested the payment is the recipient
        if(recipient.user._id.toString() != req.user.id.toString()){
            res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
            return;
        }
        //make sure the sender/recipient's account is active 
        if(recipient.user.accountStatus === "inactive" || sender.user.accountStatus === "inactive"){
            res.status(400).json({msg : "Vous ne pouvez pas effectuer un paiement de/à un compte inactif"});
            return;
        }
        //make sure the sender has an unpaid debt 
        if(sender.unpaid.amount == 0 ){
            res.status(400).json({msg : `${sender.user.firstName} ${sender.user.lastName} n'a pas de dettes à payer actuellement`});
            return;
        }
        //make sure the payment amount is lesser or equal to the sender's unpaid amount
        if(paymentAmount.amount > sender.unpaid.amount){
            res.status(400).json({msg : `Le montant du paiement doit être inférieur ou égal à ${sender.unpaid.amount} ${sender.unpaid.unit}`});
            return;
        }
        //create new payment locally
        let payment = new Payment({
            level : 3,
            sender : sender._id,
            recipient : recipient._id,
            paymentAmount : {
                amount : paymentAmount.amount,
                unit : paymentAmount.unit
            }
        });
        //deduct the payment amount from the sender's (wholesaler) unpaid amount
        sender.unpaid.amount -= paymentAmount.amount;
        //add the payment amount to the sender's (wholesaler) total payments
        sender.totalPayments.amount += paymentAmount.amount;
        //commit changes to DB through a transaction
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the payment object to the DB
            await payment.save();
            //save the updated wholesaler to the DB
            await sender.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg : `${sender.user.firstName} ${sender.user.lastName} vous a payés ce montant : ${paymentAmount.amount} ${paymentAmount.unit}`
            });
        }catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all payments
exports.getAllPayments = async (req, res) => {
    try{
        let paymentsL1 = await Payment
        .find({level : 1})
        .populate({
            path: 'sender',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Admin',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });

        let paymentsL2 = await Payment
        .find({level : 2})
        .populate({
            path: 'sender',
            model: 'Retailer',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });
        let paymentsl2 = await Payment
        .find({level : 2})
        .populate({
            path: 'sender',
            model: 'Retailer',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'sub-Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });
        let paymentsll2 = await Payment
        .find({level : 2})
        .populate({
            path: 'sender',
            model: 'sub-Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });

        paymentsL2 = paymentsL2.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        paymentsl2 = paymentsl2.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        paymentsll2 = paymentsll2.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        let payments = paymentsL1.concat(paymentsL2,paymentsl2,paymentsll2);
        payments.sort(function(a,b){
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(payments);
    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all payments of the current user (wholesaler)
exports.getPaymentsWholesaler =  async (req, res) => {
    try{
        let user_id = req.user.id;
        const wholesaler = await Wholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)});

        if(!wholesaler){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
        }

        let paymentsL1 = await Payment
        .find({sender : wholesaler._id, level : 1})
        .populate({
            path: 'sender',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Admin',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });

        let paymentsl2 = await Payment
        .find({recipient : wholesaler._id ,level : 2})
        .populate({
            path: 'sender',
            model: 'sub-Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });
        let paymentsL2 = await Payment
        .find({recipient : wholesaler._id ,level : 2})
        .populate({
            path: 'sender',
            model: 'Retailer',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'recipient',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });
        paymentsL1 = paymentsL1.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        paymentsl2 = paymentsl2.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        paymentsL2 = paymentsL2.filter((elem)=>{return elem.sender !== null && elem.recipient !== null})
        let payments = paymentsL1.concat(paymentsl2,paymentsL2);
        payments.sort(function(a,b){
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(payments);

    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all payments of the current user (sub-wholesaler)
exports.getPaymentsSubWholesaler =  async (req, res) => {
    try{
        let user_id = req.user.id;
        const SubWholesaler = await subWholesaler
        .findOne({user : new mongoose.Types.ObjectId(user_id)});

        if(!SubWholesaler){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
        }

        let paymentsL2 = await Payment
        .find({recipient : SubWholesaler._id ,level : 2})
        .populate({
            path: 'recipient',
            model: 'sub-Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        })
        .populate({
            path: 'sender',
            model: 'Retailer',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })

        let payments = paymentsL2
        payments.sort(function(a,b){
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(payments);

    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all payments of the current user (superadmin)
exports.getPaymentsSuperAdmin =  async (req, res) => {
    try{
        let user_id = req.user.id;
        const superadmin = await SuperAdmin
        .findOne({user : new mongoose.Types.ObjectId(user_id)});

        if(!superadmin){
            res.status(400).json({msg : "Le commercial demandé n'existe pas"});
            return;
        }

        let paymentsL1 = await Payment
        .find({recipient : superadmin._id, level : 3})
        .populate({
            path: 'recipient',
            model: 'SuperAdmin',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1 },
            }
        })
        .populate({
            path: 'sender',
            model: 'Wholesaler',
            select: { 'user' :  1 },
            populate : {
                path : 'user',
                model: 'User',
                select: { 'firstName': 1,'lastName':1, 'role' : 1  },
            }
        });
        let payments = paymentsL1
        payments.sort(function(a,b){
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(payments);

    }catch(error){
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}