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
  username: {
    type: String,
    required: true,
  },
  attack: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default:5
    },
  },
  speed: {
    type: Number,
    default: 5,
  },
  health: {
    type: Number,
    default: 15,
  },
  highestClearedFloor: {
    type: Number,
    default: -1,
  },
});

module.exports = model("PlayerStats", playerStatsSchema);
