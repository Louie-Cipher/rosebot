import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Message, MessageActionRow, MessageButton, MessageEmbed, MessageOptions } from "discord.js";
import { FindRelationsNotFoundError } from "typeorm";
import { MembersDBmodel } from "../../db/entities";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Mostra o ranking do servidor')
        .addStringOption(option => option
            .setName('tipo')
            .setDescription('O tipo de ranking que você deseja ver')
            .setRequired(true)
            .setChoices(
                { name: 'chat XP', value: 'chatXP' },
                { name: 'call XP', value: 'voiceXP' },
                { name: 'carteira', value: 'wallet' },
                { name: 'banco', value: 'bank' },
            )
        ),
    execute: async ({ client, interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const rankType = interaction.options.getString('tipo');

        let currentPage = 1;

        const page = await rankPage(client, currentPage, rankType);
        const message = await interaction.editReply(page) as Message;
        const collector = message.createMessageComponentCollector({
            filter: (int) => int.user.id === interaction.user.id && int.isButton(),
            idle: 180_000
        });

        collector.on('collect', async (buttonInt) => {
            if (!buttonInt.isButton()) return;
            buttonInt.deferReply({ ephemeral: false }).then(() => buttonInt.deleteReply().catch(() => { }));

            if (buttonInt.customId === 'back') {
                if (currentPage === 1) FindRelationsNotFoundError;
                currentPage--;
            }
            else if (buttonInt.customId === 'next')
                currentPage++;

            const page = await rankPage(client, currentPage, rankType);

            interaction.editReply(page);
        }).once('end', (): Promise<any> => interaction.editReply({ components: [] }).catch(() => { }));
    }
});

const medals = ['🥇', '🥈', '🥉'];
const translatedRankTypes = {
    chatXP: 'XP por chat',
    voiceXP: 'XP por call',
    wallet: 'uwucoins em carteira',
    bank: 'uwucoins no banco',
}
async function rankPage(client: Client, pageNum: number, rankType: string): Promise<MessageOptions> {

    const rankMembers: MembersDBmodel[] = await membersDBrepo.find({ order: { [rankType]: 'DESC' }, take: 10, skip: (pageNum - 1) * 10 });

    let embed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle(`Ranking de ${translatedRankTypes[rankType]}`)
        .setDescription(`**Página ${pageNum}**`);

    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setEmoji('⬅')
            .setCustomId('back')
            .setStyle('SECONDARY')
            .setDisabled(pageNum === 1),
        new MessageButton()
            .setEmoji('➡')
            .setCustomId('next')
            .setStyle('SECONDARY')
    );

    for (let i = 0; i < 10; i++) {

        let userDB = rankMembers[i];

        if (!userDB) {
            row.components[1].setDisabled(true);
            break;
        }

        let usertag = '';
        if (userDB.usertag) usertag = userDB.usertag;
        else {
            let user = await client.users.fetch(userDB.id);
            if (user) usertag = user.username;
            else continue;
        }
        const rankNum = (pageNum === 1) ? medals[i] || `${i + 1}°` : `${(i + 1) + (pageNum - 1) * 10}°`;

        embed.addField(`${rankNum} - ${usertag}`, `${userDB[rankType]}`);
    }

    return {
        embeds: [embed],
        components: [row]
    }

}