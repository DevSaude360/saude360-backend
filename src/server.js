require("dotenv").config();

const app       = require("./app");
const sequelize = require("./config/database");

const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer(port) {
  try {
    await sequelize.sync({
      force: process.env.NODE_ENV === "development",
    });
    console.log("Banco de dados sincronizado!");

    const server = app.listen(port, () => {
      console.log(`Server rodando na porta ${port}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(
            `Porta ${port} em uso, tentando a próxima (${port + 1})…`
        );
        startServer(port + 1);
      } else {
        console.error("Erro no servidor:", err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error("Falha ao sincronizar o banco:", err);
    process.exit(1);
  }
}

startServer(INITIAL_PORT);
