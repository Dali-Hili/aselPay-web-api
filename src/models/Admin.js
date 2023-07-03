const mongoose = require('mongoose');
const {AselPayConnection, PosConnection} = require('../../config/MultipleConnectionDb');

const AdminSchema =  new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
},{versionKey: false});

module.exports = Admin = AselPayConnection.model('Admin', AdminSchema);