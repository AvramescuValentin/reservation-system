const { body } = require("express-validator");

const reservationValidator = [
  body("dbTitle")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Event db title missing"),
  body("title").isString().trim().notEmpty().withMessage("Event title missing"),
  body("firstName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("First name is missing"),
  body("lastName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Last name is missing"),
  body("phone")
    .isString()
    .trim()
    .notEmpty()
    .isLength(10)
    .withMessage("Incorrect phone number"),
  body("age")
    .notEmpty()
    .isNumeric({ min: 5, max: 100 })
    .withMessage("Incorrect age"),
  body("email").trim().notEmpty().isEmail().withMessage("Incorrect email"),
  body("eventType")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Missing event type"),
];

module.exports = reservationValidator;
