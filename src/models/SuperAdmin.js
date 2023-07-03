const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const balanceSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        default : 0,
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
const SuperAdminSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
},{versionKey: false});

module.exports = Admin = AselPayConnection.model('SuperAdmin', SuperAdminSchema);