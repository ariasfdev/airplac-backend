import { Router } from "express";
import {
  getAllStocks,
  createStock,
  getStockById,
  updateStock,
  deleteStock,
  getAllStocksImportacion,
  agregarProduccion,
  registrarEntrega,
  obtenerProduccionesPorStock,
  normalizarStock,
  actualizarStock,
} from "../controller/stockController";

const router = Router();

// Stock endpoints
router.get("/norma", normalizarStock); // Coloca las rutas específicas primero
router.get("/", getAllStocks);
router.post("/", createStock);
router.get("/:id", getStockById); // Las rutas dinámicas van después
router.get("/importacion/:idVendedor", getAllStocksImportacion);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

// Producción endpoints
router.post("/actualizar-stock", actualizarStock);
router.post("/produccion", agregarProduccion);
router.put("/produccion/entrega", registrarEntrega);
router.get("/produccion/:idStock", obtenerProduccionesPorStock);

export default router;
