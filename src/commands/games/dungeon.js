const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { table } = require("table");
const { getPartyByMember } = require("../misc/party.js");

class Character {
  constructor(id, name, hp, minAtk, maxAtk, speed) {
    this.id = id;
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.minAtk = minAtk;
    this.maxAtk = maxAtk;
    this.speed = speed;
    this.speedBar = 0;
  }

  attack() {
    return (
      Math.floor(Math.random() * (this.maxAtk - this.minAtk + 1)) + this.minAtk
    );
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
  }

  isAlive() {
    return this.hp > 0;
  }

  updateSpeedBar() {
    this.speedBar += this.speed;
    if (this.speedBar >= 100) {
      this.speedBar = 0;
      return true;
    }
    return false;
  }
}

function createHealthBar(current, max, length = 10) {
  const filledLength = Math.round((length * current) / max);
  const emptyLength = length - filledLength;
  const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
  return `${bar} ${current}/${max}`;
}

function createSpeedBar(speedBar, length = 10) {
  const filledLength = Math.round((length * speedBar) / 100);
  const emptyLength = length - filledLength;
  const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
  return `${bar} ${speedBar.toFixed(0)}/100`;
}

class Battle {
  constructor(players, enemy, message) {
    this.players = players;
    this.enemy = enemy;
    this.turn = 0;
    this.log = [];
    this.characters = [...players, enemy];
    this.message = message;
    this.isRunning = false;
  }

  async start() {
    this.log.push("The battle is about to begin!");
    this.isRunning = true;
    await this.updateBattleEmbed();
    await this.processNextTurn();
  }

  async processNextTurn() {
    if (!this.isRunning) return;

    const battleResult = this.checkBattleEnd();
    if (battleResult) {
      await this.updateBattleEmbed(battleResult);
      this.isRunning = false;
      return;
    }

    let actionTaker = null;
    while (!actionTaker && this.isRunning) {
      for (const character of this.characters.filter((c) => c.isAlive())) {
        if (character.updateSpeedBar()) {
          actionTaker = character;
          break;
        }
      }
      if (!actionTaker) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to prevent CPU hogging
      }
    }

    if (actionTaker) {
      await this.processTurn(actionTaker);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // delay between turns
      this.processNextTurn();
    }
  }

  checkBattleEnd() {
    if (!this.players.some((p) => p.isAlive())) {
      return "The enemy has defeated all players! Enemy wins!";
    }
    if (!this.enemy.isAlive()) {
      return "All players have defeated the enemy! Players win!";
    }
    return null;
  }

  async processTurn(character) {
    this.turn++;

    if (character === this.enemy) {
      const alivePlayers = this.players.filter((p) => p.isAlive());
      const target =
        alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const damage = character.attack();
      target.takeDamage(damage);
      this.log.push(
        `${character.name} attacks <@${target.id}> for **${damage}** damage!`
      );
    } else {
      const damage = character.attack();
      this.enemy.takeDamage(damage);
      this.log.push(
        `<@${character.id}> attacks ${this.enemy.name} for **${damage}** damage!`
      );
    }

    await this.updateBattleEmbed();
  }

  createBattleTable() {
    const longestNameLength = Math.max(
      this.enemy.name.length,
      ...this.players.map((c) => c.name.length)
    );

    const maxWidth = 80;
    const nameColumnWidth = Math.max(longestNameLength, 10);
    const availableWidth = maxWidth - nameColumnWidth - 7;

    const hpBarLength = Math.floor(availableWidth * 0.6);
    const speedBarLength = Math.floor(availableWidth * 0.4);

    const createHealthBar = (current, max, length = hpBarLength) => {
      const filledLength = Math.round((length * current) / max);
      const emptyLength = length - filledLength;
      const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
      return `${bar} ${current}/${max}`;
    };

    const createSpeedBar = (speedBar, length = speedBarLength) => {
      const filledLength = Math.round((length * speedBar) / 100);
      const emptyLength = length - filledLength;
      const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
      return `${bar} ${speedBar.toFixed(0)}/100`;
    };

    const data = [
      ["Name", "HP", "Speed"],
      [
        this.enemy.name,
        createHealthBar(this.enemy.hp, this.enemy.maxHp),
        this.enemy.isAlive() ? createSpeedBar(this.enemy.speedBar) : "DEFEATED",
      ],
      ["", "", ""], // Empty row for separation
    ];

    // Add players with a small gap between them
    this.players.forEach((p, index) => {
      data.push([
        p.name,
        createHealthBar(p.hp, p.maxHp),
        p.isAlive() ? createSpeedBar(p.speedBar) : "DEFEATED",
      ]);

      // Add a small gap (empty row) between players, but not after the last player
      if (index < this.players.length - 1) {
        data.push(["", "", ""]);
      }
    });

    const config = {
      columns: {
        0: { alignment: "left", width: nameColumnWidth },
        1: { alignment: "left", width: hpBarLength + 8 },
        2: { alignment: "left", width: speedBarLength + 8 },
      },
      border: {
        topBody: `─`,
        topJoin: `┬`,
        topLeft: `┌`,
        topRight: `┐`,
        bottomBody: `─`,
        bottomJoin: `┴`,
        bottomLeft: `└`,
        bottomRight: `┘`,
        bodyLeft: `│`,
        bodyRight: `│`,
        bodyJoin: `│`,
        joinBody: `─`,
        joinLeft: `├`,
        joinRight: `┤`,
        joinJoin: `┼`,
      },
      drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === 2 || index === size;
      },
    };

    return table(data, config);
  }

  async updateBattleEmbed(result = null) {
    const battleTable = this.createBattleTable();
    const recentLogs = this.log.slice(-10).join("\n");

    let content = "```\n" + battleTable + "\n```\n";
    if (recentLogs) {
      content += "**Recent Actions:**\n" + recentLogs + "\n";
    }
    if (result) {
      content += "\n**Result:** " + result;
    }

    await this.message.edit({ content });
  }
}

module.exports = {
  name: "dungeon",
  description: "Start a dungeon raid with your party",
  dm_permission: false,

  callback: async (client, interaction) => {
    try {
      const party = getPartyByMember(interaction.user.id);

      if (!party) {
        return await interaction.reply(
          "You need to be in a party to start a dungeon raid."
        );
      }

      if (party.leader !== interaction.user.id) {
        return await interaction.reply(
          "Only the party leader can start a dungeon raid."
        );
      }

      const readyEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Dungeon Raid Ready Check")
        .setDescription(
          "All party members must ready up to start the dungeon raid."
        );

      const readyButton = new ButtonBuilder()
        .setCustomId("dungeon_ready")
        .setLabel("Ready")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(readyButton);

      const readyMessage = await interaction.reply({
        embeds: [readyEmbed],
        components: [row],
        fetchReply: true,
      });

      let battleStarted = false;

      const collector = readyMessage.createMessageComponentCollector({
        filter: (i) => party.members.includes(i.user.id) && !battleStarted,
        time: 60000,
      });

      const readyPlayers = new Set();

      collector.on("collect", async (i) => {
        if (i.customId === "dungeon_ready") {
          if (!readyPlayers.has(i.user.id)) {
            readyPlayers.add(i.user.id);

            const updatedEmbed = EmbedBuilder.from(
              readyMessage.embeds[0]
            ).setDescription(
              `All party members must ready up to start the dungeon raid.\n\n${readyPlayers.size}/${party.members.length} players ready`
            );

            await readyMessage.edit({ embeds: [updatedEmbed] });

            if (readyPlayers.size === party.members.length) {
              collector.stop("all_ready");
            }
          } else {
            await i.reply({
              content: "You are already ready!",
              ephemeral: true,
            });
          }
        }
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "all_ready") {
          battleStarted = true;

          // Delete the ready check message
          await readyMessage.delete().catch(console.error);

          // Send a new message to start the battle
          const battleMessage = await interaction.followUp({
            content: "All players are ready! Starting the dungeon raid...",
            fetchReply: true,
          });

          // Start the battle
          const players = await Promise.all(
            party.members.map(async (id) => {
              const member = await interaction.guild.members.fetch(id);
              return new Character(id, member.user.username, 50, 1, 10, 7);
            })
          );
          const enemy = new Character("enemy", "Dungeon Boss", 100, 1, 10, 15);

          const battle = new Battle(players, enemy, battleMessage);
          await battle.start();
        } else {
          // Handle case where not all players are ready or the ready check timed out
          const notReadyCount = party.members.length - readyPlayers.size;
          let timeoutMessage = "";

          if (reason === "time") {
            timeoutMessage = "The ready check has timed out. ";
          }

          const failedEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Dungeon Raid Cancelled")
            .setDescription(
              `${timeoutMessage}${notReadyCount} player(s) did not ready up in time. The dungeon raid has been cancelled.`
            );

          // Edit the original message to show the raid was cancelled
          await readyMessage.edit({
            embeds: [failedEmbed],
            components: [], // Remove the ready button
          });

          // Send a follow-up message to notify about the cancellation
          await interaction.followUp({
            content:
              "The dungeon raid has been cancelled due to not all players being ready.",
            ephemeral: true,
          });
        }
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while processing your request.",
        ephemeral: true,
      });
    }
  },
};
