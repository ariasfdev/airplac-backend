import { Router } from "express";
import { inicializarModelos, obtenerModelos, editarModelo,nuevoModelo } from "../controller/modelosController";

const router = Router();

router.post("/inicializar", inicializarModelos);
router.get("/", obtenerModelos);
router.put("/:id", editarModelo);
router.post("/",nuevoModelo);

export default router;
