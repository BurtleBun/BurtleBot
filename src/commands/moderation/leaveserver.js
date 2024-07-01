const {
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "leave-server",
  description: "Make the bot leave a specific server",
  dm_permission: false,
  options: [
    {
      name: "server-id",
      description: "The ID of the server to leave",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const authorizedUserId = "259902868545470465";
      
      if (userId !== authorizedUserId) {
        return interaction.reply({
          content: "You are not authorized to use this command.",
          ephemeral: true,
        });
      }

      const serverId = interaction.options.getString("server-id");

      if (serverId !== "871987858892800011") {
        return interaction.reply({
          content: "Invalid server ID. The bot can only leave the specified server.",
          ephemeral: true,
        });
      }

      const guild = client.guilds.cache.get(serverId);
      if (!guild) {
        return interaction.reply({
          content: "The bot is not in this server or the server does not exist.",
          ephemeral: true,
        });
      }

      await guild.leave();
      return interaction.reply({
        content: `The bot has successfully left the server: ${guild.name}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error with /leave-server command:", error);
      await interaction.followUp(
        "An error occurred while trying to leave the server. Please try again later."
      );
    }
  },
};
