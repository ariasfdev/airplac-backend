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
  bulkCreateStock,
  refrescar, // Importa la nueva función
} from "../controller/stockController";

const router = Router();

// Stock endpoints
router.get("/norma", normalizarStock); // Rutas específicas primero
router.get("/", getAllStocks);
router.post("/", createStock);
router.get("/:id", getStockById); // Rutas dinámicas después
router.get("/importacion/:idVendedor", getAllStocksImportacion);
router.put("/:id", updateStock);
router.delete("/:id", deleteStock);

// Endpoint para creación masiva de stocks
router.post("/bulk", bulkCreateStock);
router.post("/refrescar", refrescar);

// Producción endpoints
router.post("/actualizar-stock", actualizarStock);
router.post("/produccion", agregarProduccion);
router.put("/produccion/entrega", registrarEntrega);
router.get("/produccion/:idStock", obtenerProduccionesPorStock);

export default router;
