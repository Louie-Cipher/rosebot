import client from "../client";
import { getMember } from "../db/getFromDB";
import { MembersDBmodel } from "../db/entities";
import { membersDBrepo } from "../db/repositories";
import { consoleError, localTime } from "../utils";
import { BaseGuildTextChannel, Message } from "discord.js";

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild || !message.guild.available) return;

        await emojiSender(message);

        const memberDB = await getMember(message.author);
        await chatXP(memberDB);

    } catch (err) { consoleError('[EVENT:MESSAGE_CREATE] ', err) }
});

async function emojiSender(message: Message) {
    try {
        if (!message.content.startsWith(':') || !message.content.endsWith(':')) return;

        const emojiName = message.content.split(':')[1];
        if (!emojiName || !emojiName.length) return;

        const emoji = (await message.guild.emojis.fetch()).find(emoji => emoji.name === emojiName);
        if (!emoji) return;

        message.delete();

        const webhook = await (message.channel as BaseGuildTextChannel).createWebhook(message.member.displayName, {
            avatar: message.author.displayAvatarURL({ dynamic: true }),
            reason: 'Emoji Sender'
        })
        await webhook.send(`${emoji}`);
        webhook.delete();
    }
    catch (err) { consoleError('[MESSAGE:EMOJI_SENDER] ',err) }
}

async function chatXP(memberDB: MembersDBmodel) {
    try {
        const lastMessage = memberDB.lastMessage;

        if (lastMessage && Date.now() - localTime(lastMessage).getTime() < 13_000) return;

        memberDB.chatXP += 1;
        memberDB.lastMessage = new Date();

        await membersDBrepo.save(memberDB);
    }
    catch (err) { consoleError('[MESSAGE:CHAT_XP] ', err) }
}