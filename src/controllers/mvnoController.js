const mongoose = require('mongoose');

const MVNO = require("../models/MVNO");

//returns all mvnos
exports.getAllMVNOs = async (req, res) => {
    try{
        const mvnos = await MVNO
        .find()
        .select(['name','id','allowTopups', 'bundles','logoURL'])
        res.send(mvnos);
    }catch(error){
        console.error(error);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}

//returns all available mvnos
exports.getAvailableMVNOs = async (req, res) => {
    try{
        console.log("here");
        const mvnos = await MVNO
        .find({allowTopups : true})
        .select(['name','id','allowTopups', 'bundles','logoURL'])
        res.send(mvnos);
    }catch(error){
        console.error(error);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}