require("dotenv").config();
const {
  Client,
  IntentsBitField,
  EmbedBuilder,
  Embed,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const roles = [
  {
    id: "1249095982503952424",
    label: "Test",
  },
  {
    id: "1249096047221932154",
    label: "BTest",
  },
];

client.on("ready", async (c) => {
  try {
    const channel = await client.channels.cache.get("1249096656822206514");
    if (!channel) return;

    const row = new ActionRowBuilder();

    roles.forEach((role) => {
      row.components.push(
        new ButtonBuilder()
          .setCustomId(role.id)
          .setLabel(role.label)
          .setStyle(ButtonStyle.Primary)
      )
    })

    await channel.send({
        content: 'Claim or Remove Role',
        components: [row],
    });

    process.exit();
  } catch (error) {
    console.log(error);
  }
});

client.login(process.env.TOKEN);
