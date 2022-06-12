import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { MembersDBmodel } from "../../db/entities";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('jokempo')
        .setDescription('joga pedra papel tesoura')
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

const totalOptions = ['pedra', 'papel', 'tesoura'];
const emojiOptions = ['🪨', '📄', '✂'];

async function singlePlayer(interaction: CommandInteraction, memberDB: MembersDBmodel, betValue: number): Promise<any> {

    let playerVictories = 0;
    let ties = 0;
    let botVictories = 0;

    let isBet = false;
    let profit = 0;

    if (betValue !== 0) {
        if (betValue > memberDB.wallet)
            return interaction.editReply({ content: `Saldo insuficiente para essa aposta` });
        isBet = true;
    }

    let embed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle(`🪨 📄 ✂ Pedra Papel Tesoura`)

    if (isBet) embed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

    const rawMessage = await interaction.editReply({
        embeds: [embed],
        components: gameButtons()
    });
    let message = await interaction.channel.messages.fetch(rawMessage.id);

    let collector = message.createMessageComponentCollector({
        filter: int => int.user.id === interaction.user.id && int.isButton(),
        idle: 120_000
    });

    collector.on('collect', async (buttonInt): Promise<any> => {

        await buttonInt.deferReply({ ephemeral: false });

        if (!buttonInt.isButton()) return;
        if (buttonInt.user.id !== interaction.user.id) return;

        if (buttonInt.customId === 'restart') {

            if (isBet === true && betValue > memberDB.wallet) {
                buttonInt.deleteReply().catch(() => { });
                collector.stop();
                return interaction.editReply({ content: `Você não tem mais uwucoins suficientes para essa aposta` });
            }

            interaction.editReply({
                embeds: [embed],
                components: gameButtons()
            });
            return buttonInt.deleteReply();
        }

        const p1Choice = buttonInt.customId;
        const botChoice = totalOptions[Math.floor(Math.random() * totalOptions.length)];

        const p1Emoji = emojiOptions[totalOptions.indexOf(p1Choice)];
        const botEmoji = emojiOptions[totalOptions.indexOf(botChoice)];

        let resultEmbed = new MessageEmbed()
            .setTitle(`🪨 📄 ✂ Pedra Papel Tesoura`);

        let description = `Você escolheu ${p1Emoji}**${p1Choice}**\n` +
            `Eu escolhi ${botEmoji}**${botChoice}**.\n\n`

        if (p1Choice === botChoice) { // Empate
            ties++;
            description += `Empate!`;
            if (p1Choice === 'tesoura') description += `\n✂✂ 😏`;
            resultEmbed.setColor('YELLOW');

            if (isBet)
                resultEmbed.addField('<:uwucoin:978022888470904832> Lucro da aposta', `${profit} uwucoins`);
        }

        if ( // Bot wins
            (p1Choice === 'pedra' && botChoice === 'papel') ||
            (p1Choice === 'papel' && botChoice === 'tesoura') ||
            (p1Choice === 'tesoura' && botChoice === 'pedra')
        ) {
            botVictories++;
            description += `Você perdeu!`;
            resultEmbed.setColor('RED');

            if (isBet) {
                profit -= betValue;
                memberDB.wallet -= betValue;
                resultEmbed.addField('<:uwucoin:978022888470904832> Lucro da aposta', `${profit} uwucoins`);
            }

        }

        else if ( // Player wins
            (p1Choice === 'pedra' && botChoice === 'tesoura') ||
            (p1Choice === 'papel' && botChoice === 'pedra') ||
            (p1Choice === 'tesoura' && botChoice === 'papel')
        ) {
            playerVictories++;
            description += `Você ganhou!`;
            resultEmbed.setColor('GREEN');

            if (isBet) {
                profit += betValue;
                memberDB.wallet += betValue;
                resultEmbed.addField('<:uwucoin:978022888470904832> Lucro da aposta', `${profit} uwucoins`);
            }

        }

        resultEmbed
            .setDescription(description)
            .addFields([
                { name: 'Vitórias', value: `${playerVictories}` },
                { name: 'Empates', value: `${ties}` },
                { name: 'Derrotas', value: `${botVictories}` },
            ]);

        await membersDBrepo.save(memberDB);

        await message.edit({
            embeds: [resultEmbed],
            components: restartButton()
        });

        buttonInt.deleteReply();

    });

    collector.once('end', () => {
        message.edit({
            components: [],
        }).catch(() => { });
    });

}

async function multiPlayer(interaction: CommandInteraction, player2: User, memberDB: MembersDBmodel, betValue: number): Promise<any> {

    if (!interaction.guild.members.cache.has(player2.id))
        return interaction.editReply({ content: '🤷‍♀️ | Usuário informado não encontrado no servidor' });

    if (player2.bot) return interaction.editReply({
        embeds: [{
            color: 'YELLOW',
            title: '🤷‍♀️ | Acho que meus amigos bots não sabem jogar pedra papel tesoura ...',
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

    interaction.deleteReply();

    let p1Victories = 0;
    let ties = 0;
    let p2Victories = 0;

    let isBet = false;
    let p1Profit = 0;
    let p2Profit = 0;

    const player1 = interaction.user;
    const player1DB = memberDB;
    const player2DB = await membersDBrepo.findOneBy( { id: player2.id });

    if (betValue !== 0) {

        if (betValue > player1DB.wallet)
            return interaction.editReply({ content: `Você não tem uwucoins suficientes para essa aposta` });

        if (betValue > player2DB.wallet)
            return interaction.editReply({ content: `${player2.toString()} não tem uwucoins suficientes para essa aposta` });

        isBet = true;
    }

    let startEmbed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle(`🪨 📄 ✂ Pedra Papel Tesoura`);

    if (isBet) startEmbed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

    const message = await interaction.channel.send({
        content: `${player1.toString()} vs ${player2.toString()}`,
        embeds: [startEmbed],
        components: gameButtons()
    });

    let collector = message.createMessageComponentCollector({
        filter: int => [player2.id, player1.id].includes(int.user.id) && int.isButton(),
        idle: 120_000
    });

    let player1Choice: string;
    let player2Choice: string;
    let remainingPlayers = new Map<string, User>();

    remainingPlayers.set(player1.id, player1);
    remainingPlayers.set(player2.id, player2);

    collector.on('collect', async buttonInt => {

        if (!buttonInt.isButton()) return;
        await buttonInt.deferReply({ ephemeral: false });

        if (!remainingPlayers.has(buttonInt.user.id)) return buttonInt.deleteReply();

        if (buttonInt.customId === 'restart') {

            if (isBet) {
                if (betValue > player1DB.wallet) {
                    message.edit({
                        embeds: [{
                            color: 'RED',
                            title: `🤷‍♀️ | ${player1.toString()} não tem uwucoins suficientes para essa aposta`,
                        }]
                    });
                    return collector.stop();
                }
                else if (betValue > player2DB.wallet) {
                    message.edit({
                        embeds: [{
                            color: 'RED',
                            title: `🤷‍♀️ | ${player2.toString()} não tem uwucoins suficientes para essa aposta`,
                        }]
                    });
                    return collector.stop();
                }
            }
            remainingPlayers.delete(buttonInt.user.id);

            if (remainingPlayers.size > 0)
                await message.edit({
                    embeds: [startEmbed],
                    components: gameButtons()
                });

            remainingPlayers.set(player1.id, player1);
            remainingPlayers.set(player2.id, player2);

            return buttonInt.deleteReply();
        }

        if (buttonInt.user.id === player1.id) {
            player1Choice = buttonInt.customId;
            remainingPlayers.delete(player1.id);
        }
        else if (buttonInt.user.id === player2.id) {
            player2Choice = buttonInt.customId;
            remainingPlayers.delete(player2.id);
        }

        if (remainingPlayers.size > 0) {
            buttonInt.editReply({ content: `Aguardando o outro jogador escolher...` });
            setTimeout(() => {
                buttonInt.deleteReply().catch(() => { });
            }, 2_000);
            return;
        }

        remainingPlayers.set(player1.id, player1);
        remainingPlayers.set(player2.id, player2);

        const p1Emoji = emojiOptions[totalOptions.indexOf(player1Choice)];
        const p2Emoji = emojiOptions[totalOptions.indexOf(player2Choice)];

        let resultEmbed = new MessageEmbed()
            .setTitle(`🪨 📄 ✂ Pedra Papel Tesoura`)
            .setColor('AQUA');

        let description = `${player1.toString()} escolheu ${p1Emoji}**${player1Choice}**\n` +
            `${player2.toString()} escolheu ${p2Emoji}**${player2Choice}**.\n\n`;

        if (player1Choice === player2Choice) { // Empate
            ties++;
            description += `Empate!`;
            if (player1Choice === 'tesoura') description += `\n✂✂ 😏`;
            resultEmbed.setColor('YELLOW');
        }

        else if ( // Player 1 wins // Player 2 loses
            (player1Choice === 'pedra' && player2Choice === 'tesoura') ||
            (player1Choice === 'papel' && player2Choice === 'pedra') ||
            (player1Choice === 'tesoura' && player2Choice === 'papel')
        ) {
            p1Victories++;
            description += `${player1.toString()} ganhou!`;

            if (isBet) {
                p1Profit += betValue;
                p2Profit -= betValue;

                player1DB.wallet += betValue;
                player2DB.wallet -= betValue;

                resultEmbed.addField('<:uwucoin:978022888470904832> Lucro da aposta de ' + player1.username, `${p1Profit} uwucoins`);
            }
        }
        else if ( // Player 2 wins // Player 1 loses
            (player1Choice === 'pedra' && player2Choice === 'papel') ||
            (player1Choice === 'papel' && player2Choice === 'tesoura') ||
            (player1Choice === 'tesoura' && player2Choice === 'pedra')
        ) {
            p2Victories++;
            description += `${player2.toString()} ganhou!`;

            if (isBet) {
                p1Profit -= betValue;
                p2Profit += betValue;

                player1DB.wallet -= betValue;
                player2DB.wallet += betValue;

                resultEmbed.addField('<:uwucoin:978022888470904832> Lucro da aposta de ' + player2.username, `${p2Profit} uwucoins`);
            }

        }

        if (isBet) {
            await membersDBrepo.save(player1DB);
            await membersDBrepo.save(player2DB);
        }
        resultEmbed
            .setDescription(description)
            .addFields([
                { name: `Vitórias de ${player1.username}`, value: `${p1Victories}` },
                { name: `Empates`, value: `${ties}` },
                { name: `Vitórias de ${player2.username}`, value: `${p2Victories}` },
            ]);

        await message.edit({
            embeds: [resultEmbed],
            components: restartButton()
        });

        buttonInt.deleteReply().catch(() => { });
    });

    collector.once('end', () => {
        message.edit({
            components: []
        }).catch(() => { });
    });

}

function gameButtons() {

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setEmoji('🪨')
                .setLabel('Pedra')
                .setCustomId('pedra')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setEmoji('📄')
                .setLabel('Papel')
                .setCustomId('papel')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setEmoji('✂')
                .setLabel('Tesoura')
                .setCustomId('tesoura')
                .setStyle('PRIMARY'),
        );

    return [row];
}

function restartButton() {

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setEmoji('🔄')
                .setCustomId('restart')
                .setLabel('Jogar novamente')
                .setStyle('SUCCESS'),
        );

    return [row];
}