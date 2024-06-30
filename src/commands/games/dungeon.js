const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { table } = require("table");

// Import the necessary functions from your party system
const { getPartyByMember } = require("../misc/party.js");

class Character {
  constructor(name, hp, minAtk, maxAtk, speed) {
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
  return `${bar} ${speedBar}/100`;
}

class Battle {
  constructor(players, enemy, message) {
    this.players = players;
    this.enemy = enemy;
    this.turn = 0;
    this.log = [];
    this.characters = [...players, enemy];
    this.actionQueue = [];
    this.message = message;
  }

  async start() {
    this.initializeActionQueue();
    this.log.push("The battle is about to begin!");
    await this.updateBattleEmbed();
    await this.processNextTurn();
  }

  initializeActionQueue() {
    this.actionQueue = this.characters.map((char) => ({
      character: char,
      time: 100 / char.speed,
    }));
    this.actionQueue.sort((a, b) => a.time - b.time);
  }

  async processNextTurn() {
    const battleResult = this.checkBattleEnd();
    if (battleResult) {
      await this.updateBattleEmbed(battleResult);
    } else {
      await this.processTurn();
      setTimeout(() => this.processNextTurn(), 2000); // seconds delay between turns
    }
  }

  checkBattleEnd() {
    if (!this.players.some((p) => p.isAlive())) {
      return "The enemy has defeated all players! Enemy wins!";
    }
    if (!this.enemy.isAlive()) {
      return "All players have defeated the enemy! Players win!";
    }
    return null; // Battle continues
  }

  async processTurn(interaction) {
    const { character, time } = this.actionQueue.shift();
    this.turn++;

    // Update speed bars for all characters
    this.characters.forEach((char) => char.updateSpeedBar());

    if (character === this.enemy) {
      const target = this.players.filter((p) => p.isAlive())[
        Math.floor(
          Math.random() * this.players.filter((p) => p.isAlive()).length
        )
      ];
      const damage = character.attack();
      target.takeDamage(damage);
      this.log.push(
        `${character.name} attacks ${target.name} for ${damage} damage!`
      );
    } else {
      const damage = character.attack();
      this.enemy.takeDamage(damage);
      this.log.push(
        `${character.name} attacks ${this.enemy.name} for ${damage} damage!`
      );
    }

    // Re-insert the character into the action queue
    const newTime = time + 100 / character.speed;
    const insertIndex = this.actionQueue.findIndex(
      (action) => action.time > newTime
    );
    if (insertIndex === -1) {
      this.actionQueue.push({ character, time: newTime });
    } else {
      this.actionQueue.splice(insertIndex, 0, { character, time: newTime });
    }

    await this.updateBattleEmbed(interaction);
  }

  createEmbed(result = null) {
    const embed = new EmbedBuilder().setColor("Blue").setTitle("Raid Battle");

    // Only set description if there are log entries
    const recentLogs = this.log.slice(-5).join("\n");
    if (recentLogs) {
      embed.setDescription(recentLogs);
    } else {
      embed.setDescription("The battle is about to begin!");
    }

    embed.addFields(
      {
        name: "Enemy",
        value: `${this.enemy.name}: ${createHealthBar(
          this.enemy.hp,
          this.enemy.maxHp
        )}\nSpeed: ${createSpeedBar(this.enemy.speedBar)}`,
        inline: false,
      },
      {
        name: "Players",
        value: this.players
          .map(
            (p) =>
              `${p.name}: ${createHealthBar(
                p.hp,
                p.maxHp
              )}\nSpeed: ${createSpeedBar(p.speedBar)}`
          )
          .join("\n\n"),
        inline: false,
      }
    );

    if (result) {
      embed.addFields({ name: "Result", value: result });
    }

    return embed;
  }

  createBattleTable() {
    const allCharacters = [this.enemy, ...this.players];
    const longestNameLength = Math.max(
      ...allCharacters.map((c) => c.name.length)
    );

    // Calculate available width (assuming max message width of 80 characters)
    const maxWidth = 80;
    const nameColumnWidth = Math.max(longestNameLength, 10);
    const availableWidth = maxWidth - nameColumnWidth - 7; // 7 for borders and spaces

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
        createSpeedBar(this.enemy.speedBar),
      ],
      ...this.players.map((p) => [
        p.name,
        createHealthBar(p.hp, p.maxHp),
        createSpeedBar(p.speedBar),
      ]),
    ];

    const config = {
      columns: {
        0: { alignment: "left", width: nameColumnWidth },
        1: { alignment: "left", width: hpBarLength + 8 }, // +8 for the numbers
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
    };

    return table(data, config);
  }

  async updateBattleEmbed(result = null) {
    const battleTable = this.createBattleTable();
    const recentLogs = this.log.slice(-10).join("\n"); // Increased from -5 to -10

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
          const players = party.members.map(
            (id) => new Character(`${id}`, 50, 1, 10, 7)
          );
          const enemy = new Character("Dungeon Boss", 100, 1, 10, 15);

          const battle = new Battle(players, enemy, battleMessage);
          await battle.start();
        } else {
          // ... (rest of the code remains the same)
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
