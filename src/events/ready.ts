import { ActivityOptions } from "discord.js";
import client from "../client";
import { consoleError, consoleLog } from '../utils';
import { registerCommands } from '../utils/loadCommands';
import voiceXP from '../utils/voiceXP';
import moment from 'moment';

import { isLive } from '../utils/liveAnnouncing';

client.on('ready', async () => {
    try {
        consoleLog(`🌐 | ${client.user.tag} online!`);

        const guild = client.guilds.cache.get('863806003028295700');
        await registerCommands(guild);

        setInterval(async () => { await voiceXP(guild); }, 60_000 * 5);

        setInterval(async () => { await updateStatus(); }, 5_000);

    } catch (err) { consoleError('[EVENT:READY] ', err) }
});

async function updateStatus() {
    try {
        let i = 0;
        setInterval(async () => {

            if (isLive === true) return;

            moment.locale('pt-br');
            const readySince = moment(client.readyAt).fromNow();

            const activities: ActivityOptions[] = [
                { name: `Estou online ${readySince}`, type: 'PLAYING' },
                { name: `${client.users.cache.size} membros no servidor`, type: 'PLAYING' },
                { name: 'Você sabia que eu sou openSource? confira meu código em github.com/Louie-Cipher/rosebot', type: 'PLAYING' },
            ]

            client.user.setActivity(activities[i]);

            i++;
            if (i >= activities.length) i = 0;
        });
    }
    catch (err) { consoleError('[EVENT:READY:UPDATE_STATUS] ', err) }
}