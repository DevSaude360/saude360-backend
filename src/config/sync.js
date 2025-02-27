const sequelize = require("./database");
const User = require("../models/User");

sequelize
  .sync({ force: true }) // Isso recria as tabelas sempre que o servidor inicia (remova em produção)
  .then(() => console.log("Banco de dados sincronizado!"))
  .catch((err) => console.error("Erro ao sincronizar:", err));
