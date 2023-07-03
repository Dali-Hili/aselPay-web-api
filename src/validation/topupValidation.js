const { check, body } = require("express-validator");

exports.validTopupBundle = [
    check("bundle_id")
        .notEmpty()
        .withMessage("Le forfait est obligatoire"),
    check("mvno_id")
        .notEmpty()
        .withMessage("Le MVNO est obligatoire"),
    check("retailer_id")
        .notEmpty()
        .withMessage("Le point de vente est obligatoire"),
    check("MSISDN")
        .custom(number => {
            let re = new RegExp("^"+process.env.COUNTRY_CODE+"[0-9]{"+process.env.PHONE_NUMBER_LENGTH+"}$");
            return re.test(number);
        })
        .withMessage(`Le numéro de téléphone doit comporter 11 chiffres et commencer par ${process.env.COUNTRY_CODE}`),
];

exports.validTopupLight = [
    check("mvno_id")
        .notEmpty()
        .withMessage("Le MVNO est obligatoire"),
    check("retailer_id")
        .notEmpty()
        .withMessage("Le point de vente est obligatoire"),
    check("MSISDN")
        .custom(number => {
            let re = new RegExp("^"+process.env.COUNTRY_CODE+"[0-9]{"+process.env.PHONE_NUMBER_LENGTH+"}$");
            return re.test(number);
        })
        .withMessage(`Le numéro de téléphone doit comporter 11 chiffres et commencer par ${process.env.COUNTRY_CODE}`),
    check("reloadAmount.amount")
        .notEmpty()
        .isNumeric({min : 1 , max : process.env.TOPUP_LIGHT_LIMIT})
        .withMessage(`Le montant de la recharge doit être entre 1 et ${process.env.TOPUP_LIGHT_LIMIT} ${process.env.CURRENCY}`),
    check("reloadAmount.unit")
        .notEmpty()
        .isIn([`${process.env.CURRENCY}`])
        .withMessage(`La recharge doit être en ${process.env.CURRENCY}`),
];