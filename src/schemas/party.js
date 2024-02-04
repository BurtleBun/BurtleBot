const { Schema, model } = require("mongoose");
const partySchema = new Schema({
  _id: Schema.Types.ObjectId,
  partyMembers: Array,
});

module.exports = model("Party", partySchema, "parties");
