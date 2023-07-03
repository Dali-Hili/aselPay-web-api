const { check, body } = require("express-validator");

exports.validRetailer = [
    check("reductionPercentage")
        .if(body("reductionPercentage")
        .notEmpty())
        .isFloat({min : 0, max : 100})
        .withMessage("Le pourcentage de réduction doit être entre 0 et 100%"),

];