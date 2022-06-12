import { BaseGuildVoiceChannel, Guild } from "discord.js";
import { consoleError, consoleLog } from ".";
import { getMember } from "../db/getFromDB";
import { membersDBrepo } from "../db/repositories";

export default async function voiceXP(guild: Guild) {

    if (process.env.NODE_ENV === 'debug') consoleLog('atualizando xp de voz');
    try {
        const channels = guild.channels.cache
            .filter(ch => ch.isVoice() && validMembers(ch).size > 1);

        for (const channel of channels.values()) {
            if (!channel.isVoice()) continue;

            const members = validMembers(channel);
            if (!members || members.size <= 1) continue;

            for (const member of members.values()) {

                const memberDB = await getMember(member.user);
                memberDB.voiceXP += 1;

                await membersDBrepo.save(memberDB);
            }
        }
    } catch (err) { consoleError('[VOICE_XP] ', err) }
}
const validMembers = (channel: BaseGuildVoiceChannel) => channel.members.filter(mb => !mb.user.bot && !mb.voice.mute && !mb.voice.deaf);