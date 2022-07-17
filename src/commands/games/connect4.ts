import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, User, MessageEmbed, Message, Collection, MessageActionRow, MessageButton } from "discord.js";
import { getMember } from "../../db/getFromDB";
import { membersDBrepo } from "../../db/repositories";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('connect4')
        .setDescription('o jogo de colocar 4 peças em linha')
        .addUserOption(option => option
            .setName('player2')
            .setDescription('o jogador para desafiar')
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('aposta')
            .setDescription('valor em uwucoins para apostar')
            .setMinValue(1)
            .setRequired(false)
        ),

    execute: async ({ interaction }) => {
        await interaction.deferReply({ ephemeral: false });
        const player2 = interaction.options.getUser('player2');
        const betValue = interaction.options.getInteger('aposta');

        if (player2) multiPlayer(interaction, player2, betValue);
        else singlePlayer(interaction);
    }
});

const empty = '<:connect4_empty:994025675897970698>';
const p1Emoji = '<:connect4_red:994025819515138068>';
const p2Emoji = '<:connect4_yellow:994025900674908260>';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const restartButton = [new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setLabel('Novo jogo')
            .setCustomId('restart')
            .setStyle('SUCCESS')
            .setEmoji('🔄')
    )];

async function multiPlayer(interaction: CommandInteraction, player2: User, betValue: number): Promise<any> {

    interaction.deleteReply();

    const player1 = interaction.user;

    let isBet = false;
    let p1DB = await getMember(player1);
    let p2DB = await getMember(player2);

    if (betValue) {
        if (p1DB.wallet < betValue)
            return interaction.editReply({ content: `Você não tem uwucoins suficientes para essa aposta` });

        if (p2DB.wallet < betValue)
            return interaction.editReply({ content: `${player2.username} não tem uwucoins suficientes para essa aposta` });

        isBet = true;
    }

    let board = initBoard();
    let roundPlayer = player1;

    let startEmbed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle('🔴 Connect 4 🟡')
        .setFields([{ name: 'Vez de', value: roundPlayer.toString() }])
        .setDescription(boardToString(board));
    if (isBet) startEmbed.setFooter({ text: `Valor da aposta: ${betValue} uwucoins` });

    const message = await interaction.channel.send({
        content: `${player1} vs ${player2}`,
        embeds: [startEmbed],
        components: buttons(board)
    });

    const collector = message.createMessageComponentCollector({
        filter: (int) => int.isButton() && [player1.id, player2.id].includes(int.user.id)
    });

    let p1Victories = 0;
    let p2Victories = 0;

    let p1Profit = 0;
    let p2Profit = 0;

    let ties = 0;
    let games = 1;

    let round = 0;
    let wo = setTimeout(WO, 180_000);

    let restartPlayers = new Collection<string, User>();

    collector.on('collect', async (buttonInt): Promise<any> => {
        if (!buttonInt.isButton()) return;
        buttonInt.deferReply({ ephemeral: false }).then(() => buttonInt.deleteReply().catch(() => { }));

        if (buttonInt.customId === 'restart') {

            if (isBet) {
                if (p1DB.wallet < betValue) {
                    interaction.reply({ content: `${player1.toString()} não tem uwucoins suficientes para essa aposta` });
                    return collector.stop();
                }
                if (p2DB.wallet < betValue) {
                    interaction.reply({ content: `${player2.toString()} não tem uwucoins suficientes para essa aposta` });
                    return collector.stop();
                }
                startEmbed.setFooter({ text: `Valor da aposta: ${betValue} uwucoins` });
            }

            if (restartPlayers.has(buttonInt.user.id)) return;

            restartPlayers.set(buttonInt.user.id, player1);

            if (restartPlayers.size < 2) return;

            clearTimeout(wo);
            wo = setTimeout(WO, 180_000);

            games++;
            restartPlayers.clear();
            roundPlayer = p1Victories < p2Victories ? player1 : player2;

            board = initBoard();

            startEmbed.setTitle('🔴 Connect 4 🟡')
                .setDescription(boardToString(board))
                .setFields([{ name: 'Vez de', value: roundPlayer.toString() }]);

            return message.edit({
                content: `${player1} vs ${player2}`,
                embeds: [startEmbed],
                components: buttons(board)
            });
        }

        if (buttonInt.user.id !== roundPlayer.id) return;
        clearTimeout(wo);
        round++;

        const columnChoice = parseInt(buttonInt.customId);
        const playerEmoji = roundPlayer === player1 ? p1Emoji : p2Emoji;
        const playerMove = insertOnColum(board, columnChoice, playerEmoji);

        board = playerMove.board;

        if (checkWin(board, playerMove.addedSpace) === true) {

            roundPlayer.id === player1.id ? p1Victories++ : p2Victories++;

            let embed = new MessageEmbed()
                .setColor('AQUA')
                .setDescription(boardToString(board))
                .setTitle(`${playerEmoji} ${roundPlayer.username} venceu! ${playerEmoji}`)
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias de ${player1.username}`, value: `${p1Victories}`, inline: true },
                    { name: `Vitórias de ${player2.username}`, value: `${p2Victories}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            if (isBet) {
                if (roundPlayer.id === player1.id) {
                    p1Profit += betValue;
                    p1DB.wallet += betValue;
                }
                else {
                    p2Profit += betValue;
                    p2DB.wallet += betValue;
                }

                await membersDBrepo.save(p1DB);
                await membersDBrepo.save(p2DB);

                const winnerProfit = roundPlayer.id === player1.id ? p1Profit : p2Profit;
                embed.addField(`Lucro de ${roundPlayer.toString()}`, `${winnerProfit} uwucoins`);
            }

            return message.edit({ embeds: [embed], components: restartButton });
        }

        if (board.filter(emoji => emoji === empty).size === 0) {
            ties++;

            let embed = new MessageEmbed()
                .setColor('AQUA')
                .setTitle(`🔴 Empate! Todos os espaços preenchidos 🟡`)
                .setDescription(boardToString(board))
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias de ${player1.username}`, value: `${p1Victories}`, inline: true },
                    { name: `Vitórias de ${player2.username}`, value: `${p2Victories}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            return message.edit({ embeds: [embed] });
        }

        roundPlayer = roundPlayer === player1 ? player2 : player1;
        startEmbed.setDescription(boardToString(board))
            .setFields([{ name: 'Vez de', value: roundPlayer.toString() }]);

        message.edit({
            embeds: [startEmbed],
            components: buttons(board)
        });
        wo = setTimeout(WO, 180_000);
    })
        .once('end', async (): Promise<any> => {
            message.edit({ components: [] }).catch(() => { });
            clearTimeout(wo);
        });

    function WO() {
        const winner = roundPlayer === player1 ? player2 : player1;
        const winnerEmoji = roundPlayer === player1 ? '🟡' : '🔴';

        startEmbed.setDescription(boardToString(board))
            .setTitle(`${winnerEmoji} Connect 4 ${winnerEmoji}`)
            .setFields([{ name: '\u200b', value: `${roundPlayer.toString()} desistiu.\n${winner.toString()} ganhou!` }]);

        message.edit({
            embeds: [startEmbed],
            components: buttons(board)
        });
        collector.stop();
    }
}

async function singlePlayer(interaction: CommandInteraction): Promise<any> {

    let board = initBoard();

    let embed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle('🔴 Connect 4 🟡')
        .setDescription(boardToString(board));

    const message = await interaction.editReply({
        embeds: [embed],
        components: buttons(board)
    }) as Message;

    const collector = message.createMessageComponentCollector({
        filter: (int) => int.isButton()
    });

    let victories = 0;
    let defeats = 0;
    let ties = 0;
    let games = 1;

    collector.on('collect', async (buttonInt): Promise<any> => {
        if (!buttonInt.isButton()) return;
        buttonInt.deferReply({ ephemeral: false }).then(() => buttonInt.deleteReply().catch(() => { }));

        if (buttonInt.customId === 'restart') {
            games++;
            board = initBoard();
            embed.setTitle('🔴 Connect 4 🟡')
                .setDescription(boardToString(board))

            return message.edit({
                embeds: [embed],
                components: buttons(board)
            });
        }

        const columnChoice = parseInt(buttonInt.customId);

        let playerNewMove = insertOnColum(board, columnChoice, p1Emoji);

        board = playerNewMove.board;

        if (checkWin(board, playerNewMove.addedSpace) === true) {
            victories++;
            embed.setDescription(boardToString(board));
            embed.setTitle(`🔴 Você venceu! 🔴`)
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias`, value: `${victories}`, inline: true },
                    { name: 'Derrotas', value: `${defeats}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            return interaction.editReply({ embeds: [embed], components: restartButton });
        }

        if (board.filter(emoji => emoji === empty).size === 0) {
            ties++;
            embed.setDescription(boardToString(board));
            embed.setTitle(`${p1Emoji} Empate! Todos os espaços preenchidos ${p2Emoji}`)
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias`, value: `${victories}`, inline: true },
                    { name: 'Derrotas', value: `${defeats}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            return interaction.editReply({ embeds: [embed], components: restartButton });
        }

        let playerMoveEmbed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle('🔴 Connect 4 🟡')
            .setDescription(boardToString(board));

        interaction.editReply({
            embeds: [playerMoveEmbed],
            components: buttons(board)
        });

        await sleep(750);

        let botMove = Math.floor(Math.random() * 8) + 1;
        // Check if bot move is valid column
        while (board.get(botMove) !== empty) {
            botMove = Math.floor(Math.random() * 8) + 1;
        }

        let botNewMove = insertOnColum(board, botMove, p2Emoji);

        board = botNewMove.board;

        if (checkWin(board, botNewMove.addedSpace) === true) {
            defeats++;
            embed.setTitle('🟡 Eu venci! 🟡');
            embed.setDescription(boardToString(board))
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias`, value: `${victories}`, inline: true },
                    { name: 'Derrotas', value: `${defeats}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            return interaction.editReply({ embeds: [embed], components: restartButton });
        }

        if (board.filter(emoji => emoji === empty).size === 0) {
            ties++;
            embed.setDescription(boardToString(board));
            embed.setTitle(`${p1Emoji} Empate! Todos os espaços preenchidos ${p2Emoji}`)
                .setFields([
                    { name: 'Partidas jogadas', value: `${games}`, inline: true },
                    { name: `Vitórias`, value: `${victories}`, inline: true },
                    { name: 'Derrotas', value: `${defeats}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                ]);

            return interaction.editReply({ embeds: [embed], components: restartButton });
        }

        let botMoveEmbed = new MessageEmbed(playerMoveEmbed)
            .setDescription(boardToString(board));

        interaction.editReply({
            embeds: [botMoveEmbed],
            components: buttons(board)
        });

    });
    collector.once('end', (): any => interaction.editReply({ components: [] }).catch(() => { }));
}

function checkWin(board: Collection<number, string>, newlyAdded: number) {

    let newlyAddedLine = Math.ceil(newlyAdded / 8);
    let newlyAddedColumn = newlyAdded % 8;

    let pastEmoji = board.get(newlyAddedLine);
    let sequence = 0;

    let lineStartingPoint = newlyAdded;
    while (lineStartingPoint % 8 !== 1) { lineStartingPoint-- }

    // Check horizontal - line
    for (let i = 0; i < 8; i++) {
        let newEmoji = board.get(lineStartingPoint + i);
        if (newEmoji !== empty && newEmoji === pastEmoji) sequence++;
        else sequence = 0;

        if (sequence === 3) { return true }
        pastEmoji = newEmoji;
    }
    sequence = 0;

    // Check vertical - column
    for (let i = 0; i < 41; i += 8) {
        let newEmoji = board.get(newlyAddedColumn + i);
        if (newEmoji !== empty && newEmoji === pastEmoji) sequence++;
        else sequence = 0;

        if (sequence === 3) { return true }
        pastEmoji = newEmoji;
    }
    sequence = 0;

    let startingPoint = newlyAdded;
    // Check diagonal - top left to bottom right
    if (![6, 7, 8, 15, 16, 24, 25, 33, 34, 41, 42, 43].includes(newlyAdded)) {

        while (startingPoint > 7 && startingPoint % 8 !== 1) { startingPoint -= 9 }

        for (let i = 0; i <= 48; i += 9) {
            let newEmoji = board.get(startingPoint + i);
            if (newEmoji !== empty && newEmoji === pastEmoji) sequence++;
            else sequence = 0;

            if (sequence === 3) { return true }
            pastEmoji = newEmoji;
        }
    }
    sequence = 0;

    startingPoint = newlyAdded;
    // Check diagonal - top right to bottom left
    if (![1, 2, 3, 9, 10, 17, 32, 39, 40, 46, 47, 48].includes(newlyAdded)) {

        while (startingPoint > 7 && startingPoint % 8 !== 0) { startingPoint -= 7 }

        for (let i = 0; i <= 48; i += 7) {
            let newEmoji = board.get(startingPoint + i);
            if (newEmoji !== empty && newEmoji === pastEmoji) sequence++;
            else sequence = 0;

            if (sequence === 3) { return true }
            pastEmoji = newEmoji;
        }
    }
    return false;
}

function insertOnColum(board: Collection<number, string>, columnNum: number, playerEmoji: string) {

    let newBoard = board;

    let addedSpace = 0;

    for (let currentSpace = columnNum + 40; currentSpace >= 1; currentSpace -= 8) {

        if (newBoard.get(currentSpace) === empty) {
            newBoard.set(currentSpace, playerEmoji);
            addedSpace = currentSpace;
            break;
        }

    }

    return {
        board: newBoard,
        addedSpace: addedSpace
    }
}

const buttonsEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
function buttons(board: Collection<number, string>): MessageActionRow[] {
    let rows = [new MessageActionRow(), new MessageActionRow()];
    for (let i = 1; i <= 8; i++) {
        const disabled = (board.get(i) !== empty);

        rows[Math.floor((i - 1) / 4)].addComponents(
            new MessageButton()
                .setEmoji(buttonsEmojis[i - 1])
                .setCustomId(`${i}`)
                .setStyle('SECONDARY')
                .setDisabled(disabled)
        )
    }
    return rows;
}

function boardToString(board: Collection<number, string>) {

    let string = '';

    for (let i = 1; i <= 48; i++) {
        string += `${board.get(i)}`;

        if (i % 8 === 0) string += '\n';
    }
    for (let i = 0; i < 8; i++) {
        string += buttonsEmojis[i];
    }

    return string;
}

function initBoard(): Collection<number, string> {
    let board = new Collection<number, string>();
    for (let i = 1; i <= 48; i++) board.set(i, empty);
    return board
}