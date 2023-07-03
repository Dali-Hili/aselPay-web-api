const { check, body } = require("express-validator");

exports.validPayment = [
    check("level")
        .notEmpty()
        .isIn([1,2,3])
        .withMessage("Le niveau du paiement doit être 1, 2 ou 3"),
    check("sender")
        .notEmpty()
        .withMessage("L'expéditeur est obligatoire"),
    check("recipient")
        .notEmpty()
        .withMessage("Le destinataire est obligatoire"),
    check("paymentAmount.amount")
        .isFloat({min : 1})
        .withMessage(`Le montant du paiement est invalide`),
    check("paymentAmount.unit")
        .notEmpty()
        .withMessage("L'unité du paiement (devise) est obligatoire")
        .isIn([`${process.env.CURRENCY}`])
        .withMessage(`Le paiement doit être en ${process.env.CURRENCY}`),
];
