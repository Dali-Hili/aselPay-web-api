const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const UserSchema =  new mongoose.Schema({
    firstName : {
        type : String,
        maxLength : 25,
        required : true,
    },
    lastName : {
        type : String,
        maxLength : 25,
        required : true
    },
    username : {
        type : String,
        minLength : 3,
        maxLength : 25,
        lowercase : true,
        required : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
    },
    phoneNumber : {
        type : Number,
        validate : {
            validator : number => {
                let re = new RegExp("^"+process.env.COUNTRY_CODE+"[0-9]{"+process.env.PHONE_NUMBER_LENGTH+"}$");
                return re.test(number);
            },
            message : `Phone number should have 11 digits and start with country code ${process.env.COUNTRY_CODE}`
        }
    },
    accountStatus : {
        type : String,
        enum : ["active",'inactive'],
        default : "active"
    },
    passwordExpiryDate : {
        type : Date,
        default : () => {
            const aYearFromNow = new Date();
            aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
            return aYearFromNow
        }
    },
    role : {
        type : String,
        enum : ['admin','wholesaler','retailer','SuperAdmin','sub-wholesaler'],
        required : true,
        immutable : true
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    },
    shopName: {
        type: String,
    },
},{versionKey: false});

module.exports = User = AselPayConnection.model('User', UserSchema);