const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const balanceSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        default : 0,
        min : 0,
        max : process.env.RETAILER_BALANCE_LIMIT,
    },
    unit : {
        type : String,
        enum : [`${process.env.CURRENCY}`],
        required : true,
        default : `${process.env.CURRENCY}`,
    }
},{versionKey: false,  _id : false });

const transactionsSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        default : 0,
        min : 0,
    },
    unit : {
        type : String,
        enum : [`${process.env.CURRENCY}`],
        required : true,
        default : `${process.env.CURRENCY}`,
    }
},{versionKey: false,  _id : false });

const RetailerSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true,
    },
    balance : {
        type : balanceSchema,
        default : {
            amount : 0,
            unit : `${process.env.CURRENCY}`
        }
    },
    totalTransactions : {
        type : transactionsSchema,
        default : {
            amount : 0,
            unit : `${process.env.CURRENCY}`
        }
    },
    totalPayments : {
        type : transactionsSchema,
        default : {
            amount : 0,
            unit : `${process.env.CURRENCY}`
        }
    },
    unpaid : {
        type : balanceSchema,
        default : {
            amount : 0,
            unit : `${process.env.CURRENCY}`
        }
    },
    reductionPercentage : {
        type : Number,
        required : true,
        min : 0,
        max : 100,
        default : 0
    },
    wholesaler : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Wholesaler'
    },
    subWholesaler : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'sub-Wholesaler'
    },
    allowedBundlesByMVNO : {
            type : [String],
            enum : ["Asel","Tunivisions Mobile","Alpha"],
        }

},{versionKey: false});

module.exports = Retailer = AselPayConnection.model('Retailer', RetailerSchema);