const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("Party time!")
    .addSubcommand((subcommand) =>
      subcommand.setName("create").setDescription("Create your own party")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("invite").setDescription("Invite others to your party")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("join").setDescription("Join a party")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("leave").setDescription("Leave your party")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("kick").setDescription("Kick someone from your party")
    ),
};
