import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";
import { localTime } from "../../utils";

const uwucoin = '<:uwucoin:978022888470904832>';
const twitchSubRole = "976548310112419851";
const boosterRole = "868886134602756158";
const rainbow_hype = '<a:rainbow_hype:866480734834130945>';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Resgata suas uwucoins diárias'),

    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false })

        const member = interaction.guild.members.cache.get(interaction.user.id);

        const lastDaily = memberDB.lastDaily;

        if (lastDaily) {
            const now = new Date();

            if (now.getDate() === lastDaily.getDate() && now.getMonth() === lastDaily.getMonth() && now.getFullYear() === lastDaily.getFullYear()) {

                const s = memberDB.dailyCombo > 1 ? 's' : '';

                const comboString = memberDB.dailyCombo === 30 ? '30 ou mais' : `${memberDB.dailyCombo}`;

                let embed = new MessageEmbed()
                    .setColor('YELLOW')
                    .setTitle('Você já pegou suas uwucoins diárias hoje!')
                    .setDescription(`Volte amanhã para pegar novamente!\n` +
                        `Você tem um combo de ${comboString} dia${s} seguido${s} de daily\n\n` +
                        `**DICA:** Você sabia que sendo sub na twitch ou booster no servidor,\nvocê ganha mais uwucoins diárias?`);

                if (memberDB.dailyCombo === 30)
                    embed.addField(`${rainbow_hype} Você tem o combo máximo no daily! ${rainbow_hype}`,
                        `Parabéns, continue resgatando todos os dias para manter seu combo ${rainbow_hype}`);

                return interaction.editReply({ embeds: [embed] });
            }

            if (now.getDate() - lastDaily.getDate() > 1 || now.getMonth() - lastDaily.getMonth() > 1 || now.getFullYear() - lastDaily.getFullYear() > 1)
                memberDB.dailyCombo = 0;
        }

        memberDB.lastDaily = new Date();

        const dailyCombo = 5 * memberDB.dailyCombo;

        const subMultiplier = member.roles.cache.has(twitchSubRole) ? 1.2 : 1;
        const boosterMultiplier = member.roles.cache.has(boosterRole) ? 1.2 : 1;

        const newCoins = Math.round((50 + dailyCombo) * subMultiplier * boosterMultiplier);

        memberDB.wallet += newCoins;
        if (memberDB.dailyCombo < 30) memberDB.dailyCombo += 1;

        const s = memberDB.dailyCombo > 1 ? 's' : '';
        const comboString = memberDB.dailyCombo === 30 ? '30 ou mais' : `${memberDB.dailyCombo}`;

        await membersDBrepo.save(memberDB);

        let embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle('Você pegou suas uwucoins diárias!')
            .setDescription(`Você ganhou ${uwucoin} ${newCoins} uwucoins!\n` +
                `Você tem um combo de ${comboString} dia${s} seguido${s} de daily\n\n` +
                `**DICA:** Você sabia que sendo sub na twitch ou booster no servidor,\nvocê ganha mais uwucoins diárias?`);

        if (memberDB.dailyCombo === 30)
            embed.addField(`${rainbow_hype} Você tem o combo máximo no daily! ${rainbow_hype}`,
                `Parabéns, continue resgatando todos os dias para manter seu combo ${rainbow_hype}`);

        interaction.editReply({
            embeds: [embed]
        }).catch(() => { });

    }
});