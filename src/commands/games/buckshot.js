const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "buckshot",
  description: "Play a Buckshot Roulette inspired game with another user",
  dm_permission: false,
  options: [
    {
      name: "target-user",
      description: "Select a user to challenge",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    try {
      const targetUser = interaction.options.getUser("target-user");

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

      // Create challenge embed
      const challengeEmbed = new EmbedBuilder()
        .setTitle("Buckshot Roulette Challenge")
        .setColor("Gold")
        .setDescription(
          `${targetUser}, you have been challenged to a game of Buckshot Roulette by ${interaction.user}.\nDo you accept?`
        )
        .setTimestamp();

      // Create accept and decline buttons
      const acceptButton = new ButtonBuilder()
        .setCustomId("accept_challenge")
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId("decline_challenge")
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger);

      const challengeRow = new ActionRowBuilder().addComponents(
        acceptButton,
        declineButton
      );

      // Send challenge embed
      const challengeMessage = await interaction.reply({
        embeds: [challengeEmbed],
        components: [challengeRow],
        fetchReply: true,
      });

      // Wait for button interaction
      try {
        const buttonInteraction = await challengeMessage.awaitMessageComponent({
          filter: async (i) => {
            if (i.user.id === targetUser.id) {
              return true;
            } else if (i.user.id === interaction.user.id) {
              await i.reply({
                content: "You can't accept or decline your own challenge!",
                ephemeral: true,
              });
            } else {
              await i.reply({
                content: "This challenge is not for you!",
                ephemeral: true,
              });
            }
            return false;
          },
          time: 30000,
        });

        if (buttonInteraction.customId === "accept_challenge") {
          await buttonInteraction.update({
            content: "Challenge accepted! Starting the game...",
            components: [],
            embeds: [],
          });

          // Start the game here (existing game logic)
          await startGame(interaction, targetUser, challengeMessage);
        } else {
          await buttonInteraction.update({
            content: "Challenge declined.",
            components: [],
            embeds: [],
          });
        }
      } catch (error) {
        await challengeMessage.edit({
          content: "Challenge timed out.",
          components: [],
          embeds: [],
        });
      }
    } catch (error) {
      console.error("Error with /buckshot command:", error);
      await interaction.followUp(
        "An error occurred while running the game. Please try again later."
      );
    }
  },
};

async function startGame(interaction, targetUser, gameMessage) {
  const embed = new EmbedBuilder()
    .setTitle("Buckshot Roulette")
    .setColor("Red")
    .setTimestamp();

  const shootOtherButton = new ButtonBuilder()
    .setCustomId("shoot_other")
    .setLabel("Shoot Opponent")
    .setStyle(ButtonStyle.Danger);

  const shootSelfButton = new ButtonBuilder()
    .setCustomId("shoot_self")
    .setLabel("Shoot Self")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(
    shootOtherButton,
    shootSelfButton
  );

  let player1 = {
    user: interaction.user,
    hp: 3,
  };

  let player2 = {
    user: targetUser,
    hp: 3,
  };

  let currentPlayer = player1;
  let otherPlayer = player2;

  let roundCount = 0;

  const generateShells = () => {
    roundCount++;
    let shellCount =
      roundCount === 1 ? 5 : 5 + Math.floor(Math.random() * 4) + 2;
    let shells = Array(shellCount)
      .fill()
      .map(() => Math.random() < 0.6);
    const realShellCount = shells.filter((shell) => shell).length;
    const fakeShellCount = shells.length - realShellCount;
    return { shells, realShellCount, fakeShellCount };
  };

  let { shells, realShellCount, fakeShellCount } = generateShells();

  const updateGameState = async (message = "") => {
    embed
      .setDescription(
        `**Scoreboard**\n${player1.user}: ${player1.hp} HP\n${player2.user}: ${player2.hp} HP\n\n` +
          `${currentPlayer.user}, it's your turn!\n\n` +
          message
      )
      .setThumbnail(currentPlayer.user.displayAvatarURL({ dynamic: true }));
    await gameMessage.edit({ embeds: [embed], components: [row] });
  };

  const displayInitialEmbed = async () => {
    embed
      .setDescription(
        `**New Round!**\n\nStarting with ${shells.length} shells:\n` +
          `🔴 Real Shells: ${realShellCount}\n` +
          `⚪ Blank Shells: ${fakeShellCount}\n\n` +
          `${player1.user}: ${player1.hp} HP\n` +
          `${player2.user}: ${player2.hp} HP\n\n` +
          `${currentPlayer.user}, it's your turn!`
      )
      .setThumbnail(currentPlayer.user.displayAvatarURL({ dynamic: true }));
    await gameMessage.edit({ embeds: [embed], components: [row] });
  };

  // Initial game message
  embed
    .setDescription(
      `**Game Start!**\n\nStarting with 5 shells:\n` +
        `🔴 Real Shells: ${realShellCount}\n` +
        `⚪ Blank Shells: ${fakeShellCount}\n\n` +
        `Each player starts with 3 HP. Good luck!\n\n` +
        `${currentPlayer.user}, it's your turn!`
    )
    .setThumbnail(currentPlayer.user.displayAvatarURL({ dynamic: true }));
  await gameMessage.edit({ embeds: [embed], components: [row] });

  while (player1.hp > 0 && player2.hp > 0) {
    if (shells.length === 0) {
      ({ shells, realShellCount, fakeShellCount } = generateShells());
      await displayInitialEmbed();
    }

    const playerInteraction = await gameMessage
      .awaitMessageComponent({
        filter: async (i) => {
          if (i.user.id === currentPlayer.user.id) {
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
          `Game Over. ${currentPlayer.user} did not respond in time.`
        );
        await gameMessage.edit({ embeds: [embed], components: [] });
        return null;
      });

    if (!playerInteraction) return;

    const action = playerInteraction.customId;
    const shell = shells.pop();

    let resultMessage = "";

    if (action === "shoot_other") {
      if (shell) {
        otherPlayer.hp -= 1;
        resultMessage = `${currentPlayer.user} shot ${otherPlayer.user} with a real shell! ${otherPlayer.user} loses 1 HP.`;
        [currentPlayer, otherPlayer] = [otherPlayer, currentPlayer];
      } else {
        resultMessage = `${currentPlayer.user} shot at ${otherPlayer.user}, but it was a blank!`;
        [currentPlayer, otherPlayer] = [otherPlayer, currentPlayer];
      }
    } else {
      if (shell) {
        currentPlayer.hp -= 1;
        resultMessage = `${currentPlayer.user} shot themselves with a real shell! They lose 1 HP.`;
        [currentPlayer, otherPlayer] = [otherPlayer, currentPlayer];
      } else {
        resultMessage = `${currentPlayer.user} shot themselves with a blank! They get an extra turn.`;
      }
    }

    await updateGameState(resultMessage);
  }

  // Game over
  const winner = player1.hp > 0 ? player1.user : player2.user;
  embed
    .setDescription(
      `**Game Over!**\n\n` +
        `Final Scores:\n` +
        `${player1.user}: ${player1.hp} HP\n` +
        `${player2.user}: ${player2.hp} HP\n\n` +
        `**${winner} wins the game!**`
    )
    .setThumbnail(currentPlayer.user.displayAvatarURL({ dynamic: true }));
  await gameMessage.edit({ embeds: [embed], components: [] });
}
