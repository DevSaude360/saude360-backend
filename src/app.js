require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes      = require("./routes/auth");
const deepseekRoutes  = require("./routes/deepseek");
const consultasRoutes = require("./routes/consultas");
const pacientesRoutes = require("./routes/pacientes");
const medicosRoutes   = require("./routes/medicos");
const examesRoutes    = require("./routes/exames");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth",      authRoutes);
app.use("/deepseek",  deepseekRoutes);
app.use("/consultas", consultasRoutes);
app.use("/pacientes", pacientesRoutes);
app.use("/medicos",   medicosRoutes);
app.use("/exames",    examesRoutes);

app.get("/", (req, res) => res.send("Saúde360 API Running!"));

module.exports = app;
