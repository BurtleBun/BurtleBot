const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    const targetUserId = interaction.options.get('target-user').value;
    const reason =
      interaction.options.get('reason')?.value || 'No reason provided';

    await interaction.deferReply();

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    if (!targetUser) {
      await interaction.editReply("That user doesn't exist in this server.");
      return;
    }

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply("No banning Owner");
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position; // Highest Role of the Target
    const requestUserRolePosition = interaction.member.roles.highest.position; // Highest Role of the User of CMD
    const botUserRolePosition =
      interaction.guild.members.me.roles.highest.position; // Highest Role of the Bot

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply(
        "You cannot ban a user of similar/higher power!"
      );
      return;
    }

    if (targetUserRolePosition >= botUserRolePosition) {
      await interaction.editReply(
        "I cannot ban a user of similar/higher power!"
      );
      return;
    }

    //Ban the Target
    try {
      await targetUser.ban({ reason });
      await interaction.editReply(
        `User ${targetUser} was banned\nReason: ${reason}`
      );
    } catch (error) {
        console.log(`There was an error when banning: ${error}`);
    }
  },

  name: "ban",
  description: "Ban a member from this server!",

  options: [
    {
      name: "target-user",
      description: "User to Ban!",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "reason",
      description: "Why?",
      required: false,
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.BanMembers],
  botPermissions: [PermissionFlagsBits.BanMembers],
};
