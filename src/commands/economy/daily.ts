import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";
import { localTime } from "../../utils";

const twitchSubRole = "976548310112419851";
const boosterRole = "868886134602756158";

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

            const dailyLocal = localTime(memberDB.lastDaily);

            if (now.getDate() === dailyLocal.getDate() && now.getMonth() === dailyLocal.getMonth() && now.getFullYear() === dailyLocal.getFullYear()) {

                const s = memberDB.dailyCombo > 1 ? 's' : '';

                let embed = new MessageEmbed()
                    .setColor('YELLOW')
                    .setTitle('Você já pegou suas uwucoins diárias hoje!')
                    .setDescription(`Volte amanhã para pegar novamente!\n` +
                        `Você tem um combo de ${memberDB.dailyCombo} dia${s} seguido${s} de daily\n\n` +
                        `**DICA:** Você sabia que sendo sub na twitch ou booster no servidor,\nvocê ganha mais uwucoins diárias?`);

                return interaction.editReply({ embeds: [embed] });
            }

            if (now.getDate() - dailyLocal.getDate() > 1 || now.getMonth() - dailyLocal.getMonth() > 1 || now.getFullYear() - dailyLocal.getFullYear() > 1)
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

        await membersDBrepo.save(memberDB);

        interaction.editReply({
            embeds: [{
                color: 'AQUA',
                title: 'Você pegou suas uwucoins diárias!',
                description: `Você ganhou <:uwucoin:978022888470904832>${newCoins} uwucoins hoje!\n` +
                    `Você tem um combo de ${memberDB.dailyCombo} dia${s} seguido${s} de daily\n\n` +
                    `**DICA:** Você sabia que sendo sub na twitch ou booster no servidor,\nvocê ganha mais uwucoins diárias?`
            }]
        }).catch(() => { });

    }
});