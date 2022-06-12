import { SlashCommandBuilder } from "@discordjs/builders";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('pix')
        .setDescription('transfere uwucoins para alguém')
        .addUserOption(option => option
            .setName('usuário')
            .setDescription('O usuário que você deseja transferir')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('quantidade')
            .setDescription('Quantidade de uwucoins a transferir')
            .setMinValue(1)
            .setRequired(false)
        ),

    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false });

        if (memberDB.wallet === 0) return interaction.editReply({
            embeds: [{ color: 'RED', description: 'Você não tem <:uwucoin:978022888470904832>uwucoins para transferir' }]
        });

        const quantity = interaction.options.getInteger('quantidade') || memberDB.wallet;

        if (quantity > memberDB.wallet)
            return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: 'Valor inválido informado',
                    description: 'Você não tem esse valor em carteira\n' +
                        `Você atualmente tem <:uwucoin:978022888470904832>${memberDB.wallet} uwucoins`
                }]
            });

        const targetUser = interaction.options.getUser('usuário');
        if (!interaction.guild.members.cache.has(targetUser.id)) return interaction.editReply({
            embeds: [{ color: 'RED', description: 'Usuário informado não está no servidor' }]
        });

        const targetMemberDB = await membersDBrepo.findOneBy({ id: targetUser.id });

        if (!targetMemberDB) return interaction.editReply({
            embeds: [{ color: 'RED', description: 'Usuário informado não possui um perfil na RoseBot' }]
        });

        targetMemberDB.wallet += quantity;
        memberDB.wallet -= quantity;

        await membersDBrepo.save(memberDB);
        await membersDBrepo.save(targetMemberDB);


        interaction.editReply({
            content: `${targetUser.toString()}`, embeds: [{
                color: 'GREEN',
                title: '📤 Transferência efetuada com sucesso 📥',
                description: `Você transferiu <:uwucoin:978022888470904832>${quantity} uwucoins para ${targetUser.toString()}`
            }]
        });

    }
});