const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  hashPassword,
  validatePassword,
} = require("../helpers/authHelperFunctions");

const User = require("../models/User");
const Wholesaler = require("../models/Wholesaler");
const subWholesaler = require("../models/subWholesaler");
const Retailer = require("../models/Retailer");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
exports.getCurrentUser = async (req, res) => {
  try {
    res.send(true);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

const registerUser = async ({
  firstName,
  lastName,
  username,
  password,
  phoneNumber,
  accountStatus,
  passwordExpiryDate,
  role,
  shopName,
  wholesaler,
  subWholesaler,
}) => {
  try {
    //verify that username is unique
    const exists = await User.exists({ username });
    if (exists) {
      return { error: { code: 400, message: "Ce nom d'utilisateur existe" } };
    }
    //hash password
    const hashedPassword = await hashPassword(password);
    //create user
    let user = new User({
      firstName,
      lastName,
      username,
      phoneNumber,
      password: hashedPassword,
      role,
      shopName,
      wholesaler,
      subWholesaler,
    });
    console.log(user);
    //add optional user fields
    if (accountStatus) user.accountStatus = accountStatus;
    if (passwordExpiryDate)
      user.passwordExpiryDate = new Date(passwordExpiryDate);
    //save user to DB
    await user.save();
    //return user _id
    return user._id;
  } catch (error) {
    console.error(error.message);
    return {
      error: { code: 500, message: "Impossible d'ajouter l'utilisateur!" },
    };
  }
};

exports.registerRetailer = async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //verify the wholesaler exists
    let parentWholesaler = await Wholesaler.findById(req.body.wholesaler);
    console.log(parentWholesaler);
    if (!parentWholesaler) {
      parentWholesaler = await subWholesaler.findById(req.body.SubWholesaler);
      if (!parentWholesaler) {
        res.status(400).json({ msg: "Le commercial demandé n'existe pas" });
        return;
      }
    }
    //register the user
    let user_id = await registerUser({ ...req.body, role: "retailer" });
    if (user_id.error) {
      res.status(user_id.error.code).json({ msg: user_id.error.message });
      return;
    }
    //register the retailer with the user information
    if (req.body.wholesaler) {
      let retailer = new Retailer({
        user: user_id,
        wholesaler: parentWholesaler._id,
        allowedBundlesByMVNO: req.body.allowedBundlesByMVNO,
      });
      if (req.body.reductionPercentage)
        retailer.reductionPercentage = req.body.reductionPercentage;
      await retailer.save();
      res.send("Point de vente ajouté!");
    } else {
      let retailer = new Retailer({
        user: user_id,
        subWholesaler: parentWholesaler._id,
        allowedBundlesByMVNO,
      });
      if (req.body.reductionPercentage)
        retailer.reductionPercentage = req.body.reductionPercentage;
      await retailer.save();
      res.send("Point de vente ajouté!");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.registerWholesaler = async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //register the user
    let user_id = await registerUser({ ...req.body, role: "wholesaler" });
    if (user_id.error) {
      res.status(user_id.error.code).json({ msg: user_id.error.message });
      return;
    }
    //register the wholesaler with the user information
    let wholesaler = new Wholesaler({
      user: user_id,
    });
    await wholesaler.save();
    res.send("Commercial ajouté");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.registerSubWholesaler = async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    let wholesaler = await Wholesaler.findById(req.body.wholesaler);
    if (!wholesaler) {
      res.status(400).json({ msg: "Le commercial demandé n'existe pas" });
      return;
    }
    //register the user
    let user_id = await registerUser({ ...req.body, role: "sub-wholesaler" });
    if (user_id.error) {
      res.status(user_id.error.code).json({ msg: user_id.error.message });
      return;
    }
    //register the wholesaler with the user information
    let SubWholesaler = new subWholesaler({
      user: user_id,
      wholesaler: wholesaler._id,
    });
    await SubWholesaler.save();
    res.send("Commercial ajouté");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.registerAdmin = async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //register the user
    let user_id = await registerUser({ ...req.body, role: "admin" });
    if (user_id.error) {
      res.status(user_id.error.code).json({ msg: user_id.error.message });
      return;
    }
    //register the admin with the user information
    let admin = new Admin({
      user: new mongoose.Types.ObjectId(user_id),
    });
    await admin.save();
    res.send("Admin ajouté!");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};

exports.registerSuperAdmin = async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    //register the user
    let user_id = await registerUser({ ...req.body, role: "SuperAdmin" });
    if (user_id.error) {
      res.status(user_id.error.code).json({ msg: user_id.error.message });
      return;
    }
    //register the super admin with the user information
    let superAdmin = new SuperAdmin({
      user: new mongoose.Types.ObjectId(user_id),
    });
    await superAdmin.save();
    res.send("Super Admin ajouté!");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};
exports.login = async (req, res) => {
  console.log("backend reached");
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors = errors.array().map((e) => e.msg);
    return res.status(400).json({ errors });
  }
  try {
    let { username, password } = req.body;
    //find the user in the DB
    username = username.toLowerCase();
    let user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ msg: "Cet utilisateur n'existe pas" });
      return;
    }
    //the user is found, compare the passwords
    const isMatch = await validatePassword(password, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Mot de passe incorrect" });
      return;
    }
    //the passwords match, verify that the account is active
    let isActive = new Date(user.passwordExpiryDate) >= new Date();
    //if the account is inactive, set the account status field to inactive
    if (!isActive) {
      user.accountStatus = "inactive";
      await user.save();
      res
        .status(400)
        .json({
          msg: "Votre compte est inactif. Veuillez contacter Cayon Cloud pour le réactiver.",
        });
      return;
    }
    let details;
    if (user.role == "retailer") {
      details = await Retailer.findOne({ user: user._id });
    }
    if (user.role == "wholesaler") {
      details = await Wholesaler.findOne({ user: user._id });
    }
    if (user.role == "admin") {
      details = await Admin.findOne({ user: user._id });
    }
    if (user.role == "SuperAdmin") {
      details = await SuperAdmin.findOne({ user: user._id });
    }
    if (user.role == "sub-wholesaler") {
      details = await subWholesaler.findOne({ user: user._id });
    }
    //proceed to login
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 18000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneNumber: user.phoneNumber,
            _id: details._id,
          },
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: "Une erreur s'est produite!" });
  }
};
