const PlayerStats = require("../../models/PlayerStatsSchema");

module.exports = {
  name: "register",
  description: "Register yourself to the DB",

  callback: async (client, interaction) => {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const username = interaction.user.username;

    try {
      const userStats = await PlayerStats.findOne({ userId, guildId });
      if (!userStats) {
        const newUser = new PlayerStats({
          userId,
          guildId,
          username,
          attack: {
            min: 1,
            max: 5
          },
          speed: 5,
          health: 15,
          highestClearedFloor: -1
        });
        await newUser.save();

        await interaction.reply(`Registered user <@${userId}>`);
        console.log(`Registered user ${interaction.user.tag}`);
      } else {
        await interaction.reply({
          content: `You are already registered.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error in register command:", error);
      await interaction.reply({
        content: "An error occurred while registering. Please try again later.",
        ephemeral: true,
      });
    }
  },
};