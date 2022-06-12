import client from "../client";
import { consoleError, consoleLog } from '../utils';
import { registerCommands } from '../utils/loadCommands';
import voiceXP from '../utils/voiceXP';

client.on('ready', async () => {
    try {
        consoleLog(`🌐 | ${client.user.tag} online!`);

        const guild = client.guilds.cache.get('863806003028295700');
        await registerCommands(guild);

        setInterval(async () => { await voiceXP(guild); }, 60_000 * 5);

    } catch (err) { consoleError('[EVENT:READY] ', err) }
});