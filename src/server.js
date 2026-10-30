import "dotenv/config"
import express from 'express'

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js"

import sequelize from "./config/database.js"

import cookieParser from 'cookie-parser' 

import authRoute from "./Route/authRoutes.js" 
import userRoute from "./Route/userRoutes.js"
import studentRoute from "./Route/studentRoutes.js"

const app = express()
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API endpoints
app.use("/api/auth", authRoute)
app.use("/api/users", userRoute)
app.use("/api/students", studentRoute)

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(" Database connected");

    await sequelize.sync();
    console.log(" Models synchronized");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(`swagger:http://localhost:${PORT}/api-docs`)
    });
  } catch (error) {
    console.error(error);
  }
}

startServer();
