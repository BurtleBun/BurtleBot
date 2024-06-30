const PlayerStats = require("../../models/PlayerStatsSchema");

module.exports = {
  name: "register",
  description: "Register yourself to the DB",

  callback: async (client, interaction) => {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      let newUser;
      const userStats = await PlayerStats.findOne({ userId, guildId });
      if (!userStats) {
        const newUser = new PlayerStats({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
        });
        await newUser.save();

        await interaction.reply(`Registered user <@${interaction.user.id}>`);
        console.log(`Registered user ${interaction.user.tag}`);
      } else {
        interaction.reply({
          content: `You are already registered.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
};
