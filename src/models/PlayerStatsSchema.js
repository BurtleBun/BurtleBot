const { Schema, model } = require("mongoose");

const playerStatsSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 0,
  },
  mythos: {
    type: String,
    default: "None",
  },
  currency: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
});

module.exports = model("PlayerStats", playerStatsSchema);
