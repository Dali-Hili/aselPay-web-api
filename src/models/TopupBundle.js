const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const TopupBundleSchema =  new mongoose.Schema({
    retailer : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Retailer',
        required: true,
    },
    MSISDN : {
        type :  String,
        required  : true,
        validate : {
            validator : number => {
                let re = new RegExp("^"+process.env.COUNTRY_CODE+"[0-9]{"+process.env.PHONE_NUMBER_LENGTH+"}$");
                return re.test(number);
            },
            message : `Phone number must have 11 digits and start with country code ${process.env.COUNTRY_CODE}`
        }
    },
    SN : {
        type : String,
        resuired : true
    },
    bundle : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bundle',
        required: true,
    },
    MVNO : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MVNO',
        required: true,
    },
    topupId : {
        type : String,
        required : true,
        unique : true,
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    }
},{versionKey: false});

module.exports = TopupBundle = AselPayConnection.model('TopupBundle', TopupBundleSchema);