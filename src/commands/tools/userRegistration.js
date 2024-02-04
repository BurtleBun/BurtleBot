const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registerBT')
        .setDescription('Show a button'),
    async execute(interaction, client) {
        const button = new ButtonBuilder()
            .setCustomId('RegisterBT')
            .setLabel('Click to Register')
            .setStyle(ButtonStyle.Success);

        await interaction.reply({
            components: [new ActionRowBuilder().addComponents(button)],
        });
    }
};