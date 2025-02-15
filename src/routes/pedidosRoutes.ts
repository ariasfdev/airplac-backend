import { Router } from "express";
import {
  getPedidos,
  createPedido,
  uploadRemito,
  getRemito,
  cambiarEstadoAEntregado,
  updatePedido, // ✅ Importar la nueva función
} from "../controller/pedidosController";

const router = Router();

// Endpoints existentes
router.get("/", getPedidos);
router.post("/", createPedido);
router.post("/:id/remito", uploadRemito);
router.get("/remito/:filename", getRemito);
router.put("/entregado/:id", cambiarEstadoAEntregado);

// ✅ Nuevo endpoint para editar un pedido
router.put("/editar/:id", updatePedido);

export default router;
