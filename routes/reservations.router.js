const express = require("express");
const { body } = require("express-validator");

const reservationController = require("./../controllers/reservations.controller");
const reservationValidator = require("../validators/reservation.validator");

const router = express.Router();

router.post(
  "/reserve-event",
  reservationValidator,
  reservationController.reserveEvent
);

router.get(
  "/:dbTitle",
  reservationValidator,
  reservationController.getAvailableSlots
);

module.exports = router;
