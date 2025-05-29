require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authenticationRoutes      = require("./routes/authentication");
const credentialRoutes      = require("./routes/credential");
const deepseekRoutes  = require("./routes/deepseek");
const appointmentRoutes = require("./routes/appointment");
const patientRoutes = require("./routes/patient");
const professionalRoutes   = require("./routes/professional");
const examesRoutes    = require("./routes/exames");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/authentication", authenticationRoutes);
app.use("/credentials", credentialRoutes);
app.use("/deepseek", deepseekRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/patient", patientRoutes);
app.use("/professionals", professionalRoutes);
app.use("/exames",    examesRoutes);

app.get("/", (req, res) => res.send("Saúde360 API Running!"));

module.exports = app;
