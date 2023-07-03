const { check, body } = require("express-validator");

exports.validTransaction = [
    check("level")
        .notEmpty()
        .isIn([1,2,3])
        .withMessage("Le niveau de la transaction doit être 1, 2 ou 3"),
    check("sender")
        .notEmpty()
        .withMessage("L'expéditeur est obligatoire"),
    check("recipient")
        .notEmpty()
        .withMessage("Le destinataire est obligatoire"),
    body("transactionAmount.amount")
        .if(body('level').isIn([1]))
        .isFloat({min : 1, max : process.env.TRANSACTION_LIMIT_L1  })
        .withMessage(`Le montant de la transaction doit être entre 1 et ${process.env.TRANSACTION_LIMIT_L1} ${process.env.CURRENCY}`)
        .if(body('level').isIn([2]))
        .isFloat({min : 1, max : process.env.TRANSACTION_LIMIT_L2  })
        .withMessage(`Le montant de la transaction doit être entre 1 et ${process.env.TRANSACTION_LIMIT_L2} ${process.env.CURRENCY}`),
    check("transactionAmount.unit")
        .notEmpty()
        .withMessage("L'unité de la transaction (devise) est obligatoire")
        .isIn([`${process.env.CURRENCY}`])
        .withMessage(`La transaction doit être en ${process.env.CURRENCY}`),
];
