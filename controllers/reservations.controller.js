const { default: mongoose } = require("mongoose");
const reservationSchema = require("../models/reservation.model");
const HttpError = require("../models/http-error");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const { query, validationResult } = require("express-validator");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

const generateQRCode = async (text, outputPath) => {
  try {
    await QRCode.toFile(outputPath, text);
    console.log("QR code generated successfully.");
  } catch (err) {
    const error = new HttpError(
      "Eroare la generarea codului QR. Rezervarea dumneavoastra a fost salvata. Va rog sa ne contactati pentru a rezolva aceasta problema.",
      500
    );
    return next(error);
  }
};

const transporterSyncMail = async (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      }
      console.log(info);
      resolve();
    });
  });
};

const sendEmail = async (
  recipientEmail,
  subject,
  text,
  attachmentPath,
  next
) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: recipientEmail,
    subject: subject,
    html: `
        <p>${text}</p>
        <p><img src="cid:qrcode@nodemailer" alt="QR Code" /></p>
      `,
    attachments: [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
        cid: "qrcode@nodemailer", // Setting a CID for embedding in HTML
      },
    ],
  };

  try {
    await transporterSyncMail(mailOptions);
  } catch (err) {
    const error = new HttpError(
      "Eroare la generarea codului QR. Rezervarea dumneavoastra a fost salvata. Va rog sa ne contactati pentru a rezolva aceasta problema.",
      500
    );
    throw error;
  }
};

const reserveEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Datele introduse nu sunt valide", 400);
    return next(error);
  }

  const bodyData = req.body;
  const collectionName = bodyData.dbTitle;

  try {
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionExists = collections.some(
      (collection) =>
        collection.name.toLowerCase() === (collectionName + "s").toLowerCase()
    );

    if (collectionExists) {
      const count = await mongoose.connection.db
        .collection(collectionName)
        .countDocuments();
      if (count >= bodyData.maximumCapacity) {
        const error = new HttpError(
          "S-a atins numarul maxim de rezervari",
          400
        );
        return next(error);
      }
    }

    const DynamicReservationModel = mongoose.model(
      bodyData.dbTitle,
      reservationSchema
    );

    const reservation = new DynamicReservationModel({
      firstName: bodyData.firstName,
      lastName: bodyData.lastName,
      email: bodyData.email,
      phone: bodyData.phone,
      age: bodyData.age,
      eventType: bodyData.eventType,
    });

    await reservation.save();

    if (bodyData.eventType.toLowerCase().trim() === "spectacol") {
      const qrText = process.env.QR_LINK + reservation.id;
      const outputPath = path.join(
        __dirname,
        `${bodyData.dbTitle}-${bodyData.email}.png`
      );
      await generateQRCode(qrText, outputPath);

      const subject = `Rezervare ${bodyData.title}`;
      const text = `Codul QR pentru spectacolul: ${bodyData.title}`;

      const mailOptions = {
        from: process.env.EMAIL,
        to: bodyData.email,
        subject: subject,
        html: `
            <p>${text}</p>
            <p><img src="cid:qrcode@nodemailer" alt="QR Code" /></p>
          `,
        attachments: [
          {
            filename: path.basename(outputPath),
            path: outputPath,
            cid: "qrcode@nodemailer", // Setting a CID for embedding in HTML
          },
        ],
      };

      await transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          throw error;
        } else {
          console.log(info);
          reservation.codeGenerated = true;
          await reservation.save();

          fs.unlinkSync(outputPath);

          res
            .status(200)
            .json({ message: "Rezervarea s-a realizat cu succes!" });
        }
      });
    }
  } catch (err) {
    let error;
    if (err.code && err.code === 11000) {
      error = new HttpError(
        "Exista deja o rezervare pentru acest spectacol cu aceasta adresa de mail!",
        400
      );
    } else {
      error = new HttpError(
        "Eroare necunoscuta. Va rugam sa reincercati!",
        500
      );
    }
    return next(error);
  }
};

exports.reserveEvent = reserveEvent;
