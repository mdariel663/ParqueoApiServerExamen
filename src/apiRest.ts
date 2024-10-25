import dotenv from "dotenv";
import express, { Request, Response , NextFunction} from "express";
import cors from "cors"
import MiddlewareErrorHandler from "./controllers/middleware/MiddlewareErrors";

// routes
import LogRouter from "./routes/logs";
import UserRouter from "./routes/user";
dotenv.config();

const app = express();
const port = process.env.PORT_SERVER? process.env.PORT_SERVER : 8000;





app.use(express.json());
app.use(cors())
app.use(MiddlewareErrorHandler)
// agregar rutas
app.use("/api/v2/log", LogRouter);
app.use("/api/v2/user", UserRouter);

try{
  app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
  });
} catch (error) {
  console.error("Error inicializando el servidor:", error);
}
