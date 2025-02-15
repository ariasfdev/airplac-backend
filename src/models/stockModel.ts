import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IStock extends Document {
  producto: string;
  modelo: string;
  cantidad_actual: number;
  unidad: string;
  produccion_diaria: number;
  costo_diario_id: ObjectId;
  valor_m2: number;
  valor_m2_materiales: number;
  valor_m2_pegamento: number;
  valor_m2_sella: number;
  actualizaciones: {
    fecha: Date;
    tipo_movimiento: string;
    cantidad: number;
    responsable: string;
  }[];
  idModelo: ObjectId; // Nuevo campo
  stockActivo: boolean; // Nuevo campo
}

const StockSchema: Schema = new Schema({
  producto: { type: String, required: true },
  modelo: { type: String, required: true },
  cantidad_actual: { type: Number, required: true },
  unidad: { type: String, required: true },
  produccion_diaria: { type: Number },
  costo_diario_id: { type: Schema.Types.ObjectId, ref: "CostosDiarios" },
  valor_m2: { type: Number, required: true },
  valor_m2_materiales: { type: Number, required: true },
  valor_m2_pegamento: { type: Number, required: true },
  valor_m2_sella: { type: Number, required: true },
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
});

export default mongoose.model<IStock>("Stock", StockSchema, "Stock");
