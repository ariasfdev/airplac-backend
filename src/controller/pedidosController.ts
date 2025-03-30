import { Request, Response } from "express";
import Pedido from "../models/pedidosModel";
import Stock from "../models/stockModel"; // Modelo para el stock
import Modelos from "../models/modelosModel"; // Modelo para los modelos
import path from "path";
import fs from "fs";
import { validarPedidosConStock } from "./stockController";

export const getPedidos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pedidos = await Pedido.aggregate([
      { $unwind: "$productos" },

      {
        $lookup: {
          from: "Modelos",
          localField: "productos.idModelo",
          foreignField: "_id",
          as: "modeloInfo",
        },
      },
      { $unwind: { path: "$modeloInfo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "Stock",
          localField: "productos.idStock",
          foreignField: "_id",
          as: "stockInfo",
        },
      },
      { $unwind: { path: "$stockInfo", preserveNullAndEmptyArrays: true } },

      {
        $group: {
          _id: "$_id",
          remito: { $first: "$remito" },
          fecha_pedido: { $first: "$fecha_pedido" },
          fecha_entrega_estimada: { $first: "$fecha_entrega_estimada" },
          demora_calculada: { $first: "$demora_calculada" },
          cliente: { $first: "$cliente" },
          estado: { $first: "$estado" },
          metodo_pago: { $first: "$metodo_pago" },
          procedencia: { $first: "$procedencia" },
          flete: { $first: "$flete" },
          descuento: { $first: "$descuento" },
          adelanto: { $first: "$adelanto" },
          total: { $first: "$total" },
          total_pendiente: { $first: "$total_pendiente" },
          valor_instalacion: { $first: "$valor_instalacion" },
          remitos: { $first: "$remitos" },

          productos: {
            $push: {
              idStock: "$productos.idStock",
              idModelo: "$productos.idModelo",
              cantidad: "$productos.cantidad",
              unidad: "$productos.unidad",
              materiales: "$productos.materiales",
              materiales_sueltos: "$productos.materiales_sueltos",
              estado_stock: "$productos.estado_stock",

              modelo: "$modeloInfo.modelo",
              descripcion_modelo: "$modeloInfo.descripcion",
              categoria_modelo: "$modeloInfo.categoria",
              placas_por_metro: "$modeloInfo.placas_por_metro",

              producto: "$stockInfo.producto",
              stock_actual: "$stockInfo.cantidad_actual",
              unidad_stock: "$stockInfo.unidad",
              produccion_diaria: "$stockInfo.produccion_diaria",
              actualizaciones: "$stockInfo.actualizaciones",

              valor_m2: "$stockInfo.valor_m2",
              valor_m2_materiales: "$stockInfo.valor_m2_materiales",
              valor_m2_pegamento: "$stockInfo.valor_m2_pegamento",
              valor_m2_sella: "$stockInfo.valor_m2_sella",
              porcentaje_ganancia: "$stockInfo.porcentaje_ganancia",
              total_redondeo: "$stockInfo.total_redondeo",
              porcentaje_tarjeta: "$stockInfo.porcentaje_tarjeta",

              valorM2: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$productos.materiales", "con materiales"],
                      },
                      then: "$stockInfo.valor_m2_materiales",
                    },
                    {
                      case: { $eq: ["$productos.materiales", "con pegamento"] },
                      then: "$stockInfo.valor_m2_pegamento",
                    },
                    {
                      case: {
                        $eq: ["$productos.materiales", "con sella junta"],
                      },
                      then: "$stockInfo.valor_m2_sella",
                    },
                  ],
                  default: "$stockInfo.valor_m2",
                },
              },
            },
          },
        },
      },
    ]);

    const pedidosFormateados = pedidos.map((pedido) => {
      const primerProducto = pedido.productos[0];

      return {
        id: pedido._id,
        remito: pedido.remito,
        fecha: pedido.fecha_pedido?.toISOString().split("T")[0] || "",
        año: new Date(pedido.fecha_pedido).getFullYear().toString(),
        cliente: pedido.cliente?.nombre || "",
        direccion: pedido.cliente?.direccion || "",
        contacto: pedido.cliente?.contacto || "",

        detalle: primerProducto?.modelo || "Sin modelo",
        cantidadM2: primerProducto?.cantidad || 0,
        materiales: primerProducto?.materiales || "Sin materiales",
        valorM2: `$${
          primerProducto && !isNaN(primerProducto.valorM2)
            ? primerProducto.valorM2.toFixed(2)
            : "0.00"
        }`,

        porcentaje_ganancia: primerProducto?.porcentaje_ganancia || 0,
        porcentaje_tarjeta: primerProducto?.porcentaje_tarjeta || 0,
        total_redondeo: primerProducto?.total_redondeo || 0,

        pago: pedido.metodo_pago,
        procedencia: pedido.procedencia,
        flete: pedido.flete || "",
        seña: pedido.adelanto || "",
        descuento: pedido.descuento || "",
        total: pedido.total,
        total_pendiente: pedido.total_pendiente,
        valor_instalacion: pedido.valor_instalacion,
        estado: pedido.estado,

        // ✅ Solo estado_stock del primer producto
        disponible: primerProducto?.estado_stock || "pendiente",

        masDeUnProducto: pedido.productos.length > 1,

        productos: pedido.productos.map((prod: any) => ({
          idStock: prod.idStock,
          idModelo: prod.idModelo,
          cantidad: prod.cantidad,
          unidad: prod.unidad,
          materiales: prod.materiales,
          materiales_sueltos: prod.materiales_sueltos,
          estado_stock: prod.estado_stock,

          modelo: prod.modelo,
          descripcion_modelo: prod.descripcion_modelo,
          categoria_modelo: prod.categoria_modelo,
          placas_por_metro: prod.placas_por_metro,

          producto: prod.producto,
          stock_actual: prod.stock_actual,
          unidad_stock: prod.unidad_stock,
          produccion_diaria: prod.produccion_diaria,
          actualizaciones: prod.actualizaciones,

          valor_m2: prod.valor_m2,
          valor_m2_materiales: prod.valor_m2_materiales,
          valor_m2_pegamento: prod.valor_m2_pegamento,
          valor_m2_sella: prod.valor_m2_sella,
          porcentaje_ganancia: prod.porcentaje_ganancia,
          porcentaje_tarjeta: prod.porcentaje_tarjeta,
          total_redondeo: prod.total_redondeo,
          valorM2: prod.valorM2,
        })),
      };
    });

    res.status(200).json(pedidosFormateados);
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
    res.status(500).json({ message: "Error al obtener los pedidos", error });
  }
};

export const createPedido = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      remito,
      vendedor_id,
      cliente,
      productos,
      estado,
      fecha_pedido,
      fecha_entrega_estimada,
      demora_calculada,
      metodo_pago,
      procedencia,
      flete,
      descuento,
      adelanto,
      total,
      total_pendiente,
      valor_instalacion,
    } = req.body;

    const productosConEstado = [];

    for (const prod of productos) {
      const stock = await Stock.findById(prod.idStock);
      const modelo = await Modelos.findById(prod.idModelo);

      let estadoStock = "pendiente";

      if (stock && modelo && modelo.placas_por_metro) {
        const cantidadNecesaria = prod.cantidad * modelo.placas_por_metro;
        const disponible =
          (stock.total_fabricado || 0) -
          (stock.total_entregado || 0) -
          (stock.total_reservado || 0);

        if (disponible >= cantidadNecesaria) {
          estadoStock = "Disponible";

          // ✅ Reservar stock
          const nuevoReservado =
            (stock.total_reservado || 0) + cantidadNecesaria;
          const nuevaCantidadActual =
            (stock.cantidad_actual || 0) - cantidadNecesaria;

          await Stock.findByIdAndUpdate(prod.idStock, {
            total_reservado: nuevoReservado,
            cantidad_actual: nuevaCantidadActual,
          });

          console.log(
            `🟢 Stock reservado para idStock ${prod.idStock}: +${cantidadNecesaria}`
          );
        } else {
          // 🔴 Actualizar total_pendiente y total_pre_reserva
          const nuevoTotalPendiente =
            (stock.total_pendiente || 0) + cantidadNecesaria;
          const nuevoTotalPreReserva =
            (stock.total_pre_reserva || 0) + (stock.cantidad_actual || 0);

          await Stock.findByIdAndUpdate(prod.idStock, {
            total_pendiente: nuevoTotalPendiente,
            total_pre_reserva: nuevoTotalPreReserva,
            cantidad_actual: 0, // La cantidad actual se convierte en pre-reserva
          });

          console.log(
            `🔴 Stock insuficiente para idStock ${prod.idStock}. Actualizando total_pendiente y total_pre_reserva.`
          );
        }
      }

      productosConEstado.push({
        ...prod,
        estado_stock: estadoStock,
      });
    }

    const nuevoPedido = new Pedido({
      remito,
      vendedor_id,
      cliente,
      productos: productosConEstado,
      estado,
      estado_stock: "pendiente", // mantenemos por compatibilidad pero ya no es usado
      fecha_pedido,
      fecha_entrega_estimada,
      demora_calculada,
      metodo_pago,
      procedencia,
      flete,
      descuento,
      adelanto,
      total,
      total_pendiente,
      valor_instalacion,
    });

    const pedidoGuardado = await nuevoPedido.save();

    res.status(201).json(pedidoGuardado);
  } catch (error) {
    console.error("❌ Error al crear el pedido:", error);
    res.status(500).json({ message: "Error al crear el pedido", error });
  }
};

export const uploadRemito = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pedido: any = await Pedido.findById(req.params.id);
    if (!pedido) {
      res.status(404).json({ message: "Pedido no encontrado" });
      return;
    }

    pedido.remitos.push({ url: `/uploads/remitos/${req.file?.filename}` });

    // ✅ Cambiar el estado a "remitado"
    pedido.estado = "remitado";

    await pedido.save();
    console.log(
      "Remito subido y estado actualizado a 'remitado'",
      req.file?.filename
    );

    res
      .status(200)
      .json({ message: "Remito subido con éxito", remito: req.file?.filename });
  } catch (error) {
    console.log("Error al subir el remito", error);
    res.status(500).json({ message: "Error al subir el remito", error });
  }
};

export const getRemito = (req: Request, res: Response): void => {
  const filePath = path.resolve(
    __dirname,
    "../../uploads/remitos",
    req.params.filename
  );

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error(`Archivo no encontrado: ${filePath}`);
    res.status(404).json({ message: "Archivo no encontrado" });
  }
};

export const cambiarEstadoAEntregado = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      res.status(404).json({ message: "Pedido no encontrado" });
      return;
    }

    const estadosPermitidos = ["retira", "enviar", "instalacion"];
    if (!estadosPermitidos.includes(pedido.estado)) {
      res.status(400).json({
        message:
          "El pedido no está en un estado que permita el cambio a 'entregado'",
      });
      return;
    }

    // ✅ Cambiar el estado del pedido a "entregado"
    pedido.estado = "entregado";

    // ✅ Cambiar estado_stock de cada producto a "entregado"
    pedido.productos.forEach((producto) => {
      producto.estado_stock = "entregado";
    });

    await pedido.save();

    console.log(`✅ Pedido ${pedido.remito} marcado como ENTREGADO.`);

    // ✅ Actualizar total_entregado y total_reservado en la colección Stock
    for (const producto of pedido.productos) {
      const modelo = await Modelos.findById(producto.idModelo);
      if (!modelo || !modelo.placas_por_metro) {
        console.warn(
          `⚠ No se encontró modelo o placas_por_metro no es válido para idModelo: ${producto.idModelo}`
        );
        continue;
      }

      const cantidadRealEntregada = producto.cantidad * modelo.placas_por_metro;

      const stock = await Stock.findById(producto.idStock);
      if (!stock) {
        console.warn(`⚠ No se encontró stock con ID: ${producto.idStock}`);
        continue;
      }

      const nuevoTotalEntregado =
        (stock.total_entregado || 0) + cantidadRealEntregada;
      const nuevoTotalReservado = Math.max(
        (stock.total_reservado || 0) - cantidadRealEntregada,
        0
      );

      await Stock.findByIdAndUpdate(
        producto.idStock,
        {
          total_entregado: nuevoTotalEntregado,
          total_reservado: nuevoTotalReservado,
        },
        { new: true }
      );

      console.log(`📦 Stock actualizado para idStock ${producto.idStock}:`);
      console.log(
        `   + ${cantidadRealEntregada} unidades agregadas a total_entregado.`
      );
      console.log(
        `   - ${cantidadRealEntregada} unidades restadas de total_reservado.`
      );
    }

    res.status(200).json({
      message:
        "Estado cambiado a 'entregado', stock actualizado correctamente.",
      pedido,
    });
  } catch (error) {
    console.error("❌ Error al cambiar el estado:", error);
    res.status(500).json({ message: "Error al cambiar el estado", error });
  }
};

export const updatePedido = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Se busca el pedido existente para obtener la cantidad anterior
    const pedidoExistente = await Pedido.findById(id);
    if (!pedidoExistente) {
      res.status(404).json({ message: "Pedido no encontrado" });
      return;
    }

    // Se recorre cada producto del pedido (se asume que el orden de productos es el mismo)
    for (let i = 0; i < updates.productos.length; i++) {
      const nuevoProd = updates.productos[i];
      const viejoProd = pedidoExistente.productos[i];

      // Se obtiene el modelo para calcular la cantidad de placas
      const modelo = await Modelos.findById(nuevoProd.idModelo);
      if (!modelo || !modelo.placas_por_metro) continue;

      // Se calcula la cantidad de placas del producto anterior y la nueva
      const placasAnteriores = viejoProd.cantidad * modelo.placas_por_metro;
      const nuevasPlacas = nuevoProd.cantidad * modelo.placas_por_metro;
      const diferencia = nuevasPlacas - placasAnteriores;

      // Se actualiza el campo total_reservado del stock correspondiente,
      // restando las placas anteriores y sumando las nuevas (con diferencia negativa si disminuyó)
      await Stock.findByIdAndUpdate(nuevoProd.idStock, {
        $inc: { total_pendiente: diferencia },
      });
    }

    // Finalmente se actualiza el pedido
    const pedidoActualizado = await Pedido.findByIdAndUpdate(id, updates, {
      new: true, // Devuelve el pedido actualizado
      runValidators: true, // Se validan los datos antes de actualizar
    });

    res.status(200).json({
      message: "Pedido actualizado con éxito",
      pedido: pedidoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el pedido:", error);
    res.status(500).json({ message: "Error al actualizar el pedido", error });
  }
};

export const actualizarValores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Obtener todos los pedidos con los datos de Stock asociados
    const pedidos = await Pedido.find().populate("productos.idStock");

    let pedidosActualizados = 0;

    for (const pedido of pedidos) {
      // Calcular el total utilizando la misma lógica que el frontend
      const subtotalProductos = pedido.productos.reduce(
        (sum, producto: any) => {
          const stock = producto.idStock as any; // Acceso a los datos de Stock

          if (!stock) {
            console.warn(
              `⚠ No se encontró stock para el producto en el pedido ${pedido.remito}`
            );
            return sum;
          }

          let valorBase = stock.valor_m2;
          if (producto.materiales === "con materiales") {
            valorBase = stock.valor_m2_materiales || 0;
          } else if (producto.materiales === "con pegamento") {
            valorBase = stock.valor_m2_pegamento || 0;
          } else if (producto.materiales === "con sella junta") {
            valorBase = stock.valor_m2_sella || 0;
          }

          valorBase = valorBase + stock.total_redondeo;

          // Aplicar porcentaje de ganancia
          const porcentajeGanancia = stock.porcentaje_ganancia
            ? stock.porcentaje_ganancia / 100
            : 0;
          let valorConGanancia = valorBase + valorBase * porcentajeGanancia;

          // Aplicar incremento del 15% si el pago es con tarjeta
          if (pedido.metodo_pago === "credito") {
            valorConGanancia *= 1.15;
          }

          return sum + producto.cantidad * valorConGanancia;
        },
        0
      );

      // Subtotal incluyendo flete
      const subtotalConFlete = subtotalProductos + (pedido.flete || 0);

      // Aplicar descuento (si pedido.descuento = 10, significa 10% de descuento)
      const descuentoDecimal = (pedido.descuento || 0) / 100;
      const totalConDescuento =
        subtotalConFlete - subtotalConFlete * descuentoDecimal;

      // Restar adelanto
      const totalFinal = totalConDescuento - (pedido.adelanto || 0);

      // Asegurar que el total final no sea negativo
      const totalCorregido = totalFinal > 0 ? totalFinal : 0;

      // Actualizar el pedido en la base de datos
      await Pedido.findByIdAndUpdate(pedido._id, {
        total: totalCorregido.toFixed(2),
      });

      console.log(
        `✅ Pedido ${
          pedido.remito
        } actualizado con total: ${totalCorregido.toFixed(2)}`
      );
      pedidosActualizados++;
    }

    res.status(200).json({
      message: "Pedidos actualizados con éxito",
      totalPedidosActualizados: pedidosActualizados,
    });
  } catch (error) {
    console.error("❌ Error al actualizar los valores de los pedidos:", error);
    res.status(500).json({ message: "Error al actualizar los valores", error });
  }
};

export const deletePedido = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const pedidoEliminado = await Pedido.findByIdAndDelete(id);

    if (!pedidoEliminado) {
      res.status(404).json({ message: "Pedido no encontrado" });
      return;
    }

    // Por cada producto del pedido eliminado
    for (const producto of pedidoEliminado.productos) {
      // Obtener el modelo para calcular las placas
      const modelo = await Modelos.findById(producto.idModelo);
      if (modelo && modelo.placas_por_metro) {
        const cantidadPlacas = producto.cantidad * modelo.placas_por_metro;

        // Descontar la cantidad de placas del total_reservado
        await Stock.findByIdAndUpdate(producto.idStock, {
          $inc: { total_pendiente: -cantidadPlacas },
        });
      }
    }

    console.log(`✅ Pedido ${pedidoEliminado.remito} eliminado correctamente.`);
    res.status(200).json({
      message: "Pedido eliminado con éxito",
      pedido: pedidoEliminado,
    });
  } catch (error) {
    console.error("❌ Error al eliminar el pedido:", error);
    res.status(500).json({ message: "Error al eliminar el pedido", error });
  }
};
