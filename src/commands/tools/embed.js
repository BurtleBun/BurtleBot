const { SlashCommandBuilder, EmbedBuilder, Embed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Shows an embed'),
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
        .setTitle(`This is an embed`)
        .setDescription('This is a description')
        .setColor(0x18e1ee)
        .setImage(client.user.displayAvatarURL())
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp(Date.now())
        .setAuthor({
            url:`https://youtube.com`,
            iconURL: interaction.user.displayAvatarURL(),
            name: interaction.user.tag

        })
        .setFooter({
            iconURL: client.user.displayAvatarURL(),
            text: client.user.tag
        })  
        .addFields([
            {
                name: `Field 1`,
                value: `Field value 1`,
                inline: true
            },
            {
                name: `Field 2`,
                value: `Field value 2`,
                inline: true
            }
        ]);

        await interaction.reply({
            embeds: [embed]
        })
    }
};