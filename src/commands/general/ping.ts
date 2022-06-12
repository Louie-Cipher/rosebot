import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Exibe o ping do bot'),

    execute: async ({ client, interaction }) => {

        const now = new Date();
        await interaction.deferReply({ ephemeral: false });
        const ping = now.getTime() - interaction.createdAt.getTime();

        interaction.editReply({
            embeds: [{
                color: 'AQUA',
                title: '🏓 | Pong!',
                description: `Tempo de resposta do bot: ${ping}ms\n` +
                    `Ping de conexão ao Discord: ${client.ws.ping}ms`
            }]
        });
    }
});