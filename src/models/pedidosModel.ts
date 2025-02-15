import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IPedido extends Document {
  remito: string;
  vendedor_id: ObjectId;
  cliente: {
    nombre: string;
    direccion: string;
    contacto: string;
  };
  productos: {
    idStock: ObjectId; // Relación con la tabla Stock
    idModelo: ObjectId; // Relación con la tabla Modelos
    cantidad: number;
    unidad: string;
    materiales: string; // Nueva propiedad, específica para cada producto
  }[];
  estado: string;
  fecha_pedido: Date;
  fecha_entrega_estimada: Date;
  demora_calculada: number;
  metodo_pago: string;
  procedencia: string;
  flete: number;
  descuento: number;
  adelanto: number;
  total: number;
}

const PedidoSchema: Schema = new Schema({
  remito: { type: String },
  vendedor_id: {
    type: Schema.Types.ObjectId,
    ref: "Vendedores",
    required: true,
  },
  cliente: {
    nombre: { type: String },
    direccion: { type: String },
    contacto: { type: String },
  },
  productos: [
    {
      idStock: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
      idModelo: { type: Schema.Types.ObjectId, ref: "Modelos", required: true },
      cantidad: { type: Number, required: true },
      unidad: { type: String, required: true },
      materiales: {
        type: String,
        enum: [
          "con materiales",
          "con pegamento",
          "con sella junta",
          "sin materiales",
        ],
      },
    },
  ],
  estado: {
    type: String,
    required: true,
    enum: [
      "pendiente",
      "entregado",
      "instalacion",
      "disponible",
      "retira",
      "enviar",
      "remitado",
    ], // Estados permitidos
  },
  fecha_pedido: { type: Date, required: true },
  fecha_entrega_estimada: { type: Date, required: true },
  demora_calculada: { type: Number, required: true },
  metodo_pago: {
    type: String,
    required: true,
    enum: ["efectivo", "transferencia", "debito", "credito"], // Métodos de pago permitidos
  },
  procedencia: {
    type: String,
    required: true,
    enum: [
      "tiktok",
      "facebook",
      "instagram",
      "recomendado",
      "local",
      "anuncio",
    ], // Procedencias permitidas
  },
  flete: { type: Number },
  descuento: { type: Number },
  adelanto: { type: Number },
  total: { type: Number, required: true },
  remitos: [
    {
      url: { type: String },
      fecha: { type: Date, default: Date.now },
    },
  ],
});

// Forzar el uso de la colección "Pedidos"
export default mongoose.model<IPedido>("Pedido", PedidoSchema, "Pedidos");
