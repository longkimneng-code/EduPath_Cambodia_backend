import swaggerJsdoc from "swagger-jsdoc"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const authRouteFile = path.resolve(__dirname, "../Route/authRoutes.js")
const userRouteFile = path.resolve(__dirname, "../Route/userRoutes.js")
const studentRouteFile = path.resolve(__dirname, "../Route/studentRoutes.js")

const swaggerOptions = {
    definition: {
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        openapi: "3.0.0",
        info: {
            title: "EduPath Cambodia API",
            version: "1.0.0",
            description: "EduPath Cambodia Backend API Documentation"
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`
            }
        ]
    },
    apis: [authRouteFile, userRouteFile, studentRouteFile]
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

console.log("Swagger detected paths:", Object.keys(swaggerSpec.paths || {}))

export default swaggerSpec
