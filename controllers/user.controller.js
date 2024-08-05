const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(JSON.stringify(errors.errors));
    if (!errors.isEmpty()) {
      const error = new HttpError(`Datele introduse nu sunt valide`, 400);
      return next(error);
    }

    const bodyData = req.body;

    existingUser = await User.findOne({ username: bodyData.username });

    if (!existingUser) {
      const error = new HttpError("Invalid credentials.", 401);
      return next(error);
    }

    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(
        bodyData.password,
        existingUser.password
      );
    } catch (err) {
      const error = new HttpError("Invalid credentials.", 500);
      return next(error);
    }
    if (!isValidPassword) {
      const error = new HttpError("Invalid credentials.", 401);
      return next(error);
    }

    let token;
    try {
      token = jwt.sign({ userId: existingUser.id }, process.env.TOKEN_SECRET, {
        expiresIn: "12h",
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Creating a new user failed. Please try again later",
        500
      );
      return next(error);
    }

    res.json({ message: "Logged in!", userId: existingUser.id, token: token });
  } catch (err) {
    const error = new HttpError(`Eroare neasteptata`, 500);
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log(JSON.stringify(errors.errors));
    if (!errors.isEmpty()) {
      const error = new HttpError(`Datele introduse nu sunt valide`, 400);
      return next(error);
    }

    const bodyData = req.body;

    try {
      existingUser = await User.findOne({ username: bodyData.username });
    } catch (err) {
      const error = new HttpError(
        "Sign up failed. Please try again later.",
        500
      );
      return next(error);
    }

    if (existingUser) {
      const error = new HttpError(
        "This Email is already in use. Please log in instead.",
        422
      );
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(bodyData.password, 12);

    const createdUser = new User({
      username: bodyData.username,
      password: hashedPassword,
    });

    await createdUser.save();

    let token;
    try {
      token = jwt.sign({ userId: createdUser.id }, process.env.TOKEN_SECRET, {
        expiresIn: "12h",
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Creating a jwtoken. Please try again later",
        500
      );
      return next(error);
    }

    res.status(201).json({
      status: "User registered",
      userId: createdUser.id,
      token: token,
    });
  } catch (err) {
    const error = new HttpError(`Eroare neasteptata`, 500);
    return next(error);
  }
};

exports.login = login;
exports.register = register;
