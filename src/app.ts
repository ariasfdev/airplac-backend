import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import stockRoutes from "./routes/stockRoutes";
import vendedoresRoutes from "./routes/vendedoresRoutes";
import pedidosRoutes from "./routes/pedidosRoutes";
import modelosRoutes from "./routes/modelosRoutes";
import productosRoutes from "./routes/productosRoutes";
import path from "path";
// import pedidosRoutes from './routes/pedidosRoutes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*", // Para pruebas, luego podés limitarlo al dominio de tu web
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// Rutas
app.use("/api/stock", stockRoutes);
app.use("/api/vendedores", vendedoresRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/modelos", modelosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export default app;
