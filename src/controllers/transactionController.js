const mongoose = require('mongoose');
const AselPayConnection = require('../../config/MultipleConnectionDb')
const { validationResult } = require('express-validator');

const User = require("../models/User");
const Admin = require("../models/Admin");
const Wholesaler = require("../models/Wholesaler");
const Retailer = require("../models/Retailer");
const Transaction = require("../models/Transaction");
const SuperAdmin = require("../models/SuperAdmin");
const subWholesaler = require("../models/subWholesaler");


exports.addTransactionLevel1 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map(e => e.msg);
        console.log(errors)
        return res.status(400).json({ errors });
    }
    try {
        //destructure the request body
        let { sender: sender_id, recipient: recipient_id, transactionAmount } = req.body;
        //make sure the sender exists in the DB
        let sender = await Admin.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if (!sender) {
            res.status(400).json({ msg: "L'admin demandé n'existe pas" });
            return;
        }
        //make sure the user who requested the transaction is the sender
        if (sender.user._id.toString() != req.user.id.toString()) {
            res.status(403).json({ msg: "Vous n'êtes pas autorisé à effectuer cette transaction" });
            return;
        }
        //make sure the recipient exists in the DB
        let recipient = await Wholesaler.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if (!recipient) {
            recipient = await SuperAdmin.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
            if (!recipient) {
                res.status(400).json({ msg: "Le commercial demandé n'existe pas" });
                return;
            }
        }
        //make sure the recipient's account is active 
        if (recipient.user.accountStatus === "inactive") {
            res.status(400).json({ msg: "Vous ne pouvez pas effectuer un paiement de/à un compte inactif" });
            return;
        }
        //make sure the balance of the recipient won't exceed the balance limit after the transaction
        if (recipient.balance.amount + transactionAmount.amount > parseInt(process.env.WHOLESALER_BALANCE_LIMIT)) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le solde du commercial a dépassé ${process.env.WHOLESALER_BALANCE_LIMIT} ${process.env.CURRENCY}`
            });
            return;
        }
        //make sure the total unpaid amount won't exceed balance limit after the transaction 
        if (recipient.unpaid.amount + transactionAmount.amount > process.env.WHOLESALER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le montant impayé de ${recipient.user.firstName}${recipient.user.lastName} a dépassé ${process.env.WHOLESALER_BALANCE_LIMIT}`
            });
            return;
        }
        //create new transaction locally
        let transaction = new Transaction({
            level: 1,
            sender: sender._id,
            recipient: recipient._id,
            transactionAmount: {
                amount: transactionAmount.amount,
                unit: transactionAmount.unit
            }
        });
        //add transaction amount to recipient's balance locally
        recipient.balance.amount += transactionAmount.amount;
        //add transaction amount to recipient's total transactions
        recipient.totalTransactions.amount += transactionAmount.amount;
        //add transaction amount to recipient's unpaid amount locally
        recipient.unpaid.amount += transactionAmount.amount;
        //commit changes to DB through a mongoose transaction session, 
        //if any of the changes fail to commit, the whole transaction is aborted
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the transaction object to the DB
            await transaction.save();
            //save the updated wholesaler to the DB
            await recipient.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg: `Vous avez transféré ${transactionAmount.amount} ${transactionAmount.unit} au compte de ${recipient.user.firstName} ${recipient.user.lastName}`
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.addTransactionLevel2 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({ errors });
    }
    try {
        //destructure the request body
        let { sender: sender_id, recipient: recipient_id, transactionAmount } = req.body;
        //make sure the sender exists in the DB
        console.log(sender_id);
        let sender = await Wholesaler.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if (!sender) {
            res.status(400).json({ msg: "Le commercial demandé n'existe pas" });
            return;
        }
        //make sure the user who requested the transaction is the sender
        if (sender.user._id.toString() != req.user.id.toString()) {
            res.status(403).json({ msg: "Vous n'êtes pas autorisé à effectuer ce paiement" });
            return;
        }
        //make sure the sender's balance is greater than the transaction amount
        if (transactionAmount.amount > sender.balance.amount) {
            res.status(400).json({ msg: "Votre solde est insuffisant" });
            return;
        }
        //make sure the recipient exists in the DB
        let recipient = await Retailer.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if (!recipient) {
            // res.status(400).json({msg : "Le point de vente demandé n'existe pas"});
            // return;
            recipient = await subWholesaler.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
            if (!recipient) {
                res.status(400).json({ msg: "Le point de vente demandé n'existe pas" });
                return;
            }
        }
        //make sure the recipient (retailer) works for the sender (wholesaler)
        if (recipient.wholesaler.toString() != sender._id.toString()) {
            res.status(403).json({ msg: "Vous n'êtes pas autorisé à effectuer une transaction à ce point de vente" });
            return;
        }
        //make sure the recipient's account is active 
        if (recipient.user.accountStatus === "inactive") {
            res.status(400).json({ msg: "Vous ne pouvez pas effectuer une transaction à un compte inactif" });
            return;
        }
        //make sure the balance of the recipient won't exceed the balance limit after the transaction
        if (recipient.balance.amount + transactionAmount.amount > process.env.RETAILER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le solde de ce point de vente a dépassé ${process.env.RETAILER_BALANCE_LIMIT} ${process.env.CURRENCY}`
            });
            return;
        }
        //make sure the total unpaid amount won't exceed balance limit after the transaction 
        if (recipient.unpaid.amount + transactionAmount.amount > process.env.RETAILER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le montant impayé de ${recipient.user.firstName}${recipient.user.lastName} a dépassé ${process.env.RETAILER_BALANCE_LIMIT} ${process.env.CURRENCY} `
            });
            return;
        }
        //create a new transaction locally
        let transaction = new Transaction({
            level: 2,
            sender: sender._id,
            recipient: recipient._id,
            transactionAmount: {
                amount: transactionAmount.amount,
                unit: transactionAmount.unit
            }
        });
        //add the transaction amount to the recipient's balance locally
        recipient.balance.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's total transactions
        recipient.totalTransactions.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's unpaid amount locally
        recipient.unpaid.amount += transactionAmount.amount;
        //deduct the transaction amount from the sender's balance locally
        sender.balance.amount -= transactionAmount.amount;

        //commit changes to DB through a mongoose transaction session, 
        //if any of the changes fail to commit, the whole transaction is aborted
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the updated recipient to the DB
            await recipient.save();
            //save the updated sender to the DB
            await sender.save();
            //save the transaction object to the DB
            await transaction.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg: `Vous avez transféré ${transactionAmount.amount} ${transactionAmount.unit} de votre compte à celui de ${recipient.user.firstName} ${recipient.user.lastName}`
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}
// transaction from superadmin to wholesaler alpha
exports.addTransactionLevel3 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({ errors });
    }
    try {
        //destructure the request body
        let { sender: sender_id, recipient: recipient_id, transactionAmount } = req.body;
        //make sure the sender exists in the DB
        let sender = await SuperAdmin.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if (!sender) {
            res.status(400).json({ msg: "Le super admin demandé n'existe pas" });
            return;
        }
        // console.log(req.user);
        // //make sure the user who requested the transaction is the sender
        // if(sender.user._id.toString() != req.user.id.toString()){
        //     res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
        //     return;
        // }
        //make sure the sender's balance is greater than the transaction amount
        console.log(transactionAmount, sender.balance.amount);
        if (transactionAmount.amount > sender.balance.amount) {
            res.status(400).json({ msg: "Votre solde est insuffisant" });
            return;
        }
        //make sure the recipient exists in the DB
        let recipient = await Wholesaler.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if (!recipient) {
            res.status(400).json({ msg: "Le point de vente demandé n'existe pas" });
            return;
        }
        //make sure the recipent is an alpha franchise
        if (!recipient.user.shopName.toString().startsWith("Franchise")) {
            res.status(403).json({ msg: "Vous n'êtes pas autorisé à effectuer une transaction à ce point de vente" });
            return;
        }
        //make sure the recipient's account is active 
        if (recipient.user.accountStatus === "inactive") {
            res.status(400).json({ msg: "Vous ne pouvez pas effectuer une transaction à un compte inactif" });
            return;
        }
        //make sure the balance of the recipient won't exceed the balance limit after the transaction
        if (recipient.balance.amount + transactionAmount.amount > process.env.WHOLESALER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le solde de ce point de vente a dépassé ${process.env.WHOLESALER_BALANCE_LIMIT} ${process.env.CURRENCY}`
            });
            return;
        }
        //make sure the total unpaid amount won't exceed balance limit after the transaction 
        if (recipient.unpaid.amount + transactionAmount.amount > process.env.WHOLESALER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le montant impayé de ${recipient.user.firstName}${recipient.user.lastName} a dépassé ${process.env.RETAILER_BALANCE_LIMIT} ${process.env.CURRENCY} `
            });
            return;
        }
        //create a new transaction locally
        let transaction = new Transaction({
            level: 3,
            sender: sender._id,
            recipient: recipient._id,
            transactionAmount: {
                amount: transactionAmount.amount,
                unit: transactionAmount.unit
            }
        });
        //add the transaction amount to the recipient's balance locally
        recipient.balance.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's total transactions
        recipient.totalTransactions.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's unpaid amount locally
        recipient.unpaid.amount += transactionAmount.amount;
        //deduct the transaction amount from the sender's balance locally
        sender.balance.amount -= transactionAmount.amount;

        //commit changes to DB through a mongoose transaction session, 
        //if any of the changes fail to commit, the whole transaction is aborted
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the updated recipient to the DB
            await recipient.save();
            //save the updated sender to the DB
            await sender.save();
            //save the transaction object to the DB
            await transaction.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg: `Vous avez transféré ${transactionAmount.amount} ${transactionAmount.unit} de votre compte à celui de ${recipient.user.firstName} ${recipient.user.lastName}`
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

// transaction from sub-wholesaler to retailer
exports.addTransactionLevel4 = async (req, res) => {
    //in case of errors in the request body, return error messages and quit the process
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map(e => e.msg);
        return res.status(400).json({ errors });
    }
    try {
        //destructure the request body
        let { sender: sender_id, recipient: recipient_id, transactionAmount } = req.body;
        // console.log(req.body);
        //make sure the sender exists in the DB
        console.log(sender_id, recipient_id, transactionAmount);
        let sender = await subWholesaler.findById(new mongoose.Types.ObjectId(sender_id)).populate('user');
        if (!sender) {
            res.status(400).json({ msg: "Le super admin demandé n'existe pas" });
            return;
        }
        // //make sure the user who requested the transaction is the sender
        // if(sender.user._id.toString() != req.user.id.toString()){
        //     res.status(403).json({msg : "Vous n'êtes pas autorisé à effectuer ce paiement"});
        //     return;
        // }
        //make sure the sender's balance is greater than the transaction amount
        if (transactionAmount.amount > sender.balance.amount) {
            res.status(400).json({ msg: "Votre solde est insuffisant" });
            return;
        }
        //make sure the recipient exists in the DB
        let recipient = await Retailer.findById(new mongoose.Types.ObjectId(recipient_id)).populate('user');
        if (!recipient) {
            res.status(400).json({ msg: "Le point de vente demandé n'existe pas" });
            return;
        }
        //make sure the recipient's account is active 
        if (recipient.user.accountStatus === "inactive") {
            res.status(400).json({ msg: "Vous ne pouvez pas effectuer une transaction à un compte inactif" });
            return;
        }
        //make sure the balance of the recipient won't exceed the balance limit after the transaction
        if (recipient.balance.amount + transactionAmount.amount > process.env.WHOLESALER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le solde de ce point de vente a dépassé ${process.env.WHOLESALER_BALANCE_LIMIT} ${process.env.CURRENCY}`
            });
            return;
        }
        //make sure the total unpaid amount won't exceed balance limit after the transaction 
        if (recipient.unpaid.amount + transactionAmount.amount > process.env.WHOLESALER_BALANCE_LIMIT) {
            res.status(400).json({
                msg: `Vous ne pouvez pas effectuer cette transaction : Le montant impayé de ${recipient.user.firstName}${recipient.user.lastName} a dépassé ${process.env.RETAILER_BALANCE_LIMIT} ${process.env.CURRENCY} `
            });
            return;
        }
        //create a new transaction locally
        let transaction = new Transaction({
            level: 4,
            sender: sender._id,
            recipient: recipient._id,
            transactionAmount: {
                amount: transactionAmount.amount,
                unit: transactionAmount.unit
            }
        });
        //add the transaction amount to the recipient's balance locally
        recipient.balance.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's total transactions
        recipient.totalTransactions.amount += transactionAmount.amount;
        //add the transaction amount to the recipient's unpaid amount locally
        recipient.unpaid.amount += transactionAmount.amount;
        //deduct the transaction amount from the sender's balance locally
        sender.balance.amount -= transactionAmount.amount;

        //commit changes to DB through a mongoose transaction session, 
        //if any of the changes fail to commit, the whole transaction is aborted
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            //save the updated recipient to the DB
            await recipient.save();
            //save the updated sender to the DB
            await sender.save();
            //save the transaction object to the DB
            await transaction.save();

            await session.commitTransaction();
            session.endSession();
            res.status(200).json({
                msg: `Vous avez transféré ${transactionAmount.amount} ${transactionAmount.unit} de votre compte à celui de ${recipient.user.firstName} ${recipient.user.lastName}`
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(error.message);
            res.status(500).json({ msg: "Une erreur s'est produite!" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.getAllTransactions = async (req, res) => {
    try {
        let transactionsL1 = await Transaction
            .find({ level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsl1 = await Transaction
            .find({ level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })

        let transactionsL2 = await Transaction
            .find({ level: 2 })
            .sort({ createdAt: -1 })
            .populate({
                path: 'sender',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Retailer',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsl2 = await Transaction
            .find({ level: 2 })
            .sort({ createdAt: -1 })
            .populate({
                path: 'sender',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'sub-Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            });
        //////
        let transactionsL3 = await Transaction
            .find({ level: 3 })
            .sort({ createdAt: -1 })
            .populate({
                path: 'sender',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            });
        transactionsl2 = transactionsl2.filter((elem) => { return elem.recipient !== null })
        transactionsL2 = transactionsL2.filter((elem) => { return elem.recipient !== null })
        transactionsl1 = transactionsl1.filter((elem) => { return elem.recipient !== null })
        transactionsL1 = transactionsL1.filter((elem) => { return elem.recipient !== null })

        let transactions = transactionsL1.concat(transactionsl1, transactionsL2, transactionsl2, transactionsL3)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(transactions);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.getTransactionsbyWholesaler = async (req, res) => {
    try {
        let user_id = req.user.id;
        const wholesaler = await Wholesaler
            .findOne({ user: new mongoose.Types.ObjectId(user_id) });

        if (!wholesaler) {
            res.status(400).json({ msg: "This wholesaler does not exist" });
            return;
        }

        let transactionsL1 = await Transaction
            .find({ recipient: wholesaler._id, level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })

        let transactionsL2 = await Transaction
            .find({ sender: wholesaler._id, level: 2 })
            .populate({
                path: 'sender',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Retailer',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            });
        let transactionsl2 = await Transaction
            .find({ sender: wholesaler._id, level: 2 })
            .limit({ limit: 30 })
            .populate({
                path: 'sender',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'sub-Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        transactionsl2 = transactionsl2.filter((elem) => { return elem.recipient !== null })
        transactionsL2 = transactionsL2.filter((elem) => { return elem.recipient !== null })
        let transactions = transactionsL1.concat(transactionsL2, transactionsl2)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        })

        res.send(transactions);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.getTransactionsbySuperAdmin = async (req, res) => {
    try {
        let user_id = req.user.id;
        const superAdmin = await SuperAdmin
            .findOne({ user: new mongoose.Types.ObjectId(user_id) });

        if (!superAdmin) {
            res.status(400).json({ msg: "This super admin does not exist" });
            return;
        }
        let transactionsL1 = await Transaction
            .find({ recipient: superAdmin._id, level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsL3 = await Transaction
            .find({ sender: superAdmin._id, level: 3 })
            .populate({
                path: 'sender',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactions = transactionsL1.concat(transactionsL3)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        })
        res.send(transactions);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

exports.getTransactionsbySubWholesaler = async (req, res) => {
    try {
        let user_id = req.user.id;
        const SubWholesaler = await subWholesaler
            .findOne({ user: new mongoose.Types.ObjectId(user_id) });

        if (!SubWholesaler) {
            res.status(400).json({ msg: "This Sub Wholesaler does not exist" });
            return;
        }
        let transactionsL2 = await Transaction
            .find({ recipient: SubWholesaler._id, level: 2 })
            .populate({
                path: 'sender',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'sub-Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsL4 = await Transaction
            .find({ sender: SubWholesaler._id, level: 4 })
            .populate({
                path: 'sender',
                model: 'sub-Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Retailer',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactions = transactionsL2.concat(transactionsL4)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        })
        res.send(transactions);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}


// ============== ADMIN ==============

exports.getAdminTransactions = async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map((e) => e.msg);
        return res.status(400).json({ errors });
    }

    try {
        let transactionsL1 = await Transaction
            .find({ level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsl1 = await Transaction
            .find({ level: 1 })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        transactionsl1 = transactionsl1.filter((elem) => { return elem.recipient !== null })
        transactionsL1 = transactionsL1.filter((elem) => { return elem.recipient !== null })

        let transactions = transactionsL1.concat(transactionsl1)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.send(transactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAdminTransactionsDetailed = async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors = errors.array().map((e) => e.msg);
        return res.status(400).json({ errors });
    }

    try {
        // Calculate the start and end dates of the current month
        const startOfMonth = req.body.startDate
        const endOfMonth = req.body.endDate
        // Retrieve all transactions with level 1
        let transactionsL1 = await Transaction
            .find({
                level: 1, createdAt: {
                    $gt: startOfMonth,
                    $lte: endOfMonth,
                },
            })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'Wholesaler',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        let transactionsl1 = await Transaction
            .find({
                level: 1, createdAt: {
                    $gt: startOfMonth,
                    $lte: endOfMonth,
                },
            })
            .populate({
                path: 'sender',
                model: 'Admin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
            .populate({
                path: 'recipient',
                model: 'SuperAdmin',
                select: { 'user': 1 },
                populate: {
                    path: 'user',
                    model: 'User',
                    select: { 'firstName': 1, 'lastName': 1, 'role': 1 },
                }
            })
        transactionsl1 = transactionsl1.filter((elem) => { return elem.recipient !== null })
        transactionsL1 = transactionsL1.filter((elem) => { return elem.recipient !== null })

        let transactions = transactionsL1.concat(transactionsl1)
        transactions.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Calculate the total amount of transactions
        const totalTransactions = transactions.reduce((total, transaction) => {
            return total + transaction.transactionAmount.amount;
        }, 0);

        // Calculate the total amount of transactions for the "wholesaler" role
        const totalWholesalerTransactions = transactions.reduce((total, transaction) => {
            if (
                transaction.recipient &&
                transaction.recipient.user.role === 'wholesaler'
            ) {
                return total + transaction.transactionAmount.amount;
            }
            return total;
        }, 0);

        // Calculate the total amount of transactions for the "superadmin" role
        const totalSuperAdminTransactions = transactions.reduce((total, transaction) => {
            if (
                transaction.recipient &&
                transaction.recipient.user.role === 'SuperAdmin'
            ) {
                return total + transaction.transactionAmount.amount;
            }
            return total;
        }, 0);

        res.send({
            totalTransactions,
            totalWholesalerTransactions,
            totalSuperAdminTransactions,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};