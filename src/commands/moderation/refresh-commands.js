const { testServer } = require("../../../config.json");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = {
  name: "refresh-commands",
  description: "Refresh all slash commands",
  dm_permission: false,
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.editReply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    try {
      const localCommands = getLocalCommands();
      const applicationCommands = await getApplicationCommands(
        client,
        testServer
      );

      // Remove all existing commands
      console.log('Deleting all existing commands...');
      const existingCommands = await applicationCommands.fetch();
      for (const command of existingCommands.values()) {
        await applicationCommands.delete(command.id);
        console.log(`🗑 Deleted command "${command.name}"`);
      }

      // Register all local commands
      console.log('Registering all local commands...');
      for (const localCommand of localCommands) {
        const { name, description, options } = localCommand;

        if (localCommand.deleted) {
          console.log(`⏩ Skipping command "${name}" as it's set to delete.`);
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options,
        });
        console.log(`📝 Registered command "${name}"`);
      }

      console.log('All commands have been refreshed.');
      await interaction.editReply({
        content: "All commands have been refreshed.",
        ephemeral: true,
      });
    } catch (error) {
      console.error(`There was an error: ${error}`);
      await interaction.editReply({
        content: `There was an error refreshing commands: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};