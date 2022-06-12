import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('saque')
        .setDescription('Saca suas uwucoins')
        .addIntegerOption(option => option
            .setName('quantidade')
            .setDescription('Quantidade de uwucoins a sacar')
            .setMinValue(1)
            .setRequired(false)
        ),

    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false })

        if (memberDB.bank === 0) {
            let embed = new MessageEmbed()
                .setColor('RED')
                .setDescription('Você não tem <:uwucoin:978022888470904832> para sacar');

            return interaction.editReply({ embeds: [embed] });
        }
        const quantity = interaction.options.getInteger('quantidade') || memberDB.bank;

        if (quantity > memberDB.bank) return interaction.editReply({
            embeds: [{
                color: 'RED',
                title: 'Valor inválido informado',
                description: 'Você não tem esse valor no banco\n' +
                    `Você atualmente tem <:uwucoin:978022888470904832>${memberDB.bank} uwucoins`
            }]
        });

        memberDB.wallet += quantity;
        memberDB.bank -= quantity;

        await membersDBrepo.save(memberDB);

        interaction.editReply({
            embeds: [{
                color: 'GREEN',
                title: '📤 Saque efetuado com sucesso 📤',
                description: `Você sacou suas <:uwucoin:978022888470904832>${quantity} uwucoins`
            }]
        });

    }
});