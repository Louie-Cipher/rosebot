import { SlashCommandBuilder } from "@discordjs/builders";
import { Collection, MessageEmbed, User } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { getMember } from "../../db/getFromDB";
import { Command } from "../../structures/Command";

const channelsPlaying = new Collection<string, boolean>();
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default new Command({
    data: new SlashCommandBuilder()
        .setName('emoji-game')
        .setDescription('um jogo de achar o emoji diferente'),

    execute: async ({ interaction }) => {

        if (channelsPlaying.has(interaction.channelId)) return interaction.reply({
            content: 'Ei, já há uma partida desse jogo acontecendo nesse canal.' +
                'Não é possível jogar 2 partidas no mesmo chat simultaneamente.\nTente em outro canal, ou junte-se ao jogo atual ^-^',
            ephemeral: true
        });

        await interaction.deferReply({ ephemeral: false });
        channelsPlaying.set(interaction.channelId, true);

        let boardObj = newBoard();
        let diferente = boardObj.diferente;

        let startEmbed = new MessageEmbed()
            .setColor('YELLOW')
            .setTitle('🔎 Ache o emoji diferente dos demais 🔍')
            .setDescription(boardObj.board)
            .addField('Como jogar',
                `Você tem 30 segundos para achar o emoji diferente dos demais\nEnvie as coordenadas do emoji que é diferente\nExemplo: "B3"`
            );

        await interaction.editReply({ embeds: [startEmbed] });

        let partidas = 1;
        let isWin = false;
        let ranking = new Collection<User, number>();

        let collector = interaction.channel.createMessageCollector({
            filter: msg => msg.content.length === 2 && isCoordinate(msg.content.toLowerCase())
        });

        const timersManager = {
            endingWarn: () =>
                interaction.channel.send({ content: '⏳ Faltam 10 segundos!' }),

            endGame: async () => {
                collector.stop()

                let timeOverEmbed = new MessageEmbed()
                    .setColor('RED')
                    .setTitle('🔎 Emoji game 🔍')
                    .setDescription(`⏳ O tempo acabou!\n\nA resposta certa era **"${diferente.toUpperCase()}"**`)
                    .addField(`Partida #${partidas}`, '\u200b')
                    .addField('Placar final', rankingFormatter(ranking))
                    .setFooter({ text: 'Fim de jogo. Para começar um novo jogo, utilize /emoji-game' });

                interaction.channel.send({ embeds: [timeOverEmbed] });
                channelsPlaying.delete(interaction.channelId);
                await registerDB(ranking);
            },
        }

        let closeToEnd = setTimeout(timersManager.endingWarn, 20_000);
        let endGame = setTimeout(timersManager.endGame, 30_000);

        collector.on('collect', async message => {

            if (isWin === true) return;

            const coordenada = coordinate(message.content.toLowerCase());

            if (coordenada != diferente) return;

            clearTimeout(closeToEnd);
            clearTimeout(endGame);

            message.react(winEmojis[Math.floor(Math.random() * winEmojis.length)]);

            if (ranking.has(message.author)) ranking.set(message.author, (ranking.get(message.author) + 1));
            else ranking.set(message.author, 1);

            const endEmbed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('🔎 Emoji game 🔍')
                .setDescription(`🎉 Parabéns ${message.author}, você acertou!\nA resposta certa era **${diferente.toUpperCase()}**\n\nComeçando um novo jogo em 5 segundos...`)
                .addField(`Partida #${partidas}`, '\u200b')
                .addField('Placar', rankingFormatter(ranking));

            message.channel.send({ embeds: [endEmbed] });

            await sleep(5_000);

            boardObj = newBoard();
            diferente = boardObj.diferente;
            partidas++

            let newEmbed = new MessageEmbed(startEmbed)
                .setDescription(boardObj.board)
                .addField(`Partida #${partidas}`, '\u200b');

            await message.channel.send({ embeds: [newEmbed] });

            closeToEnd = setTimeout(timersManager.endingWarn, 20_000);
            endGame = setTimeout(timersManager.endGame, 30_000);

        });// MessageCollector event end

    }
});

const winEmojis = ['🎉', '🎊', '✅', '✔', '🔎', '🔍'];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function newBoard() {

    const totalEmojis = [
        // Certo    // Diferente
        [':blush:', ':relaxed:'], //
        [':man_office_worker:', ':office_worker:'], //
        [':sleeping_accommodation:', ':bed:'], // 🛌 // 🛏️
        [':motorway:', '🛤️'], // 🛣️ // 🛤️
        [':station:', ':tram:'], // 🚉 // 🚊
        [':house_with_garden:', ':house:'], //🏡 // 🏠
        [':e_mail:', ':envelope:'], //📧 // ✉️
        [':file_folder:', ':open_file_folder:'], // 📁 // 📂
        [':bearded_person:', ':man_beard:'], // 🧔 // 🧔‍♂️
        [':man_office_worker:', ':office_worker:'], //👨‍💼 // 🧑‍💼
        [':smile_cat:', ':smiley_cat:'], // 😸 // 😺
        [':raised_hand:', ':hand_splayed:'], // ✋ // 🖐️
        [':imp:', ':smiling_imp:'], // 👿 // 😈
        [':person_red_hair:', ':man_red_haired:'], // 🧑‍🦰 // 👨‍🦰
        [':hospital:', ':post_office:'], // 🏥 // 🏣
        [':clock430:', ':clock530:'], // 🕟 // 🕠
        [':bookmark_tabs:', ':page_facing_up:'], // 📑 // 📄
        [':woman_surfing:', ':person_surfing:'], // 🏄‍♀️ // 🏄
        [':thunder_cloud_rain:', ':cloud_rain:'], // ⛈️ // 🌧️
    ];

    let board = ':black_large_square: :one: :two: :three: :four: :five: :six: :seven: :eight: :nine:\n';
    const emojis = totalEmojis[Math.floor(Math.random() * totalEmojis.length)];
    const diferente = letters[Math.floor(Math.random() * letters.length)] + numbers[Math.floor(Math.random() * numbers.length)]

    for (const letter of letters) {
        board += `:regional_indicator_${letter}: `;

        for (const number of numbers) {
            const position = `${letter}${number}`;

            if (position !== diferente) board += emojis[0] + ' ';
            else board += emojis[1] + ' ';

            if (number === '9') board += '\n';
        }
    }
    return {
        board: board,
        emojis: emojis,
        diferente: diferente
    }
}

function isCoordinate(string: string) {
    const letras = string.split('');
    return (
        (letters.includes(letras[0].toLowerCase()) && numbers.includes(letras[1])) ||
        (letters.includes(letras[1].toLowerCase()) && numbers.includes(letras[0]))
    )
}

function coordinate(string: string) {
    const letras = string.split('');
    if (letters.includes(letras[0].toLowerCase()) && numbers.includes(letras[1])) return string
    else return letras.reverse().join('')
}

function rankingFormatter(ranking: Collection<User, number>): string {
    const winnersSort = Array.from(ranking).sort((a, b) => b[1] - a[1]);

    let result = '';

    const emojis = ['🥇', '🥈', '🥉'];

    winnersSort.forEach((user, i) => {
        if (i > 9) return;
        const rank = emojis[i] || `**${i + 1}°**`;

        result += `${rank} | ${user[0].tag} | ${user[1]} ponto${user[1] > 1 ? 's' : ''}\n`;
    });

    return result;
}

async function registerDB(ranking: Collection<User, number>) {

    for (const user of ranking) {
        const userDB = await getMember(user[0]);

        if (userDB.emojiGameRecord) {
            if (user[1] > userDB.emojiGameRecord) userDB.emojiGameRecord = user[1];
        }
        else userDB.emojiGameRecord = user[1];

        if (userDB.emojiGameRecord !== user[1]) await membersDBrepo.save(userDB);
    }

}