
import "dotenv/config"
import sequelize from "./config/database.js"
import { createApp } from './app.js'

const app = createApp()
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let connected = false;

    for (let i = 1; i <= 10; i++) {
      try {
        await sequelize.authenticate();
        connected = true;
        console.log("Database connected");
        break;
      } catch (error) {
        console.log(`Database connection attempt ${i}/10 failed`);

        if (i === 10) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (!connected) {
      throw new Error("Database connection failed");
    }

    await sequelize.sync();
    console.log("Models synchronized");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

startServer();
