import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
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
        ),

    permissions: ['ADMINISTRATOR'],

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: true });

        const query = interaction.options.getString('query');

        try {
            const result = await DB.manager.query(query);

            if (!result || !result.length)
                return interaction.editReply('Nenhum resultado encontrado');

            let resultString = JSON.stringify(result);

            if (resultString.length > 4000) resultString = resultString.substring(0, 3999);

            let embed = new MessageEmbed()
                .setColor('AQUA')
                .setTitle('Resultado da query')
                .setDescription('```\n' + resultString + '\n```');

            interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            consoleError(e);

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