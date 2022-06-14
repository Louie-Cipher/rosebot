import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageActionRow, MessageButton } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Exibe o banner de um usuário')
        .addUserOption(option => option
            .setName('user')
            .setDescription('Usuário para exibir o banner')
            .setRequired(false)
        ),

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const rawUser = interaction.options.getUser('user') || interaction.user;
        const user = await rawUser.fetch(true);
        const banner = user.bannerURL({ format: 'png', dynamic: true, size: 2048 });

        if (!banner || banner.length === 0)
            return interaction.editReply({
                embeds: [{
                    color: 'ORANGE',
                    title: `🤷‍♀️ | ${user.username}`,
                    description: 'Este usuário não possui uma imagem de fundo (banner)'
                }],
            });

        const button = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setStyle('LINK')
                    .setLabel('Abrir imagem no navegador')
                    .setURL(banner)
            );

        interaction.editReply({
            embeds: [{
                color: user.accentColor || 'AQUA',
                title: `🖼 | ${user.username}`,
                image: { url: banner }
            }],
            components: [button]
        });

    }
});