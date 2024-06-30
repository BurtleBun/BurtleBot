const PlayerStats = require("../../models/PlayerStatsSchema");
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "stats",
  description: "Show your own player stats.",

  callback: async (client, interaction) => {
    try {
      // Fetch the user data from the database
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;
      const userAvatar = interaction.user.displayAvatarURL();
      const username = interaction.user.username;

      const userStats = await PlayerStats.findOne({ userId, guildId });

      if (!userStats) {
        return interaction.reply("You don't have any stats recorded yet.");
      }

      // Create an embed with the user's stats
      const statsEmbed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setThumbnail(`${userAvatar}`)
        .setDescription(`**<@${interaction.user.id}>'s stats**`)
        .addFields(
          { name: "Level", value: `${userStats.level}`, inline: true },
          { name: "XP", value: `${userStats.xp}`, inline: true },
          { name: "Mythos", value: `${userStats.mythos}`, inline: true },
          { name: "Balance", value: `${userStats.currency}`, inline: true },
          { name: "Wins", value: `${userStats.wins}`, inline: true },
          { name: "Losses", value: `${userStats.losses}`, inline: true },
        )
        .setTimestamp()

      // Send the embed to the user
      await interaction.reply({ embeds: [statsEmbed] });



    } catch (error) {
      console.error(`Error fetching stats: ${error}`);
      interaction.reply(
        "An error occurred while fetching your stats. Please try again later."
      );
    }
  },
};
