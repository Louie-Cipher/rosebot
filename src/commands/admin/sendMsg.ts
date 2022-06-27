import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('send-msg')
        .setDescription('envia uma mensagem pelo bot')
        .addStringOption(option => option
            .setName('mensagem')
            .setDescription('mensagem a ser enviada')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(8192), // MANAGE_MESSAGES

    execute: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const text = interaction.options.getString('mensagem').replaceAll('\\n', '\n');

            if (text.length > 2000) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: 'A mensagem não pode ter mais que 2000 caracteres',
                    description: `Sua mensagem tinha ${text.length} caracteres`
                }]
            });

            const message = await interaction.channel.send({ content: text });

            interaction.editReply({
                embeds: [{
                    color: 'GREEN',
                    title: `Mensagem enviada com sucesso!`,
                    description: `ID da mensagem: \`${message.id}\``,
                }]
            });

        }
        catch (err) { consoleError(err) }

    }
});