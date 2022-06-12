import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('apaga mensagens no chat')
        .addIntegerOption(option => option
            .setName('quantidade')
            .setDescription('quantidade de mensagens a serem apagadas')
            .setRequired(false)
        )
        .addUserOption(option => option
            .setName('user')
            .setDescription('usuário para ter as mensagens apagadas')
            .setRequired(false)
        )
        .setDefaultPermission(false),

    permissions: ['MANAGE_MESSAGES'],

    execute: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const quantidade = interaction.options.getInteger('quantidade') || 10;

            const targetUser = interaction.options.getUser('user');

            if (!targetUser) {

                await interaction.channel.bulkDelete(quantidade).catch((err) => {
                    consoleError(err);
                    interaction.editReply({
                        content: '❌ | Não foi possível apagar as mensagens. Erro:\n`' + err.message + '`',
                    }).catch(() => { });
                    return;
                });

                return interaction.editReply({
                    embeds: [{
                        color: 'GREEN',
                        title: '🗑 | Mensagens apagadas',
                        description: `${quantidade} mensagens apagadas`
                    }]
                }).catch(() => { });

            }

            const twoWeeksAgo = Date.now() - 12096e5;

            let messages = await interaction.channel.messages.fetch();

            messages = messages.filter(msg => msg.author.id === targetUser.id && msg.createdTimestamp > twoWeeksAgo);

            if (messages.size === 0) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ | Nenhuma mensagem encontrada',
                    description: `Nenhuma mensagem de ${targetUser.toString()} encontrada.` +
                        `Só consigo apagar mensagens enviadas nos últimos 14 dias.`
                }]
            }).catch(() => { });

            await interaction.channel.bulkDelete(messages).catch((err) => {
                consoleError(err);
                interaction.editReply({
                    content: '❌ | Não foi possível apagar as mensagens. Erro:\n`' + err.message + '`',
                }).catch(() => { });
                return;
            });

            interaction.editReply({
                embeds: [{
                    color: 'GREEN',
                    title: '🗑 | Mensagens apagadas',
                    description: `${messages.size} mensagens apagadas`
                }]
            }).catch(() => { });
        }
        catch (err) { consoleError('[COMANDO:CLEAR] ', err) }

    }
});