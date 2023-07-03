const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const reloadAmountSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true,
        min : 1,
        max : process.env.TOPUP_LIGHT_LIMIT,
        immutable : true
    },
    unit : {
        type : String,
        enum : ["Dinars"],
        required : true,
        default : "Dinars",
        immutable : true,
    }
},{versionKey: false,  _id : false });
        
const TopupLightSchema =  new mongoose.Schema({
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
    reloadAmount : {
        type : reloadAmountSchema, 
        required : true,
    },
    MVNO : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MVNO',
        required: true,
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    }
},{versionKey: false});

module.exports = TopupLight = AselPayConnection.model('TopupLight', TopupLightSchema);