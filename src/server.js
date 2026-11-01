import "dotenv/config"
import sequelize from "./config/database.js"
import { createApp } from './app.js'

const app = createApp()
const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(" Database connected");

    await sequelize.sync();
    console.log(" Models synchronized");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

startServer();
