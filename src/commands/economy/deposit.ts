import { SlashCommandBuilder } from "@discordjs/builders";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('depositar')
        .setDescription('Deposita suas uwucoins')
        .addIntegerOption(option => option
            .setName('quantidade')
            .setDescription('Quantidade de uwucoins a depositar')
            .setMinValue(1)
            .setRequired(false)
        ),

    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false })

        if (memberDB.wallet === 0) return interaction.editReply({
            embeds: [{
                color: 'RED',
                description: 'Você não tem <:uwucoin:978022888470904832> uwucoins para depositar'
            }]
        });

        const quantity = interaction.options.getInteger('quantidade') || memberDB.wallet;

        if (quantity > memberDB.wallet) return interaction.editReply({
            embeds: [{
                color: 'RED',
                title: 'Valor inválido informado',
                description: 'Você não tem esse valor em carteira\n' +
                    `Você atualmente tem <:uwucoin:978022888470904832>${memberDB.wallet} uwucoins`
            }]
        });

        memberDB.wallet -= quantity;
        memberDB.bank += quantity;

        await membersDBrepo.save(memberDB);

        interaction.editReply({
            embeds: [{
                color: 'GREEN',
                title: '📥 Depósito efetuado com sucesso 📥',
                description: `Você depositou suas <:uwucoin:978022888470904832>${quantity} uwucoins`
            }]
        });

    }
});