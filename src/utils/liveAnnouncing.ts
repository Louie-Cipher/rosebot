import { BaseGuildTextChannel, MessageActionRow, MessageButton, MessageEmbed, Presence } from "discord.js";
import { consoleError } from '.';
import client from "../client";

const announcingChannelId = '976262482488328263';

let isLive = false;

const buttons = new MessageActionRow()
    .setComponents([
        new MessageButton()
            .setLabel('Assistir na twitch')
            .setURL('https://www.twitch.tv/roselicia')
            .setStyle('LINK')
    ]);

export { isLive };

export default async function liveAnnouncing(newPresence: Presence, oldPresence?: Presence): Promise<any> {

    try {
        const wasLive = oldPresence && oldPresence.activities.length > 0 && oldPresence.activities.some(ac => ac.type === 'STREAMING');
        isLive = newPresence.activities.length > 0 && newPresence.activities.some(ac => ac.type === 'STREAMING');

        if (wasLive === true && isLive === false) // Stream ended
            return client.user.setActivity();

        if (wasLive === true && isLive === true) // Stream is still live
            return;

        if (isLive === false) return; // Not streaming
        // Else => streaming

        const liveActivity = newPresence.activities.find(activity => activity.type === 'STREAMING');

        const liveThumbnail = liveActivity.assets?.largeImageURL() || liveActivity.assets?.smallImageURL();

        let announcingEmbed = new MessageEmbed()
            .setColor('PURPLE')
            .setTitle('<a:twitch_a:978802763855200287> Rose está ao vivo :3 <a:twitch_a:978802763855200287>')
            .setDescription(`Jogando **${liveActivity.state}**\n` +
                `"${liveActivity.details}"\n\n` +
                `Vá assistir e aproveitar a stream! OwO`)

        if (liveThumbnail && liveThumbnail != null) announcingEmbed.setThumbnail(liveThumbnail);

        const channel = client.channels.cache.get(announcingChannelId) as BaseGuildTextChannel;

        channel.send({
            embeds: [announcingEmbed],
            components: [buttons]
        });
        client.user.setActivity({ name: `Rose está ao vivo :3`, type: 'STREAMING', url: 'https://www.twitch.tv/roselicia' });
    }
    catch (err) { consoleError(err) }
}