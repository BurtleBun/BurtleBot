const Channel = require(`../../schemas/channel`);
const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("database")
    .setDescription("Logs server & channel information to the database"),
  async execute(interaction, client) {
    let channelProfile = await Channel.findOne({ channelId: interaction.channel.id });
    if (!channelProfile) {
      channelProfile = await new Channel({
        _id: new mongoose.Types.ObjectId(),
        channelId: interaction.channel.id,
        channelName: interaction.channel.name,
        serverId: interaction.guild.id,
        serverName: interaction.guild.name,
        serverIcon: interaction.guild.iconURL()
          ? interaction.guild.iconURL()
          : "None.",
      });

      await channelProfile.save().catch(console.error);
      await interaction.reply({
        content: `**Server & Channel Registered**\n\nChannel Name: ${channelProfile.serverName}\nServer Name: ${channelProfile.channelName}`,
      });
      console.log(channelProfile);
    } else {
      await interaction.reply({
        content: `**Channel is Already Registered**\n\nChannel ID: ${channelProfile.serverId}\nServer ID: ${channelProfile.channelId}`,
      });
      console.log(channelProfile);
    }
  },
};
