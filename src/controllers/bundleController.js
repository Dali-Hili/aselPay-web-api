const mongoose = require('mongoose');

const MVNO = require("../models/MVNO");
const Bundle = require("../models/Bundle");

//returns all mvnos
exports.getBundlesbyMVNO = async (req, res) => {
    try{
        const mvno_id = req.params.mvno_id;
        let bundles = await MVNO
        .findById(mvno_id)
        .populate('bundles')
        .select('bundles')
        .sort({'createdAt': 1})
        res.send(bundles)
    }catch(error){
        console.error(error);
        res.status(500).json({ msg: "Une erreur s'est produite!" });
    }
}
