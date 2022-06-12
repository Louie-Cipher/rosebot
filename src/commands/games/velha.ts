import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, Collection, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import { MembersDBmodel } from "../../db/entities";
import { Command } from "../../structures/Command";
import { membersDBrepo } from "../../db/repositories";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('velha')
        .setDescription('joga uma partida de jogo da velha')
        .addUserOption(option => option
            .setName('usuário')
            .setDescription('usuário para desafiar')
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('aposta')
            .setDescription('valor da aposta em uwucoins')
            .setMinValue(1)
            .setRequired(false)
        ),
    execute: async ({ interaction, memberDB }) => {

        await interaction.deferReply({ ephemeral: false, fetchReply: true });

        const player2 = interaction.options.getUser('usuário');
        const betValue = interaction.options.getInteger('aposta') || 0;

        if (!player2) singlePlayer(interaction, memberDB, betValue);
        else multiPlayer(interaction, player2, memberDB, betValue);
    }
});

const empty = '⬜';
const p1emoji = '❎';
const p2emoji = '⭕';
const restartButton = new MessageActionRow().addComponents(
    new MessageButton()
        .setEmoji('🔁')
        .setStyle('SUCCESS')
        .setLabel('Novo jogo')
        .setCustomId('restart')
);

async function singlePlayer(interaction: CommandInteraction, memberDB: MembersDBmodel, betValue: number): Promise<any> {

    let isBet = false;

    if (betValue !== 0) {

        return interaction.editReply({
            embeds: [{
                color: 'ORANGE',
                title: 'Modo de jogo indisponível no momento',
                description: 'Por enquanto, apostas vs IA com apostas não estão disponíveis\n'+
                'Você ainda pode jogar contra mim sem apostar, ou apostar com outro jogador'
            }]
        })

        if (betValue > memberDB.wallet)
            return interaction.editReply({ content: `Saldo insuficiente para essa aposta` });
        isBet = true;
    }

    let board = initBoard(); // row number | value

    const message = await interaction.editReply({
        embeds: [gameEmbed(interaction.user)],
        components: gameButtons(board, true)
    }) as Message;

    const collector = message.createMessageComponentCollector({
        filter: int => int.isButton() && int.user.id === interaction.user.id,
        idle: 120_000
    });

    let playerVictories = 0;
    let ties = 0;
    let botVictories = 0;
    let profit = 0;
    let round = 0;

    collector.on('collect', async (buttonInt: ButtonInteraction): Promise<any> => {

        buttonInt.deferReply({ ephemeral: false }).then(() => buttonInt.deleteReply().catch(() => { }));

        if (buttonInt.customId === 'restart') {

            if (isBet === true && memberDB.wallet < betValue) {
                interaction.editReply({ content: `Saldo insuficiente para essa aposta` });
                return collector.stop();
            }

            round = 0;
            board = initBoard();

            return interaction.editReply({
                embeds: [gameEmbed(interaction.user)],
                components: gameButtons(board, true)
            });
        }

        const playerChoice = parseInt(buttonInt.customId);
        board.set(playerChoice, p1emoji);
        round++;

        if (isWin(board, p1emoji)) { // player wins // game ends
            playerVictories++;

            let winEmbed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`Você ganhou!`)
                .addFields([
                    { name: 'Vitórias', value: playerVictories.toString() },
                    { name: 'Empates', value: ties.toString() },
                    { name: 'Derrotas', value: botVictories.toString() }
                ])

            if (isBet) {
                profit += betValue;
                memberDB.wallet += betValue;
                winEmbed.addField('Lucro da aposta', `${profit} uwucoins`);

                await membersDBrepo.save(memberDB);
            }
            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            return interaction.editReply({
                components: buttons,
                embeds: [winEmbed]
            });
        }
        else if (round === 9) { // Tie // game ends
            ties++;

            let tieEmbed = new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`Deu velha! Empate`)
                .addFields([
                    { name: 'Vitórias', value: playerVictories.toString() },
                    { name: 'Empates', value: ties.toString() },
                    { name: 'Derrotas', value: botVictories.toString() }
                ])

            if (isBet) tieEmbed.addField('Lucro da aposta', `${profit} uwucoins`);

            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            return interaction.editReply({
                components: buttons,
                embeds: [tieEmbed]
            });
        }

        // Else bot's turn

        let botChoice = botAI(board, p2emoji);
        if (botChoice === false) botChoice = botAI(board, p1emoji);
        if (botChoice === false) {
            botChoice = Math.floor(Math.random() * 9) + 1;
            while (board.get(botChoice as number) !== empty) botChoice = Math.floor(Math.random() * 9) + 1;
        }

        board.set(botChoice as number, p2emoji);
        round++;

        if (isWin(board, p2emoji)) { // bot wins // game ends
            botVictories++;

            let loseEmbed = new MessageEmbed()
                .setColor('RED')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`Você perdeu!`)
                .addFields([
                    { name: 'Vitórias', value: playerVictories.toString() },
                    { name: 'Empates', value: ties.toString() },
                    { name: 'Derrotas', value: botVictories.toString() }
                ])

            if (isBet) {
                profit -= betValue;
                memberDB.wallet -= betValue;
                loseEmbed.addField('Lucro da aposta', `${profit} uwucoins`);

                await membersDBrepo.save(memberDB);
            }

            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            return interaction.editReply({
                components: buttons,
                embeds: [loseEmbed]
            });
        }

        interaction.editReply({
            components: gameButtons(board),
            embeds: [gameEmbed(interaction.user)]
        });
        if (round === 9) { // Tie // game ends
            ties++;

            let tieEmbed = new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`Deu velha! Empate`)
                .addFields([
                    { name: 'Vitórias', value: playerVictories.toString() },
                    { name: 'Empates', value: ties.toString() },
                    { name: 'Derrotas', value: botVictories.toString() }
                ]);

            if (isBet) tieEmbed.addField('Lucro da aposta', `${profit} uwucoins`);

            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            return interaction.editReply({
                components: buttons,
                embeds: [tieEmbed]
            });
        }
        // Else next round


    });

}
async function multiPlayer(interaction: CommandInteraction, player2: User, memberDB: MembersDBmodel, betValue: number): Promise<any> {

    if (!interaction.guild.members.cache.has(player2.id))
        return interaction.editReply({ content: '🤷‍♀️ | Usuário informado não encontrado no servidor' });

    if (player2.bot) return interaction.editReply({
        embeds: [{
            color: 'YELLOW',
            title: '🤷‍♀️ | Acho que meus amigos bots não sabem jogar jogo da velha...',
            description: '...mas você pode jogar comigo!\n' +
                'Basta usar o comando novamente, sem mencionar um usuário',
        }]
    });

    if (interaction.user.id === player2.id) return interaction.editReply({
        embeds: [{
            color: 'YELLOW',
            title: '🤷‍♀️ | Você não pode se auto-desafiar!',
            description: '...mas você pode jogar comigo!\n' +
                'Basta usar o comando novamente, sem mencionar um usuário',
        }]
    });

    let isBet = false;

    const player1 = interaction.user;
    const player1DB = memberDB;
    const player2DB = await membersDBrepo.findOneBy({ id: player2.id });

    if (betValue !== 0) {

        if (betValue > player1DB.wallet)
            return interaction.editReply({ content: `Você não tem uwucoins suficientes para essa aposta` });

        if (betValue > player2DB.wallet)
            return interaction.editReply({ content: `${player2.toString()} não tem uwucoins suficientes para essa aposta` });

        isBet = true;
    }

    interaction.deleteReply();

    let p1Profit = 0;
    let p2Profit = 0;

    let p1Victories = 0;
    let ties = 0;
    let p2Victories = 0;
    let round = 0;

    let roundPlayer = player1;
    const board = new Collection<number, string>(); // row number | value

    const message = await interaction.channel.send({
        content: `${player1.toString()} vs ${player2.toString()}`,
        embeds: [gameEmbed(roundPlayer)],
        components: gameButtons(board, true)
    });

    const collector = message.createMessageComponentCollector({
        filter: (int) => (int.user.id === player1.id || int.user.id === player2.id) && int.isButton(),
        idle: 200_000
    });

    let remainingPlayers = new Collection<string, User>();
    remainingPlayers.set(player1.id, player1);
    remainingPlayers.set(player2.id, player2);

    let wo = setTimeout(WO, 180_000);

    collector.on('collect', async (buttonInt): Promise<any> => {

        if (!buttonInt.isButton()) return;
        if (buttonInt.customId !== 'restart' && buttonInt.user.id !== roundPlayer.id) return;
        await buttonInt.deferReply({ ephemeral: false });

        if (buttonInt.customId === 'restart' && remainingPlayers.has(buttonInt.user.id)) {

            if (isBet && (betValue > player1DB.wallet || betValue > player2DB.wallet)) {
                message.edit({
                    content: `${player1.username} ou ${player2.username} não tem uwucoins suficientes para essa aposta`,
                });
                return buttonInt.deleteReply().catch(() => { });
            }

            const otherPlayer = buttonInt.user.id === player1.id ? player2 : player1;

            remainingPlayers.delete(buttonInt.user.id);

            if (remainingPlayers.size > 0) {

                buttonInt.editReply({
                    content: `Aguardando ${otherPlayer.toString()}...`
                });
                setTimeout(() => { buttonInt.deleteReply().catch(() => { }) }, 1000);
                return;
            }
            else {
                const lowestPlayer = p1Victories <= p2Victories ? player1 : player2;
                roundPlayer = lowestPlayer;
                round = 0;

                remainingPlayers.set(player1.id, player1);
                remainingPlayers.set(player2.id, player2);

                message.edit({
                    content: `${player1.toString()} vs ${player2.toString()}`,
                    embeds: [gameEmbed(roundPlayer)],
                    components: gameButtons(board, true)
                });

                return buttonInt.deleteReply().catch(() => { });
            }
        }
        else if (buttonInt.customId === 'restart' && !remainingPlayers.has(buttonInt.user.id)) return buttonInt.deleteReply().catch(() => { });

        clearTimeout(wo);

        const playerChoice = parseInt(buttonInt.customId);
        const playerEmoji = buttonInt.user.id === player1.id ? p1emoji : p2emoji;
        board.set(playerChoice, playerEmoji);
        round++;

        if (isWin(board, playerEmoji)) { // Victory // Game ends

            const winner = buttonInt.user.id === player1.id ? player1 : player2;
            winner.id === player1.id ? p1Victories++ : p2Victories++;

            let winEmbed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`${winner.toString()} ganhou!`)
                .addField(`Vitórias de ${player1.tag}`, `${p1Victories}`)
                .addField(`Empates`, `${ties}`)
                .addField(`Vitórias de ${player2.tag}`, `${p2Victories}`)

            if (isBet === true) {
                winner.id === player1.id ? p1Profit += betValue : p2Profit -= betValue;
                winner.id === player1.id ? player1DB.wallet += betValue : player2DB.wallet -= betValue;

                const winnerProfit = winner.id === player1.id ? p1Profit : p2Profit;

                winEmbed
                    .addField(`Aposta:`, `${betValue} uwucoins`, true)
                    .addField(`Lucro de ${winner.tag}`, `${winnerProfit} uwucoins`, true);

                await membersDBrepo.save(player1DB);
                await membersDBrepo.save(player2DB);
            }

            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            message.edit({
                content: `${player1.toString()} vs ${player2.toString()}`,
                embeds: [winEmbed],
                components: buttons
            });

            return buttonInt.deleteReply().catch(() => { });

        }
        else if (round === 9) { // Tie // Game ends
            ties++;

            let tieEmbed = new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('❎ ⭕ | Jogo da velha')
                .setDescription(`Deu velha! Empate`)
                .addField(`Vitórias de ${player1.tag}`, `${p1Victories}`)
                .addField(`Empates`, `${ties}`)
                .addField(`Vitórias de ${player2.tag}`, `${p2Victories}`)

            let buttons = gameButtons(board, false, true);
            buttons.push(restartButton);

            message.edit({
                content: `${player1.toString()} vs ${player2.toString()}`,
                embeds: [tieEmbed],
                components: buttons
            });

            return buttonInt.deleteReply().catch(() => { });
        }
        else if (round < 9) { // Next round // Game continues

            roundPlayer = roundPlayer === player1 ? player2 : player1;

            wo = setTimeout(WO, 180_000);

            message.edit({
                content: `${player1.toString()} vs ${player2.toString()}`,
                embeds: [gameEmbed(roundPlayer)],
                components: gameButtons(board)
            });

            return buttonInt.deleteReply().catch(() => { });

        }

    });

    async function WO() {

        const winner = roundPlayer === player1 ? player2 : player1;

        let woEmbed = new MessageEmbed()
            .setColor('RED')
            .setTitle('❎ ⭕ | Jogo da velha')
            .setDescription(`${roundPlayer.toString()} abandonou o jogo!\n${winner.toString()} ganhou!`);

        if (round < 2) {
            woEmbed
                .setColor('YELLOW')
                .setDescription(`${roundPlayer.toString()} não respondeu!\nFim de jogo!`);

            return message.edit({
                embeds: [woEmbed],
            }).catch(() => { });
        }

        if (isBet === true) {
            winner.id === player1.id ? p1Profit += betValue : p2Profit -= betValue;
            winner.id === player1.id ? player1DB.wallet += betValue : player2DB.wallet -= betValue;

            const winnerProfit = winner.id === player1.id ? p1Profit : p2Profit;

            woEmbed.addField(`Lucro de ${winner.tag}`, `${winnerProfit} uwucoins`, true);

            await membersDBrepo.save(player1DB);
            await membersDBrepo.save(player2DB);
        }

        let buttons = gameButtons(board, false, true);
        buttons.push(restartButton);

        message.edit({
            content: `${player1.toString()} vs ${player2.toString()}`,
            embeds: [woEmbed],
            components: buttons
        });

    }
}

function initBoard(): Collection<number, string> {
    const board = new Collection<number, string>();

    for (let i = 1; i <= 9; i++) {
        board.set(i, empty);
    }
    return board;
}

function gameButtons(board: Collection<number, string>, init?: boolean, end?: boolean): MessageActionRow[] {

    let rows = [new MessageActionRow(), new MessageActionRow(), new MessageActionRow()];

    for (let i = 1; i <= 9; i++) {

        if (init) board.set(i, empty);

        const emoji = board.get(i);
        const disabled = emoji !== empty || end === true;

        const row = rows[Math.floor((i - 1) / 3)];

        row.addComponents(
            new MessageButton()
                .setCustomId(i.toString())
                .setStyle('PRIMARY')
                .setEmoji(emoji)
                .setDisabled(disabled)
        );
    }
    return rows;
}

function gameEmbed(roundPlayer: User) {

    let embed = new MessageEmbed()
        .setColor('YELLOW')
        .setTitle('❎ ⭕ | Jogo da velha')
        .setDescription(`Vez de ${roundPlayer.toString()}`);

    return embed;
}

const wins = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9],  // Horizontal
    [1, 4, 7], [2, 5, 8], [3, 6, 9], // Vertical
    [1, 5, 9], [3, 5, 7]            // Diagonal
];
function isWin(board: Collection<number, string>, playerEmoji: string): boolean {

    for (let i = 0; i < wins.length; i++) {
        const [a, b, c] = wins[i];

        if (board.get(a) === playerEmoji && board.get(b) === playerEmoji && board.get(c) === playerEmoji)
            return true;
    }
    return false;
}

function botAI(board: Collection<number, string>, playerEmoji: string): Number | false {

    for (const winOption of wins) {
        let emptySpace = 0;
        let emptiesCount = 0;
        let pEmojisCount = 0;

        for (let i = 0; i < 3; i++) {
            const emoji = board.get(winOption[i]);

            if (emoji === empty) {
                emptiesCount++;
                emptySpace = winOption[i];
            }
            else if (emoji === playerEmoji) pEmojisCount++;
        }
        if (emptiesCount === 1 && pEmojisCount === 2) return emptySpace;
    }
    return false;
}