const { body } = require("express-validator");

const userRegisterValidator = [
  body("username").isString().trim().notEmpty(),
  body("password").isString().trim().notEmpty(),
];

exports.userRegisterValidator = userRegisterValidator;
