import { Request, Response } from "express";
import Stock from "../models/stockModel";
import Produccion from "../models/produccionModel";
import Pedido from "../models/pedidosModel";

export const getAllStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stocks = await Stock.find(); // Selecciona solo producto y modelo
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los stocks", error });
  }
};
export const getAllStocksImportacion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Obtener el idVendedor de los parámetros de la solicitud
    const { idVendedor } = req.params;

    // Validar que se proporcione un idVendedor
    if (!idVendedor) {
      res
        .status(400)
        .json({ message: "El parámetro idVendedor es obligatorio" });
      return;
    }

    // Validar el formato del idVendedor
    if (!idVendedor.match(/^[0-9a-fA-F]{24}$/)) {
      res
        .status(400)
        .json({ message: "El idVendedor proporcionado no es válido" });
      return;
    }

    // Obtener los stocks de la base de datos
    const stocks = await Stock.find({}, { modelo: 1, _id: 1, idModelo: 1 }); // Selecciona solo modelo y _id

    // Agregar el campo idVendedor a cada registro
    const stocksConVendedor = stocks.map((stock) => ({
      ...stock.toObject(), // Convertir el documento a un objeto plano
      idVendedor, // Agregar el campo idVendedor
    }));

    // Enviar la respuesta
    res.json(stocksConVendedor);
  } catch (error) {
    console.error("Error al obtener los stocks:", error);
    res.status(500).json({ message: "Error al obtener los stocks", error });
  }
};

export const createStock = async (req: Request, res: Response) => {
  try {
    console.log("Datos recibidos:", req.body); // ✅ Verifica los datos que llegan al backend

    const newStock = new Stock(req.body);
    await newStock.save();
    res
      .status(201)
      .json({ message: "Stock creado con éxito", stock: newStock });
  } catch (error: any) {
    console.error("Error al crear el stock:", error);
    res
      .status(400)
      .json({ message: "Error al crear el stock", error: error.message }); // ✅ Envía el mensaje exacto del error
  }
};

export const getStockById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404).json({ message: "Stock no encontrado" });
      return;
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el stock", error });
  }
};

export const updateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updatedStock = await Stock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStock) {
      res.status(404).json({ message: "Stock no encontrado" });
      return;
    }
    res.json({ message: "Stock actualizado con éxito", stock: updatedStock });
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar el stock", error });
  }
};

export const deleteStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deletedStock = await Stock.findByIdAndDelete(req.params.id);
    if (!deletedStock) {
      res.status(404).json({ message: "Stock no encontrado" });
      return;
    }
    res.json({ message: "Stock eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el stock", error });
  }
};
export const agregarProduccion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { idStock, cantidad, responsable } = req.body;

  try {
    // Agregar la producción
    const nuevaProduccion = await Produccion.create({
      idStock,
      fecha: new Date(),
      cantidad,
      responsable,
    });

    // Actualizar cantidad_actual en la colección stock
    await Stock.findByIdAndUpdate(
      idStock,
      { $inc: { cantidad_actual: cantidad } }, // Incrementar cantidad_actual
      { new: true }
    );

    res.status(201).json({
      message: "Producción registrada correctamente",
      produccion: nuevaProduccion,
    });
  } catch (error) {
    console.error("Error al agregar producción:", error);
    res.status(500).json({ message: "Error al agregar producción", error });
  }
};
export const registrarEntrega = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { idStock, cantidadEntregada } = req.body;

  try {
    // Actualizar cantidad_actual en la colección stock
    const stockActualizado = await Stock.findByIdAndUpdate(
      idStock,
      { $inc: { cantidad_actual: -cantidadEntregada } }, // Decrementar cantidad_actual
      { new: true }
    );

    res.status(200).json({
      message: "Entrega registrada correctamente",
      stock: stockActualizado,
    });
  } catch (error) {
    console.error("Error al registrar entrega:", error);
    res.status(500).json({ message: "Error al registrar entrega", error });
  }
};
export const obtenerProduccionesPorStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { idStock } = req.params;

  try {
    const producciones = await Produccion.find({ idStock });
    res.status(200).json(producciones);
  } catch (error) {
    console.error("Error al obtener producciones:", error);
    res.status(500).json({ message: "Error al obtener producciones", error });
  }
};
export const normalizarStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Obtener todos los registros de stock
    const stocks = await Stock.find();

    // Eliminar todas las producciones existentes
    await Produccion.deleteMany({});
    console.log("Todas las producciones anteriores han sido eliminadas.");

    for (const stock of stocks) {
      const idStock = stock._id;

      // Calcular la cantidad total entregada para este idStock
      const pedidosEntregados = await Pedido.aggregate([
        { $unwind: "$productos" }, // Descomponer el array de productos
        { $match: { "productos.idStock": idStock, estado: "entregado" } }, // Filtrar por idStock y estado entregado
        {
          $group: {
            _id: "$productos.idStock",
            totalEntregado: { $sum: "$productos.cantidad" }, // Sumar las cantidades entregadas
          },
        },
      ]);

      const cantidadEntregada =
        pedidosEntregados.length > 0 ? pedidosEntregados[0].totalEntregado : 0;

      // Insertar un registro inicial en la colección Produccion
      await Produccion.create({
        idStock,
        fecha: new Date(),
        cantidad: cantidadEntregada, // Inicializar con la suma entregada
        responsable: "Inicialización automática",
      });
      console.log(
        `Producción inicial creada para idStock ${idStock}: ${cantidadEntregada}`
      );

      // Calcular el nuevo stock actual basado en la producción inicial y entregas
      const cantidadActual = stock.cantidad_actual - cantidadEntregada;
      console.log(
        `idStock: ${idStock}, cantidadEntregada: ${cantidadEntregada}, cantidadActual: ${cantidadActual}`
      );

      // Actualizar el stock en la base de datos
      await Stock.findByIdAndUpdate(
        idStock,
        {
          cantidad_actual: cantidadEntregada,
        },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Producción inicial creada y stock normalizado correctamente.",
    });
  } catch (error) {
    console.error("Error al normalizar el stock:", error);
    res.status(500).json({ message: "Error al normalizar el stock", error });
  }
};
export const actualizarStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { idStock, cantidad, responsable } = req.body;

    if (!idStock || cantidad === undefined || !responsable) {
      res.status(400).json({ message: "Faltan datos requeridos." });
      return;
    }

    // Obtener el registro de stock
    const stock = await Stock.findById(idStock);
    if (!stock) {
      res
        .status(404)
        .json({ message: `Stock con ID ${idStock} no encontrado.` });
      return;
    }

    // Calcular la nueva cantidad actual
    const nuevaCantidadActual = stock.cantidad_actual + cantidad;

    // Insertar un nuevo registro en Produccion
    await Produccion.create({
      idStock,
      fecha: new Date(),
      cantidad,
      responsable,
    });
    console.log(`Producción registrada para idStock ${idStock}: ${cantidad}`);

    // Actualizar la cantidad actual en el registro de Stock
    await Stock.findByIdAndUpdate(
      idStock,
      { cantidad_actual: nuevaCantidadActual },
      { new: true }
    );
    console.log(
      `Stock actualizado para idStock ${idStock}: cantidad_actual = ${nuevaCantidadActual}`
    );

    res.status(200).json({
      message: "Stock actualizado correctamente.",
      nuevaCantidadActual,
    });
  } catch (error) {
    console.error("Error al actualizar el stock:", error);
    res.status(500).json({ message: "Error al actualizar el stock.", error });
  }
};
