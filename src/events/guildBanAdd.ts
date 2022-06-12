import client from "../client";
import { consoleError } from '../utils';
import { BaseGuildTextChannel, MessageEmbed } from "discord.js";
import { bansDBrepo } from "../db/repositories";
import { BansDB } from "../db/entities";

client.on('guildBanAdd', async (ban) => {
    try {

        await sleep(5_000);

        const banDB = await bansDBrepo.findOneBy({ userId: ban.user.id, active: true });

        let embed = new MessageEmbed()
            .setColor('DARK_RED')
            .setTitle('Usuário banido')
            .setDescription(`${ban.user.toString()} foi banido do servidor!`)
            .addField('Nome', ban.user.toString(), true)
            .addField('ID', ban.user.id, true)

        if (banDB) {

            const bansCount = await bansDBrepo.count({ where: { userId: ban.user.id } });

            if (bansCount > 1) embed.addField('Número de vezes banido', `${bansCount}`, true);

            if (banDB.banModId) {
                const mod = ban.guild.members.cache.get(banDB.banModId);
                if (mod) embed.addField('Moderador', mod.toString(), true);
            }
            embed.addField('Motivo', banDB.banReason, true);
        }
        else {
            const banDB = new BansDB();
            banDB.userId = ban.user.id;
            if (ban.reason) banDB.banReason = ban.reason;
            banDB.active = true;
            banDB.bannedAt = new Date();

            await bansDBrepo.save(banDB);

            embed.addField('Motivo', ban.reason || 'não informado', true);
        }

        const logChannel = ban.guild.channels.cache.get('984180752369455234') as BaseGuildTextChannel;

        logChannel.send({ embeds: [embed] });

    } catch (err) { consoleError(err) }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));