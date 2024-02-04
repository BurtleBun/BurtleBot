const { Schema, model } = require("mongoose");
const channelSchema = new Schema({
  _id: Schema.Types.ObjectId,
  channelId: String,
  channelName: String,
  serverId: String,
  serverName: String,
  serverIcon: { type: String, required: false },
});

module.exports = model("Channel", channelSchema, "channels");
