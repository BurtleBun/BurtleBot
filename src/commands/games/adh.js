const PlayerStats = require("../../models/PlayerStatsSchema");

const {
  ApplicationCommandOptionType,
  ChatInputApplicationCommandData,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

/*
  ADH
  Attempt to reduce the opponents heal to 0
  Both players begin with __ health
  Attack will -1 health from opponents
  Defense will block any damage
  Heal will recover 1 health to user

  Attack will deal double damage to Heal
  Defense will have a decreasing probability of success during successive use
  
  Future implement a hand system with varied attacks
*/

/**
 * Players draw from one pile of 12 cards each getting 3 cards at the start of their turn
 * 
 * maybe add in a discard mechanic?
 */
const deck = [
  { name: "Attack", emoji: "⚔", damage: 1, health: 0},
  { name: "Defend", emoji: "🛡", damage: -1, health: 0},
  { name: "Heal", emoji: "➕", damage: 0, health: 1},
  { name: "Greater Attack", emoji: "⚔", damage: 2, health: 0},/*
  { name: "Greater Defend", emoji: "🛡", damage: -2, health: 0},
  { name: "Greater Heal", emoji: "➕", damage: 0, health: 2},

  { id: "Attack", name: "1 Attack", emoji: "⚔", damage: 1, health: 0},
  { id: "Defend", name: "1 Defend", emoji: "🛡", damage: -1, health: 0},
  { id: "Heal", name: "1 Heal", emoji: "➕", damage: 0, health: 1},  
  { id: "Attack", name: "2 Attack", emoji: "⚔", damage: 2, health: 0},
  { id: "Defend", name: "2 Defend", emoji: "🛡", damage: -2, health: 0},
  { id: "Heal", name: "2 Heal", emoji: "➕", damage: 0, health: 2},*/
]

module.exports = {
  name: "adh",
  description: "Play ADH with an NPC",
  dm_permission: false,
  options: [
    {
      name: "target-user",
      description: "select a user to challenge",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "target-score",
      description: "Game happens until on player reaches this score",
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
/*
      if (interaction.user.id === targetUser.id) {
        interaction.reply({
          content: "You cannot play with yourself",
          ephemeral: true,
        });

        return;
      }
*/
      if (targetUser.bot) {
        interaction.reply({
          content: "You cannot play with bot",
          ephemeral: true,
        });

        return;
      }

      // For gameplay loop
      const baseEmbed = new EmbedBuilder()
        .setTitle("ADH")
        .setDescription(`It's currently ${targetUser}'s turn.`)
        .setColor("Yellow")
        .setTimestamp(new Date());

      // Embed that is edited per round
      const embed = new EmbedBuilder()
        .setTitle("ADH")
        .setDescription(`It's currently ${targetUser}'s turn.`)
        .setColor("Yellow")
        .setTimestamp(new Date());

      const ADHbuttons = deck.map((card) => {
        return new ButtonBuilder()
          .setCustomId(card.name)
          .setLabel(card.name)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(card.emoji); // Sets emoji can change later
      });

      const row = new ActionRowBuilder().addComponents(ADHbuttons);
      const reply = await interaction.reply({ content: "https://imgur.com/gallery/small-loading-gif-Q6hDeQP"});

      let userScore = 0,
        targetScore = 0,
        round = 0;
      do {
        // Game Starts Here
        if (round == 0) {
          await reply.edit({
            content: `${targetUser}, you have been challenged to ADH by ${interaction.user}. To start playing, click one of the buttons below`,
            embeds: [embed],
            components: [row],
          });
        } else {
          await reply.edit({
            content: `Round: ${round} \n
            \n
            ${targetUser} Score: ${targetScore} \t vs. \t ${interaction.user} Score: ${userScore}
            \n
            ${targetUser}, you have been challenged to RPS by ${interaction.user}. To start playing, click one of the buttons below`,
            embeds: [baseEmbed],
            components: [row],
          });
        }

        const targetUserInteraction = await reply
          .awaitMessageComponent({
            filter: (i) => i.user.id == targetUser.id,
            time: 30_000,
          })
          .catch(async (error) => {
            embed.setDescription(
              `Game Over. ${targetUser} did not respond in time.`
            );
            await reply.edit({ embeds: [embed], components: [] });
          });

        if (!targetUserInteraction) return;

        const targetUserChoice = deck.find(
          (card) => card.name === targetUserInteraction.customId
        );

        await targetUserInteraction.reply({
          content: `You picked ${
            targetUserChoice.name + targetUserChoice.emoji
          }`,
          ephemeral: true,
        });

        // Edit embed with the updated user turn
        embed.setDescription(`It's currently ${interaction.user}'s turn,`);
        await reply.edit({
          content: `${interaction.user} it is your turn.`,
          embeds: [embed],
        });

        const initialUserInteraction = await reply
          .awaitMessageComponent({
            filter: (i) => i.user.id == interaction.user.id,
            time: 30_000,
          })
          .catch(async (error) => {
            embed.setDescription(
              `Game Over. ${interaction.user} did not respond in time.`
            );
            await reply.edit({ embeds: [embed], components: [] });
          });

        if (!initialUserInteraction) return;

        // Game Logic
        const initialUserChoice = deck.find(
          (card) => card.name === initialUserInteraction.customId
        );


        // Calculate the results 
        let result;

        switch (initialUserChoice) {
          case value:
            
            break;
          case value:
          
          break;
          case value:
          
          break;
        }
        if (targetUserChoice.beats === initialUserChoice.name) {
          result = `${targetUser} won!`;
          // Update target score
          targetScore += 1;
        }

        if (initialUserChoice.beats === targetUserChoice.name) {
          result = `${interaction.user} won!`;
          // Update user score
          userScore += 1;
        }

        if (initialUserChoice.name === targetUserChoice.name) {
          result = "tie";
        }

        embed.setDescription(
          `${targetUser} picked ${
            targetUserChoice.name + targetUserChoice.emoji
          }\n
            ${interaction.user} picked ${
            initialUserChoice.name + initialUserChoice.emoji
          }
            \n\n${result}!
            \n\n
            ${targetUser} Score: ${targetScore} \t vs. \t ${
            interaction.user
          } Score: ${userScore}`
        );

        reply.edit({ embeds: [embed], components: [] });
        round += 1;
      } while (
        userScore < interaction.options.get("target-score").value &&
        targetScore < interaction.options.get("target-score").value
      );
    } catch (error) {
      console.log("Error with /rps");
      console.error(error);
    }
  },
};
