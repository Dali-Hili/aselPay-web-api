const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const SIMSchema =  new mongoose.Schema({
    IMSI: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
    },
    activation_date :{
        type: Date,
    },
    MSISDN: {
        type: String,
    },
    IMEI: {
        type: String,
        //required: true,
        unique: true
    },
    ICCID: {
        type: String,
        required: true,
        unique: true
    },
    SN: {
        type: String,
        required: true,
        unique: true
    },
    affectation_date: {
        type: Date
    },
    mvno: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'mvno',
        required: true
    },
    reseller: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'reseller'
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'agent'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'customer'
    }
},{versionKey: false});

module.exports = SIM = PosConnection.model('SIM', SIMSchema);