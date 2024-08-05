const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user.controller");
const userValidator = require("../validators/users.validator");

const router = express.Router();

router.post(
  "/register",
  userValidator.userRegisterValidator,
  userController.register
);

router.post("/login", userController.login);

module.exports = router;
