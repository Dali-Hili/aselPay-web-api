const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const TransactionAmountSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        min : 1,
        max : process.env.TRANSACTION_LIMIT_L1,
        immutable : true
    },
    unit : {
        type : String,
        enum : [`${process.env.CURRENCY}`],
        required : true,
        default : `${process.env.CURRENCY}`,
        immutable : true,
    }
},{versionKey: false,  _id : false });

const TransactionSchema =  new mongoose.Schema({
    level : {
        type : Number,
        enum : [1,2,3,4]
    },
    sender : {
        type: mongoose.Schema.Types.ObjectId,
        required : true
    },
    recipient : {
        type: mongoose.Schema.Types.ObjectId,
        required : true
    },
    transactionAmount : {
        type : TransactionAmountSchema,
        required : true,
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    }
},{versionKey: false});

module.exports = Transaction = AselPayConnection.model('Transaction', TransactionSchema);