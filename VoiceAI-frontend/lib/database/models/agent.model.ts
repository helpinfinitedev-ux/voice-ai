import { Schema, model, models } from 'mongoose';

const AgentSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    prompt: { type: String, required: true },
    tone: { type: Array },
    phone: { type: Number },
    scheduleCall: { type: String },
  },
  { timestamps: true }
);

const Agent = models.Agent || model('Agent', AgentSchema);

export default Agent;
