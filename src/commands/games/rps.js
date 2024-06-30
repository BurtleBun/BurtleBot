const PlayerStats = require("../../models/PlayerStatsSchema");

const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const choices = [
  { name: "Rock", emoji: "🗿", beats: "Scissors" },
  { name: "Scissors", emoji: "✂", beats: "Paper" },
  { name: "Paper", emoji: "📄", beats: "Rock" },
];

module.exports = {
  name: "rps",
  description: "Play Rock Paper Scissors with another user",
  dm_permission: false,
  options: [
    {
      name: "target-user",
      description: "Select a user to challenge",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "target-score",
      description: "Game continues until one player reaches this score",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],

  /**
   *
   * @param {Object} param0
   * @param {ChatInputApplicationCommandData} param0.interaction
   */

  callback: async (client, interaction) => {
    try {
      const targetUser = interaction.options.getUser("target-user");
      const targetScore = interaction.options.getNumber("target-score");

      if (interaction.user.id === targetUser.id) {
        return interaction.reply({
          content: "You cannot play with yourself",
          ephemeral: true,
        });
      }

      if (targetUser.bot) {
        return interaction.reply({
          content: "You cannot play with a bot",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Rock Paper Scissors")
        .setColor("Yellow")
        .setTimestamp();

      const buttons = choices.map((choice) =>
        new ButtonBuilder()
          .setCustomId(choice.name)
          .setLabel(choice.name)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(choice.emoji)
      );

      const row = new ActionRowBuilder().addComponents(buttons);
      const reply = await interaction.reply({
        content: `${targetUser}, you have been challenged to Rock Paper Scissors by ${interaction.user}. To start playing, click one of the buttons below.`,
        embeds: [embed],
        components: [row],
      });

      let userScore = 0;
      let targetUserScore = 0;
      let round = 1;

      while (userScore < targetScore && targetUserScore < targetScore) {
        embed.setDescription(
          `**Round ${round}**\n\n${targetUser} Score: ${targetUserScore}\n${interaction.user} Score: ${userScore}\n\n${targetUser}, it's your turn!`
        );
        await reply.edit({ embeds: [embed], components: [row] });

        const targetUserInteraction = await reply
          .awaitMessageComponent({
            filter: async (i) => {
              if (i.user.id === targetUser.id) {
                await i.deferUpdate();
                return true;
              }
              await i.reply({ content: "It's not your turn!", ephemeral: true });
              return false;
            },
            time: 30_000,
          })
          .catch(async () => {
            embed.setDescription(
              `Game Over. ${targetUser} did not respond in time.`
            );
            await reply.edit({ embeds: [embed], components: [] });
            return null;
          });

        if (!targetUserInteraction) return;

        const targetUserChoice = choices.find(
          (choice) => choice.name === targetUserInteraction.customId
        );

        embed.setDescription(
          `**Round ${round}**\n\n${targetUser} Score: ${targetUserScore}\n${interaction.user} Score: ${userScore}\n\n${interaction.user}, it's your turn!`
        );
        await reply.edit({ embeds: [embed], components: [row] });

        const userInteraction = await reply
          .awaitMessageComponent({
            filter: async (i) => {
              if (i.user.id === interaction.user.id) {
                await i.deferUpdate();
                return true;
              }
              await i.reply({ content: "It's not your turn!", ephemeral: true });
              return false;
            },
            time: 30_000,
          })
          .catch(async () => {
            embed.setDescription(
              `Game Over. ${interaction.user} did not respond in time.`
            );
            await reply.edit({ embeds: [embed], components: [] });
            return null;
          });

        if (!userInteraction) return;

        const userChoice = choices.find(
          (choice) => choice.name === userInteraction.customId
        );

        let result;
        if (targetUserChoice.beats === userChoice.name) {
          result = `${targetUser} wins this round!`;
          targetUserScore++;
        } else if (userChoice.beats === targetUserChoice.name) {
          result = `${interaction.user} wins this round!`;
          userScore++;
        } else {
          result = "It's a tie!";
        }

        embed.setDescription(
          `**Round ${round} Results**\n\n${targetUser} picked ${targetUserChoice.name} ${targetUserChoice.emoji}\n${interaction.user} picked ${userChoice.name} ${userChoice.emoji}\n\n${result}\n\n${targetUser} Score: ${targetUserScore}\n${interaction.user} Score: ${userScore}`
        );
        await reply.edit({ embeds: [embed], components: [] });

        round++;
      }

      const winner =
        userScore > targetUserScore ? interaction.user : targetUser;

      embed.setDescription(
        `**Game Over!**\n\nFinal Scores:\n${targetUser} Score: ${targetUserScore}\n${interaction.user} Score: ${userScore}\n\n**${winner} wins the game!**`
      );
      await reply.edit({ embeds: [embed], components: [] });
    } catch (error) {
      console.error("Error with /rps command:", error);
    }
  },
};