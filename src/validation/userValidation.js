const { check, body } = require("express-validator");

exports.validRegister = [
    check("firstName")
        .notEmpty()
        .isLength({max : 25})
        .withMessage("Le prénom doit contenir entre 1 et 25 caractères"),
    check("lastName")
        .notEmpty()
        .isLength({max : 25})
        .withMessage("Le nom doit contenir entre 1 et 25 caractères"),
    check("username")
        .notEmpty()
        .isLength({min : 3, max : 25})
        .withMessage("Le nom d'utilisateur doit contenir entre 3 et 25 caractères")
        .trim()
        .custom(value => !/\s/.test(value))
        .withMessage("Le nom d'utilisateur ne peut pas contenir des espaces"),
    check("password")
        .notEmpty()
        .isLength({min : 6 , max : 25})
        .withMessage("Le mot de passe doit contenir entre 6 et 25 caractères")
        .matches(/\d/)
        .withMessage("Le mot de passe doit comporter un chiffre"),
    check("phoneNumber")
        .custom(number => {
            let re = new RegExp("^"+process.env.COUNTRY_CODE+"[0-9]{"+process.env.PHONE_NUMBER_LENGTH+"}$");
            return re.test(number);
        })
        .withMessage(`Le numéro de téléphone doit comporter 11 chiffres et commencer par ${process.env.COUNTRY_CODE}`),
    check("accountStatus")
        .if(body("accountStatus").notEmpty())
        .isIn(["active","inactive"])
        .withMessage("Le statut du compte doit être 'active' ou 'inactive'"),
    check("passwordExpiryDate")
        .if(body("passwordExpiryDate").notEmpty())
        .isDate()
        .withMessage("La date d'expiration du mot de passe est invalide")

];

exports.validLogin = [
    check("username")
        .notEmpty()
        .withMessage("Le nom d'utilisateur est obligatoire"),
    check("password")
        .notEmpty()
        .withMessage("Le mot de passe est obligatoire")
]