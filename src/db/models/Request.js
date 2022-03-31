import mongoose from "mongoose";
mongoose.Promise = global.Promise;

const requestSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    dedupe_id: {
      type: String,
      require: "Dedupe ID is required.",
    },
    transaction: {
      type: Object,
      required: "Transaction object is required.",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Request ||
  mongoose.model("Request", requestSchema);
