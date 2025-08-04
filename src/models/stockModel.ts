import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IStock extends Document {
  producto: string;
  modelo: string;
  stock: number;
  reservado: number;
  pendiente: number;
  disponible: number;
  unidad: string;
  produccion_diaria: number; // este parametro es un sueño
  costo_diario_id: ObjectId; // este parametro es un sueño
  valor: number;
  promo1: number;
  promo2: number;
  promo3: number;
  precio: number;
  precio_promo1: number;
  precio_promo2: number;
  precio_promo3: number;
  porcentaje_ganancia: number; // Nuevo campo
  total_redondeo: number; // Nuevo campo
  porcentaje_tarjeta: number;
  actualizaciones: {
    fecha: Date;
    tipo_movimiento: string;
    cantidad: number;
    responsable: string;
  }[];
  idModelo: ObjectId; // Nuevo campo
  stockActivo: boolean; // Nuevo campo
  pedidos: {
    idPedido: ObjectId;
    cantidad: number;
    estado: "reservado" | "pendiente"
  }[];
}

const StockSchema: Schema = new Schema({
  producto: { type: String, required: true },
  modelo: { type: String, required: true },
  reservado: { type: Number, required: true },
  pendiente: { type: Number, required: true },
  disponible: { type: Number, required: true },
  stock: { type: Number, required: true },
  unidad: { type: String, required: true },
  produccion_diaria: { type: Number },
  costo_diario_id: { type: Schema.Types.ObjectId, ref: "CostosDiarios" },
  valor: { type: Number, required: true },
  promo1: { type: Number },
  promo2: { type: Number },
  promo3: { type: Number },
  precio: { type: Number, required: true },
  precio_promo1: { type: Number },
  precio_promo2: { type: Number },
  precio_promo3: { type: Number },
  porcentaje_ganancia: { type: Number, required: true }, // Nuevo campo
  total_redondeo: { type: Number, required: true }, // Nuevo campo
  porcentaje_tarjeta: { type: Number, required: true }, // Nuevo campo
  actualizaciones: [
    {
      fecha: { type: Date },
      tipo_movimiento: { type: String },
      cantidad: { type: Number },
      responsable: { type: String },
    },
  ],
  idModelo: { type: Schema.Types.ObjectId, ref: "Modelos" }, // Nuevo campo
  stockActivo: { type: Boolean, default: true }, // Nuevo campo
  pedidos: [
    {
      idPedido: { type: Schema.Types.ObjectId, ref: "Pedidos" },
      cantidad: { type: Number },
      estado: { type: String },
    },
  ],
});

export default mongoose.model<IStock>("Stock", StockSchema, "Stock");
