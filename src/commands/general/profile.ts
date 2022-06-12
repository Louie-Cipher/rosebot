import { SlashCommandBuilder } from "@discordjs/builders";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Mostra o perfil de um usuário')
        .addUserOption(option => option
            .setName('usuário')
            .setDescription('O usuário que você deseja ver o perfil')
            .setRequired(false)
        ),
    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false })

        const targetUser = interaction.options.getUser('usuário') || interaction.user;

        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        if (!targetMember) return interaction.editReply({ content: `🤷‍♀️ | ${targetUser.tag} não encontrado no servidor` });

        const targetMemberDB = (targetUser.id === interaction.user.id) ?
            memberDB :
            await membersDBrepo.findOneBy({ id: targetUser.id });

        if (!targetMemberDB) return interaction.editReply({ content: `🤷‍♀️ | ${targetUser.tag} ainda não possui perfil na RoseBot` });

        interaction.editReply({
            embeds: [{
                color: 'AQUA',
                title: `Perfil de ${targetUser.tag}`,
                thumbnail: { url: targetUser.displayAvatarURL({ dynamic: true }) },
                fields: [
                    { name: '💬 Chat XP', value: `${targetMemberDB.chatXP}`, inline: true },
                    { name: '🔊 Call XP', value: `${targetMemberDB.voiceXP}`, inline: true },
                    { name: 'Total XP', value: `${targetMemberDB.chatXP + targetMemberDB.voiceXP}`, inline: true },
                    { name: '<:uwucoin:978022888470904832> Carteira', value: `${targetMemberDB.wallet}`, inline: true },
                    { name: '<:uwucoin:978022888470904832> Banco', value: `${targetMemberDB.bank}`, inline: true },
                    { name: '<:uwucoin:978022888470904832> Total de uwucoins', value: `${targetMemberDB.wallet + targetMemberDB.bank}`, inline: true },
                ]
            }]
        });

    }
});