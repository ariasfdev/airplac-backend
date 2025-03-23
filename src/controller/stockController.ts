import { Request, Response } from "express";
import Stock from "../models/stockModel";
import Produccion from "../models/produccionModel";
import Pedido from "../models/pedidosModel";
import Modelos from "../models/modelosModel";

export const getAllStocks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Obtener todos los stocks y popular con el modelo asociado
    const stocks = await Stock.find().lean(); // lean() mejora el rendimiento

    // Obtener todos los modelos en un solo query para reducir consultas
    const modelos = await Modelos.find(
      {},
      { _id: 1, placas_por_metro: 1 }
    ).lean();
    const modeloMap = new Map(
      modelos.map((m) => [m._id.toString(), m.placas_por_metro])
    );

    // Añadir la propiedad metros_cuadrados a cada stock
    const stocksConMetrosCuadrados = stocks.map((stock) => {
      const placasPorMetro = modeloMap.get(stock.idModelo?.toString()) || 1; // Evita dividir por 0
      return {
        ...stock,
        metros_cuadrados: stock.cantidad_actual / placasPorMetro,
      };
    });

    res.json(stocksConMetrosCuadrados);
  } catch (error) {
    console.error("❌ Error al obtener los stocks:", error);
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
    console.log("🚀 Iniciando normalización de stock...");

    // 1️⃣ Eliminar todos los registros de Producción
    await Produccion.deleteMany({});
    console.log("✅ Se eliminaron todos los registros de Producción.");

    // 2️⃣ Establecer `cantidad_actual` en 0 para todos los registros de Stock
    await Stock.updateMany(
      {},
      {
        $set: {
          cantidad_actual: 0,
          total_entregado: 0,
          total_fabricado: 0,
          total_reservado: 0,
        },
      }
    );
    console.log(
      "✅ Se reseteó cantidad_actual a 0 en todos los registros de Stock."
    );

    // 3️⃣ Obtener todos los pedidos en estado "entregado"
    const pedidosEntregados = await Pedido.find({ estado: "entregado" });

    const totalPorStock = new Map<string, number>(); // Mapeo de idStock -> total entregado

    for (const pedido of pedidosEntregados) {
      for (const producto of pedido.productos) {
        const idStock = producto.idStock.toString();
        const idModelo = producto.idModelo?.toString(); // 🔹 Obtener el ID del modelo

        // Validar si el modelo existe
        if (!idModelo) {
          console.warn(`⚠ No se encontró idModelo para idStock: ${idStock}`);
          continue; // Saltamos este producto si no tiene modelo
        }

        // Buscar el modelo en la base de datos para obtener `placas_por_metro`
        const modelo = await Modelos.findById(idModelo);
        if (!modelo || typeof modelo.placas_por_metro !== "number") {
          console.warn(
            `⚠ No se encontró modelo válido o placas_por_metro para idStock: ${idStock}`
          );
          continue; // Saltamos este producto si no tiene el dato necesario
        }

        // Calcular la cantidad real basada en `placas_por_metro`
        const cantidadEntregada = producto.cantidad * modelo.placas_por_metro;

        // Sumar la cantidad calculada al idStock correspondiente
        totalPorStock.set(
          idStock,
          (totalPorStock.get(idStock) || 0) + cantidadEntregada
        );
      }
    }

    if (totalPorStock.size === 0) {
      console.log(
        "⚠ No hay pedidos entregados con productos válidos. No se realizaron cambios."
      );
      res.status(200).json({
        message: "No se encontraron pedidos entregados con productos válidos.",
      });
      return;
    }

    // 4️⃣ Preparar registros para la tabla Produccion y actualizaciones de stock
    const producciones = [];
    const bulkStockUpdates = [];

    for (const [idStock, totalEntregado] of totalPorStock.entries()) {
      // Crear registro en Producción con el cálculo corregido
      producciones.push({
        idStock, // 🔹 Se mantiene como string
        fecha: new Date(),
        cantidad: totalEntregado, // Cantidad corregida con placas_por_metro
        responsable: "Inicialización automática",
      });

      // Agregar actualización de stock en batch
      bulkStockUpdates.push({
        updateOne: {
          filter: { _id: idStock }, // 🔹 Se mantiene como string
          update: {
            $inc: {
              cantidad_actual: 0,
              total_fabricado: totalEntregado,
              total_entregado: totalEntregado,
            },
          }, // Incrementar stock
        },
      });

      console.log(
        `🔄 Stock actualizado para ${idStock}: +${totalEntregado} unidades agregadas.`
      );
    }

    // 5️⃣ Insertar registros en Producción
    if (producciones.length > 0) {
      await Produccion.insertMany(producciones);
      console.log("✅ Producción inicial registrada en la base de datos.");
    }

    // 6️⃣ Ejecutar actualización en batch para Stock
    if (bulkStockUpdates.length > 0) {
      await Stock.bulkWrite(bulkStockUpdates);
      console.log("✅ Stock actualizado correctamente.");
    }

    res.status(200).json({
      message:
        "Stock normalizado: Producción eliminada, stock reseteado y recalculado correctamente.",
    });
  } catch (error) {
    console.error("❌ Error al normalizar el stock:", error);
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

    // Obtener el idModelo desde el stock y buscar el modelo para obtener placas_por_metro
    const idModelo = stock.idModelo;
    const modelo = await Modelos.findById(idModelo);
    if (!modelo) {
      res
        .status(404)
        .json({ message: `Modelo con ID ${idModelo} no encontrado.` });
      return;
    }
    const { placas_por_metro } = modelo;
    if (!placas_por_metro || placas_por_metro === 0) {
      res
        .status(400)
        .json({ message: "El valor de placas_por_metro no es válido." });
      return;
    }

    // Incrementar total fabricado
    const nuevoTotalFabricado = (stock.total_fabricado || 0) + cantidad;

    // Calcular la cantidad actual como total_fabricado - total_entregado
    // Calcular la cantidad actual como fabricado - entregado - reservado
    const nuevaCantidadActual =
      nuevoTotalFabricado -
      (stock.total_entregado || 0) -
      (stock.total_reservado || 0);

    // Insertar en Producción
    await Produccion.create({
      idStock,
      fecha: new Date(),
      cantidad,
      responsable,
    });

    console.log(
      `✅ Producción registrada para idStock ${idStock}: ${cantidad}`
    );

    // Actualizar la cantidad en Stock y el total_fabricado
    await Stock.findByIdAndUpdate(
      idStock,
      {
        cantidad_actual: nuevaCantidadActual,
        total_fabricado: nuevoTotalFabricado,
      },
      { new: true }
    );

    console.log(
      `✅ Stock actualizado para idStock ${idStock}: cantidad_actual = ${nuevaCantidadActual}, total_fabricado = ${nuevoTotalFabricado}`
    );

    // Llamar a la validación de pedidos sin actualizar la BD (solo imprimir en consola)
    await validarPedidosConStock(idStock, placas_por_metro);

    res.status(200).json({
      message: "Stock actualizado correctamente.",
      nuevaCantidadActual,
      nuevoTotalFabricado,
    });
  } catch (error) {
    console.error("❌ Error al actualizar el stock:", error);
    res.status(500).json({ message: "Error al actualizar el stock.", error });
  }
};

export const bulkCreateStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const stocks = req.body; // Se espera un arreglo de objetos stock

    if (!Array.isArray(stocks)) {
      res.status(400).json({
        message: "El cuerpo de la petición debe ser un arreglo de stocks.",
      });
      return;
    }

    const createdStocks = [];

    // Iteramos sobre cada objeto stock recibido
    for (const stockData of stocks) {
      // Se crea una instancia de Stock inicializando total_fabricado y total_entregado
      const newStock = new Stock({
        ...stockData,
        total_fabricado: stockData.total_fabricado || 0,
        total_entregado: stockData.total_entregado || 0,
        cantidad_actual:
          (stockData.total_fabricado || 0) - (stockData.total_entregado || 0),
      });

      await newStock.save();
      createdStocks.push(newStock);
    }

    res
      .status(201)
      .json({ message: "Stocks creados exitosamente.", stocks: createdStocks });
  } catch (error: any) {
    console.error("Error al crear los stocks en bloque:", error);
    res
      .status(500)
      .json({ message: "Error al crear los stocks.", error: error.message });
  }
};

import mongoose from "mongoose"; // 👈 asegurate de importar esto si no está

export const validarPedidosConStock = async (
  idStock: string,
  placasPorMetro: number
): Promise<void> => {
  try {
    console.log(
      `🔄 Validando pedidos con stock disponible para idStock: ${idStock}...`
    );

    const pedidosPendientes = await Pedido.find({
      estado: { $ne: "entregado" },
      productos: {
        $elemMatch: {
          idStock: new mongoose.Types.ObjectId(idStock),
          estado_stock: { $ne: "Disponible" },
        },
      },
    }).sort({ remito: 1 });

    if (pedidosPendientes.length === 0) {
      console.log(
        `✅ No hay pedidos pendientes para validar con idStock: ${idStock}`
      );
      return;
    }

    const stock = await Stock.findById(idStock);
    if (!stock) {
      console.warn(`⚠ No se encontró stock con ID ${idStock}`);
      return;
    }

    let totalFabricado = stock.total_fabricado || 0;
    let totalEntregado = stock.total_entregado || 0;
    let totalReservado = stock.total_reservado || 0;
    let cantidadActual = stock.cantidad_actual || 0;

    for (const pedido of pedidosPendientes) {
      let puedeSerEntregado = true;
      let cantidadAReservar = 0;

      const productosTarget = pedido.productos.filter(
        (p: any) =>
          p.idStock.toString() === idStock && p.estado_stock !== "Disponible"
      );

      for (const producto of productosTarget) {
        const cantidadNecesaria = producto.cantidad * placasPorMetro;

        console.log(`📦 Pedido: ${pedido.remito}`);
        console.log(`   - Cantidad necesaria: ${cantidadNecesaria}`);
        console.log(`   - Total fabricado: ${totalFabricado}`);
        console.log(`   - Total entregado: ${totalEntregado}`);
        console.log(`   - Total reservado: ${totalReservado}`);
        console.log(
          `   - Cantidad actual antes de reservar: ${cantidadActual}`
        );

        if (
          totalFabricado - totalEntregado - totalReservado >=
          cantidadNecesaria
        ) {
          cantidadAReservar += cantidadNecesaria;
        } else {
          console.log(`   ❌ No hay suficiente stock para este producto.`);
          puedeSerEntregado = false;
          break;
        }
      }

      if (puedeSerEntregado && productosTarget.length > 0) {
        // ✅ Actualizar solo los productos correspondientes
        await Pedido.updateOne(
          {
            _id: pedido._id,
            "productos.idStock": idStock,
          },
          {
            $set: {
              "productos.$[elem].estado_stock": "Disponible",
            },
          },
          {
            arrayFilters: [
              {
                "elem.idStock": new mongoose.Types.ObjectId(idStock),
                "elem.estado_stock": { $ne: "Disponible" },
              },
            ],
          }
        );

        console.log(`   ✅ Pedido ${pedido.remito} actualizado.`);

        // 📦 Actualizar stock
        totalReservado += cantidadAReservar;
        cantidadActual -= cantidadAReservar;

        await Stock.findByIdAndUpdate(
          idStock,
          {
            total_reservado: totalReservado,
            cantidad_actual: cantidadActual,
          },
          { new: true }
        );

        console.log(
          `   ✅ Stock actualizado: total_reservado = ${totalReservado}, cantidad_actual = ${cantidadActual}`
        );
      } else {
        console.log(`   ❌ Pedido ${pedido.remito} no se puede completar.`);
        break;
      }
    }

    console.log(`✅ Validación de pedidos con idStock ${idStock} completada.`);
  } catch (error) {
    console.error("❌ Error al validar pedidos con stock:", error);
  }
};
