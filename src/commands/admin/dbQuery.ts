import { SlashCommandBuilder } from "@discordjs/builders";
import { DB } from "../../db";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('db-query')
        .setDescription('Executa uma query no banco de dados')
        .addStringOption(option => option
            .setName('query')
            .setRequired(true)
            .setDescription('A query a ser executada')
        )
        .setDefaultMemberPermissions(8), // ADMINISTRATOR

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: true });

        const query = interaction.options.getString('query');

        try {
            const result = await DB.manager.query(query);

            if (!result || !result.length)
                return interaction.editReply('Essa query não retornou nenhum resultado.');

            let resultString = JSON.stringify(result);

            if (resultString.length > 4000) resultString = resultString.substring(0, 3999);

            interaction.editReply({
                embeds: [{
                    color: 'AQUA',
                    title: 'Resultado da query',
                    description: '```\n' + resultString + '\n```'
                }]
            });
        }
        catch (e) {
            consoleError('[COMMAND:DB_QUERY]\n', e);

            interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: 'Erro ao executar a query',
                    description: `${e}`
                }]
            }).catch(() => { });
        }
    }
});