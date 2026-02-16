import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actorEmail: { type: String, required: true },
  actorRole: { type: String, enum: ["admin", "staff"], default: "admin" },
  action: { type: String, required: true },
  targetType: { type: String, enum: ["user", "doctor", "appointment", "system"], required: true },
  targetId: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

const auditLogModel = mongoose.models.auditlog || mongoose.model("auditlog", auditLogSchema);
export default auditLogModel;

