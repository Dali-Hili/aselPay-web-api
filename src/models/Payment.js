const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const PaymentAmountSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        min : 1,
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

const PaymentSchema =  new mongoose.Schema({
    level : {
        type : Number,
        enum : [1,2,3]
    },
    sender : {
        type: mongoose.Schema.Types.ObjectId,
        required : true
    },
    recipient : {
        type: mongoose.Schema.Types.ObjectId,
        required : true
    },
    paymentAmount : {
        type : PaymentAmountSchema,
        required : true,
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    }
},{versionKey: false});

module.exports = Payment = AselPayConnection.model('Payment', PaymentSchema);