const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  age: { type: Number },
  email: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  validated: { type: Boolean, default: false },
  codeGenerated: { type: Boolean, default: false },
});

module.exports = reservationSchema;
