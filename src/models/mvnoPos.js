const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const MVNOSchema =  new mongoose.Schema({
    api_login: {
        type: String,
        required: true,
        unique: true
    },
    api_password: {
        type: String,
        required: true,
    },
    name :{
        type: String,
        required: true,
        unique: true
    },
    currency_id: {
        type: Number
    },
    id: {
        type: Number,
        unique: true,
        required: true,
    }
},{versionKey: false});

module.exports = MVNO = PosConnection.model('mvno', MVNOSchema);