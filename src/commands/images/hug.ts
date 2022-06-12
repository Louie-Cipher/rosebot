import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('abraço')
        .setDescription('Abraça a pessoa mencionada')
        .addUserOption(option => option
            .setName('user')
            .setDescription('Usuário para abraçar')
            .setRequired(true)
        ),

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('user');

        const embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle('🤗 | Abraço')
            .setDescription(`${interaction.user.toString()} abraçou ${targetUser.toString()}`);

        await interaction.editReply({
            embeds: [embed]
        });

    }
});