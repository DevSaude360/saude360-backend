const sequelize = require("./database");

sequelize
  .sync({ force: true }) // (remova em produção)
  .then(() => console.log("Banco de dados sincronizado!"))
  .catch((err) => console.error("Erro ao sincronizar:", err));
