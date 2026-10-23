import "dotenv/config"
import express from 'express'
import sequelize from "./config/database.js"
import cookieParsar from 'cookie-parser' 
import authRoute from "./Route/authRoutes.js" 

const app = express()
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express.json())
app.use(cookieParsar())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth",authRoute)

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
  }
}

startServer();
