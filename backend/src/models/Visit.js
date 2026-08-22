const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    method: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
