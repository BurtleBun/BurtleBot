const User = require(`../../schemas/user`);
const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  data: {
    name: `RegisterBT`,
  },
  async execute(interaction, client) {
    let userProfile = await User.findOne({ userId: interaction.user.id });
    if (!userProfile) {
      userProfile = await new User({
        _id: new mongoose.Types.ObjectId(),
        userId: interaction.user.id,
        userName: interaction.user.tag,
      });

      await userProfile.save().catch(console.error);
      await interaction.reply({
        content: `Registerd User: ${userProfile.userName}`,
        ephemeral: true,
      });
      console.log(userProfile);
    } else {
      await interaction.reply({
        content: `Already Registered User: ${userProfile.userId}`,
        ephemeral: true,
      });
      console.log(userProfile);
    }
  },
};
