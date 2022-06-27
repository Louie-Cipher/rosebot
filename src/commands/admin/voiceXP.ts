import { SlashCommandBuilder } from "@discordjs/builders";
import voiceXP from "../../utils/voiceXP";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('update-voicexp')
        .setDescription('atualiza o xp por call')
        .setDefaultMemberPermissions(8),

    execute: async ({ interaction }) => {
        try {

            await interaction.reply({
                content: '🎧 atualizando xp por call... ⌛',
                ephemeral: true
            });

            const initTime = Date.now();

            await voiceXP(interaction.guild);

            interaction.editReply({
                embeds: [{
                    color: 'GREEN',
                    title: '🎧 XP por call atualizado',
                    description: `XP de voz atualizado em ${(Date.now() - initTime) / 1000} segundos`,
                }]
            });

        }
        catch (err) { consoleError(err) }

    }
});