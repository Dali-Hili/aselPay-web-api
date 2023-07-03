const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const PriceSchema = new mongoose.Schema({
    amount : {
        type : Number,
        required : true
    },
    unit : {
        type : String,
        enum : [`${process.env.CURRENCY}`],
        required : true
    }
},{versionKey: false,  _id : false });

const validitySchema = new mongoose.Schema({
    number : Number,
    unit : {
        type : String,
        enum : ["Months","Days","Hours"],
        required : true,
    }
},{versionKey: false,  _id : false });

const BundleContentSchema = new mongoose.Schema({
    data : {
        amount : {
            type : Number,
            required : true,
            default : 0,
            min : 0,
        },
        unit : {
            type : String,
            default : 'Megabytes',
            enum : ['Megabytes','Gigabytes']
        }
    },
    voice : {
        amount : {
            type : Number,
            required : true,
            default : 0,
            min : 0,
        },
        unit : {
            type : String,
            default : 'Minutes',
            enum : ['Minutes','Hours']
        }
    },
    sms : {
        type : Number, //number of sms
        required : true,
        default : 0
    },
},{versionKey: false,  _id : false });


const BundleSchema =  new mongoose.Schema({
    bundleId : {
        type : Number,
        required : true,
    },
    name : {
        type : String,
        required : true
    },
    content : {
        type : BundleContentSchema,
        required : true
    },
    price : {
        type : PriceSchema,
        required : true,
    },
    validity : { //months and/or days and/or hours
        type : validitySchema,
        required : true,
    },
    validityStartDate : {
        type : Date,
        required : true,
        default : () => new Date()
    },
    validityEndDate : {
        type : Date,
    },
    createdAt : {
        type : Date,
        default : () => new Date(),
        immutable : true
    },
},{versionKey: false});

module.exports = Bundle = AselPayConnection.model('Bundle', BundleSchema);


