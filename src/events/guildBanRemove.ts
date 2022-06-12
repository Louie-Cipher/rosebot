import client from "../client";
import { consoleError, dateTime, localTime } from '../utils';
import { BaseGuildTextChannel, MessageEmbed } from "discord.js";
import { bansDBrepo } from "../db/repositories";

client.on('guildBanRemove', async (ban) => {
    try {

        await sleep(5_000);

        const banDB = await bansDBrepo.findOneBy({ userId: ban.user.id, active: true });

        let embed = new MessageEmbed()
            .setColor('ORANGE')
            .setTitle('Usuário desbanido')

        if (banDB.unbanModId) embed.addField('Desbanido por', banDB.banModId, true);

        embed.addField('Motivo do banimento', banDB.banReason, true);
        embed.addField('Motivo do DESbanimento', banDB.unbanReason, true);

        const banDate = dateTime(localTime(banDB.bannedAt));
        embed.addField('Data do banimento', banDate, true);

        banDB.active = false;
        banDB.unbannedAt = new Date();

        await bansDBrepo.save(banDB);


    } catch (err) { consoleError(err) }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));