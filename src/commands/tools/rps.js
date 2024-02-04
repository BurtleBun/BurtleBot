const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('RPS')
        .setDescription('Rock, Paper, Scissors!'),
    async execute(interaction, client) {
        const message = await interaction.reply(`${interaction.user.tag} is looking for a challenge, who will accept?`);
        const button = new ButtonBuilder()
            .setCustomId('RockPaperScissor')
            .setLabel('Click to Accept Challenge!')
            .setStyle(ButtonStyle.Success);

        await interaction.reply({
            components: [new ActionRowBuilder().addComponents(button)],
        });
    }
};