import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

const walletOrBankOption = new SlashCommandStringOption()
    .setName('carteira-ou-banco')
    .setDescription('se editar a carteira ou banco')
    .setChoices(
        { name: 'carteira', value: 'wallet' },
        { name: 'banco', value: 'bank' },
    );

const userOption = new SlashCommandUserOption()
    .setName('user')
    .setDescription('usuário para ter o saldo editado')
    .setRequired(true)

export default new Command({
    data: new SlashCommandBuilder()
        .setName("edit-money")
        .setDescription("edita as uwucoins de um usuário")
        .setDefaultMemberPermissions(32) // MANAGE_SERVER
        .addSubcommand(subCmd => subCmd // adicionar
            .setName("adicionar")
            .setDescription("soma esse valor ao saldo atual")
            .addUserOption(userOption)
            .addStringOption(walletOrBankOption)
            .addIntegerOption(option => option
                .setName("valor")
                .setDescription("valor a adicionar")
                .setMinValue(0)
            )
        )
        .addSubcommand(subCmd => subCmd // subtrair
            .setName('subtrair')
            .setDescription('subtrai esse valor do saldo atual')
            .addUserOption(userOption)
            .addStringOption(walletOrBankOption)
            .addIntegerOption(option => option
                .setName("valor")
                .setDescription("valor a subtrair")
                .setMinValue(0)
            )
        )
        .addSubcommand(subCmd => subCmd // definir
            .setName('definir')
            .setDescription('define novo saldo, substituindo o antigo')
            .addUserOption(userOption)
            .addStringOption(walletOrBankOption)
            .addIntegerOption(option => option
                .setName("valor")
                .setDescription("valor a definir")
                .setMinValue(0)
            )
        ),

    execute: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const mode = interaction.options.getSubcommand(true);
            const isWallet = (interaction.options.getString('carteira-ou-banco') === 'wallet');
            const value = interaction.options.getInteger('valor');
            const targetMember = interaction.options.getUser('user');

            const memberDB = await membersDBrepo.findOneBy({ id: targetMember.id });

            if (!memberDB) return interaction.editReply({
                embeds: [{
                    color: 'ORANGE',
                    title: 'Usuário não encontrado no banco de dados',
                    description: 'Esse usuário não possui um perfil na RoseBot'
                }]
            });

            let embed = new MessageEmbed()
                .setColor('GREEN')
                .setDescription('✅ Saldo atualizado com sucesso')
                .addFields([
                    { name: 'Usuário', value: targetMember.toString() },
                    { name: 'Saldo em carteira anterior', value: `${memberDB.wallet}`, inline: true },
                    { name: 'Saldo no banco anterior', value: `${memberDB.bank}`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: false },
                ]);

            if (mode === 'adicionar')
                isWallet ? memberDB.wallet += value : memberDB.bank += value;

            else if (mode === 'subtrair') {
                let newValue = isWallet ? memberDB.wallet -= value : memberDB.bank -= value;
                if (newValue < 0) isWallet ? memberDB.wallet = 0 : memberDB.bank = 0;
            }

            else if (mode === 'definir')
                isWallet ? memberDB.wallet = value : memberDB.bank = value;

            await membersDBrepo.save(memberDB);

            embed.addFields([
                { name: 'Novo saldo em carteira', value: `${memberDB.wallet}`, inline: true },
                { name: 'Novo saldo no banco', value: `${memberDB.bank}`, inline: true },
            ]);

            interaction.editReply({ embeds: [embed] });

        } catch (err) {
            consoleError("[COMANDO:EDIT_MONEY] ", err);

            interaction.followUp({
                embeds: [{
                    color: 'RED',
                    title: 'Erro ao executar esse comando',
                    description: 'Erro: \n```\n' + `${err}` + '\n```'
                }],
                ephemeral: true
            }).catch(() => { });
        }
    },
});