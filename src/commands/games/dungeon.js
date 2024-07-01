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
  constructor(players, enemies, message) {
    this.players = players;
    this.enemies = enemies;
    this.turn = 0;
    this.log = [];
    this.characters = [...players, ...enemies];
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (actionTaker) {
      await this.processTurn(actionTaker);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.processNextTurn();
    }
  }

  checkBattleEnd() {
    if (!this.players.some((p) => p.isAlive())) {
      return "The enemies have defeated all players! Enemies win!";
    }
    if (!this.enemies.some((e) => e.isAlive())) {
      return "All players have defeated the enemies! Players win!";
    }
    return null;
  }

  async processTurn(character) {
    this.turn++;

    if (this.enemies.includes(character)) {
      const alivePlayers = this.players.filter((p) => p.isAlive());
      const target =
        alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const damage = character.attack();
      target.takeDamage(damage);
      this.log.push(
        `${character.name} attacks <@${target.id}> for **${damage}** damage!`
      );
    } else {
      const aliveEnemies = this.enemies.filter((e) => e.isAlive());
      const target =
        aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      const damage = character.attack();
      target.takeDamage(damage);
      this.log.push(
        `<@${character.id}> attacks ${target.name} for **${damage}** damage!`
      );
    }

    await this.updateBattleEmbed();
  }

  createBattleTable() {
    const longestNameLength = Math.max(
      ...this.enemies.map((e) => e.name.length),
      ...this.players.map((p) => p.name.length)
    );

    const maxWidth = 50;
    const nameColumnWidth = Math.max(longestNameLength, 10);
    const availableWidth = maxWidth - nameColumnWidth - 7;

    const hpBarLength = Math.floor(availableWidth * 0.5);
    const speedColumnWidth = 10;

    const createHealthBar = (current, max, length = hpBarLength) => {
      const filledLength = Math.round((length * current) / max);
      const emptyLength = length - filledLength;
      const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
      return `${bar} ${current}/${max}`;
    };

    const createCharacterRow = (character) => [
      character.name.substring(0, nameColumnWidth),
      createHealthBar(character.hp, character.maxHp),
      character.isAlive() ? `${character.speedBar.toFixed(0)}/100` : "DEFEATED",
    ];

    const createSeparatorRow = () => ["", "", ""];

    const data = [
      ["Name", "HP", "Speed"],
      ...this.enemies
        .flatMap((enemy) => [createCharacterRow(enemy), createSeparatorRow()])
        .slice(0, -1),
      ...this.players
        .flatMap((player) => [createCharacterRow(player), createSeparatorRow()])
        .slice(0, -1),
    ];

    const config = {
      columns: {
        0: { alignment: "left", width: nameColumnWidth },
        1: { alignment: "left", width: hpBarLength + 8 },
        2: { alignment: "right", width: speedColumnWidth },
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
        return (
          index === 0 ||
          index === 1 ||
          index === this.enemies.length * 2 ||
          index === size
        );
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

          await readyMessage.delete().catch(console.error);

          const battleMessage = await interaction.followUp({
            content: "All players are ready! Starting the dungeon raid...",
            fetchReply: true,
          });

          const players = await Promise.all(
            party.members.map(async (id) => {
              const member = await interaction.guild.members.fetch(id);
              return new Character(id, member.user.username, 15, 1, 5, 5);
            })
          );

          const enemies = [
            new Character("enemy1", "Slime 1", 5, 1, 1, 3),
            new Character("enemy2", "Slime 2", 5, 1, 1, 3),
            new Character("enemy3", "Slime 3", 5, 1, 1, 3),
          ];

          const battle = new Battle(players, enemies, battleMessage);
          await battle.start();
        } else {
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

          await readyMessage.edit({
            embeds: [failedEmbed],
            components: [],
          });

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
