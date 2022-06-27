import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";
import liveAnnouncing from "../../utils/liveAnnouncing";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('live-announcing')
        .setDescription('força a atualização do live announcing')
        .setDefaultMemberPermissions(4194304), // MUTE_MEMBERS

    execute: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const rose = interaction.guild.members.cache.get(process.env.roseId);

            await liveAnnouncing(rose.presence);

            interaction.editReply({
                embeds: [{
                    color: 'DARK_PURPLE',
                    title: '✅ <a:twitch_a:978802763855200287> Live announcing atualizado com sucesso!',
                }]
            });

        }
        catch (err) { consoleError(err) }
    }
});