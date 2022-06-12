import client from "../client";
import { consoleError } from "../utils";
import liveAnnouncing from "../utils/liveAnnouncing";

const roseId = process.env.roseId;

client.on('presenceUpdate', async (oldPresence, newPresence): Promise<any> => {
    try { if (newPresence.user.id === roseId) liveAnnouncing(newPresence, oldPresence); }
    catch (err) { consoleError('[EVENT:PRESENCE_UPDATE] ', err) }
});