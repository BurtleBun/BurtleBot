const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

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

class Battle {
  constructor(players, enemy, interaction) {
    this.players = players;
    this.enemy = enemy;
    this.turn = 0;
    this.log = [];
    this.characters = [...players, enemy];
    this.actionQueue = [];
    this.interaction = interaction;
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
      setTimeout(() => this.processNextTurn(), 1000); // seconds delay between turns
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
    this.log.push(`--- Turn ${this.turn} ---`);

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
        value: `${this.enemy.name}: ${this.enemy.hp}/${this.enemy.maxHp} HP`,
        inline: true,
      },
      {
        name: "Players",
        value: this.players
          .map((p) => `${p.name}: ${p.hp}/${p.maxHp} HP`)
          .join("\n"),
        inline: true,
      }
    );

    if (result) {
      embed.addFields({ name: "Result", value: result });
    }

    return embed;
  }

  async updateBattleEmbed(result = null) {
    const newEmbed = this.createEmbed(result);
    await this.interaction.editReply({ embeds: [newEmbed] });
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

      const collector = readyMessage.createMessageComponentCollector({
        filter: (i) => party.members.includes(i.user.id),
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
            await i.reply({ content: `${i.user} is ready!`, ephemeral: true });

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
          const finalEmbed = EmbedBuilder.from(
            readyMessage.embeds[0]
          ).setDescription(
            "All players are ready! Starting the dungeon raid..."
          );

          await readyMessage.edit({ embeds: [finalEmbed], components: [] });

          const players = party.members.map(
            (id) => new Character(`<@${id}>`, 50, 1, 10, 10)
          );
          const enemy = new Character("Dungeon Boss", 100, 1, 10, 10);

          const battle = new Battle(players, enemy, interaction);
          await battle.start();
        } else {
          const timeoutEmbed = EmbedBuilder.from(
            readyMessage.embeds[0]
          ).setDescription(
            "Dungeon raid cancelled. Not all players were ready in time."
          );

          await readyMessage.edit({ embeds: [timeoutEmbed], components: [] });
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
