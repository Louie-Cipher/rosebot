import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, User } from "discord.js";
import { membersDBrepo } from "../../db/repositories";
import { MembersDBmodel } from "../../db/entities";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('quick-trigger')
        .setDescription('um jogo de atirar e recarregar sua arma')
        .addUserOption(option => option
            .setName('player2')
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

        const player2 = interaction.options.getUser('player2');
        const betValue = interaction.options.getInteger('aposta') || 0;

        if (!player2) singlePlayer(interaction, memberDB, betValue);
        else multiPlayer(interaction, player2, memberDB, betValue);
    }
});

type moveOptions = 'atirar' | 'recarregar' | 'defender';
const totalOptions: moveOptions[] = ['atirar', 'recarregar', 'defender'];
const emojiOptions = ['🔫', '🔄', '🛡'];

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

    let startEmbed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle(`🔫 Gatilho rápido`)

    if (isBet) startEmbed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

    const message = await interaction.editReply({
        embeds: [startEmbed],
        components: gameButtons(1)
    }) as Message;

    const collector = message.createMessageComponentCollector({
        filter: int => int.user.id === interaction.user.id && int.isButton(),
        idle: 120_000
    });

    let round = 0;
    let playerBullets = 1;
    let botBullets = 1;

    collector.on('collect', async (buttonInt): Promise<any> => {

        if (!buttonInt.isButton()) return;
        buttonInt.deferReply({ ephemeral: false }).then(() => buttonInt.deleteReply().catch(() => { }));
        if (buttonInt.user.id !== interaction.user.id) return;

        if (buttonInt.customId === 'restart') {

            if (isBet === true && betValue > memberDB.wallet) {
                buttonInt.deleteReply().catch(() => { });
                collector.stop();
                return interaction.editReply({ content: `Você não tem mais uwucoins suficientes para essa aposta` });
            }

            round = 0;
            playerBullets = 1;
            botBullets = 1;

            interaction.editReply({
                embeds: [startEmbed],
                components: gameButtons(1)
            });
            return buttonInt.deleteReply();
        }
        round++;
        const playerChoice = buttonInt.customId as moveOptions;

        let botMinRange = 0;
        let botMaxRange = 2;

        if (botBullets === 0) botMinRange = 1;
        if (playerBullets === 0) botMaxRange = 1;

        const botChoice = totalOptions[Math.floor(Math.random() * (botMaxRange - botMinRange)) + botMinRange];

        if (playerChoice === 'recarregar') playerBullets++;
        else if (playerChoice === 'atirar') playerBullets--;

        if (botChoice === 'recarregar') botBullets++;
        else if (botChoice === 'atirar') botBullets--;

        let description = `Você escolheu ${emojiOptions[totalOptions.indexOf(playerChoice)]} **${playerChoice}**\n` +
            `Eu escolhi ${emojiOptions[totalOptions.indexOf(botChoice)]} **${botChoice}**\n\n`;

        let embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle(`🔫 Gatilho rápido`)
            .addFields([
                { name: 'Suas Balas', value: `${playerBullets}`, inline: true },
                { name: 'Balas do Bot', value: `${botBullets}`, inline: true },
                { name: 'Round', value: `${round}` },
            ]);

        if (isBet) embed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

        if (playerChoice === 'defender' || botChoice === 'defender' || // No end round - game continues
            (playerChoice === 'recarregar' && botChoice === 'recarregar')
        ) {
            embed.setDescription(description);

            return interaction.editReply({
                embeds: [embed],
                components: gameButtons(playerBullets)
            });
        }

        if (playerChoice === 'atirar' && botChoice === 'atirar') { // Tie - game ends
            ties++;

            description += `Tiro cruzado. Empate! 💀`;
            embed.setColor('YELLOW')
                .setDescription(description)
                .addFields([
                    { name: 'Vitórias', value: `${playerVictories}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                    { name: 'Derrotas', value: `${botVictories}`, inline: true },
                ]);

            let buttons = gameButtons(playerBullets);
            buttons.push(restartButton());

            return interaction.editReply({
                embeds: [embed],
                components: buttons
            });
        }

        if (playerChoice === 'atirar' && botChoice === 'recarregar') { // Player wins - game ends
            playerVictories++;

            description += `Você ganhou! 🎉`;
            embed.setColor('GREEN')
                .setDescription(description)
                .addFields([
                    { name: 'Vitórias', value: `${playerVictories}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                    { name: 'Derrotas', value: `${botVictories}`, inline: true },
                ]);

            if (isBet) {
                profit += betValue;
                memberDB.wallet += betValue;
                embed.addField('<:uwucoin:978022888470904832> Lucro da aposta', `${profit} uwucoins`);

                await membersDBrepo.save(memberDB);
            }

            let buttons = gameButtons(playerBullets);
            buttons.push(restartButton());

            return interaction.editReply({
                embeds: [embed],
                components: buttons
            });
        }

        if (playerChoice === 'recarregar' && botChoice === 'atirar') { // Bot wins - game ends
            botVictories++;

            description += `Você perdeu! 😭`;
            embed.setColor('RED')
                .setDescription(description)
                .addFields([
                    { name: 'Vitórias', value: `${playerVictories}`, inline: true },
                    { name: 'Empates', value: `${ties}`, inline: true },
                    { name: 'Derrotas', value: `${botVictories}`, inline: true },
                ]);

            if (isBet) {
                profit -= betValue;
                memberDB.wallet -= betValue;
                embed.addField('<:uwucoin:978022888470904832> Lucro da aposta', `${profit} uwucoins`);

                await membersDBrepo.save(memberDB);
            }


            let buttons = gameButtons(playerBullets);
            buttons.push(restartButton());

            return interaction.editReply({
                embeds: [embed],
                components: buttons
            });
        }
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
            title: '🤷‍♀️ | Acho que meus amigos bots não sabem jogar esse jogo ...',
            description: '...mas você pode jogar comigo!\n' +
                'Basta usar o comando novamente, sem mencionar um usuário',
        }]
    });

    if (interaction.user.id === player2.id) return interaction.editReply({
        embeds: [{
            color: 'YELLOW',
            title: '🤷‍♀️ | Você não pode se auto-desafiar...',
            description: '...mas você pode jogar comigo!\n' +
                'Basta usar o comando novamente, sem mencionar um usuário',
        }]
    });

    let p1Victories = 0;
    let ties = 0;
    let p2Victories = 0;

    let isBet = false;
    let p1Profit = 0;
    let p2Profit = 0;

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

    let startEmbed = new MessageEmbed()
        .setColor('AQUA')
        .setTitle(`🔫 Gatilho rápido`)

    if (isBet) startEmbed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

    const message = await interaction.channel.send({
        content: `${player1.toString()} vs ${player2.toString()}`,
        embeds: [startEmbed],
        components: gameButtons(1)
    });

    let collector = message.createMessageComponentCollector({
        filter: int => [player2.id, player1.id].includes(int.user.id) && int.isButton(),
        idle: 120_000
    });

    let playersChoice = new Map<string, moveOptions>();

    let p1Bullets = 1;
    let p2Bullets = 1;
    let round = 1;

    collector.on('collect', async (buttonInt): Promise<any> => {

        if (!buttonInt.isButton()) return;
        await buttonInt.deferReply({ ephemeral: false });

        if (playersChoice.has(buttonInt.user.id)) return;

        if (buttonInt.customId === 'restart') {

            playersChoice.set(buttonInt.user.id, 'atirar');

            if (playersChoice.size < 2) {

                const otherPlayer = buttonInt.user.id === player1.id ? player2 : player1;

                buttonInt.editReply({
                    content: `Aguardando ${otherPlayer.toString()} decidir...`,
                });
                setTimeout(() => { buttonInt.deleteReply().catch(() => { }) }, 1_000);
                return;

            }
            playersChoice.clear();
            p1Bullets = 1;
            p2Bullets = 1;
            round = 1;

            interaction.editReply({
                content: `${player1.toString()} vs ${player2.toString()}`,
                embeds: [startEmbed],
                components: gameButtons(1)
            });
        }

        const playerChoice = buttonInt.customId as moveOptions;
        const playerBullets = buttonInt.user.id === player1.id ? p1Bullets : p2Bullets;

        if (playerBullets === 0 && playerChoice === 'atirar') return;

        playersChoice.set(buttonInt.user.id, playerChoice);

        if (playersChoice.size !== 2) {

            const otherPlayer = buttonInt.user.id === player1.id ? player2 : player1;

            buttonInt.editReply({
                content: `Aguardando ${otherPlayer.toString()} fazer sua jogada...`,
            });
            setTimeout(() => { buttonInt.deleteReply().catch(() => { }) }, 1_000);
            return;
        }
        buttonInt.deleteReply().catch(() => { });
        round++;

        const p1Choice = playersChoice.get(player1.id);
        const p2Choice = playersChoice.get(player2.id);
        playersChoice.clear();
        const p1Emoji = emojiOptions[totalOptions.indexOf(p1Choice)];
        const p2Emoji = emojiOptions[totalOptions.indexOf(p2Choice)];

        if (p1Choice === 'atirar') p1Bullets--;
        if (p1Choice === 'recarregar') p1Bullets++;

        if (p2Choice === 'atirar') p2Bullets--;
        if (p2Choice === 'recarregar') p2Bullets++;

        let description = `${player1.toString()} escolheu ${p1Emoji}**${p1Choice}**\n` +
            `${player2.toString()} escolheu ${p2Emoji}**${p2Choice}**\n\n`;

        let embed = new MessageEmbed()
            .setColor('YELLOW')
            .setTitle(`🔫 Gatilho rápido`)
            .addFields([
                { name: `Balas de ${player1.username}`, value: `${p1Bullets}`, inline: true },
                { name: `Balas de ${player2.username}`, value: `${p2Bullets}`, inline: true },
                { name: 'Round', value: `${round}` },
            ]);

        if (isBet) embed.addField('<:uwucoin:978022888470904832> Aposta', `${betValue} uwucoins`);

        if (p1Choice === 'defender' || p2Choice === 'defender' || // No end round - game continues
            (p1Choice === 'recarregar' && p2Choice === 'recarregar')
        ) {
            embed.setDescription(description);

            return message.edit({
                embeds: [embed],
                components: gameButtons(p1Bullets + p2Bullets)
            });
        }

        if (p1Choice === 'atirar' && p2Choice === 'atirar') { // Tie - game ends
            ties++;
            description += 'Fogo cruzado! Empate 💀';
            embed.setColor('RED')
                .setDescription(description)
                .addFields([
                    { name: `Vitórias de ${player1.username}`, value: `${p1Victories}`, inline: true },
                    { name: `Vitórias de ${player2.username}`, value: `${p2Victories}`, inline: true },
                    { name: 'Empates', value: `${ties}` },
                ]);

            return message.edit({
                embeds: [embed],
                components: [restartButton()]
            });

        }

        if (p1Choice === 'atirar' && p2Choice === 'recarregar') { // Player 1 wins
            p1Victories++;
            description += `${player1.toString()} ganhou!`;
            embed.setDescription(description)
                .setColor('GREEN')
                .addFields([
                    { name: `Vitórias de ${player1.username}`, value: `${p1Victories}`, inline: true },
                    { name: `Vitórias de ${player2.username}`, value: `${p2Victories}`, inline: true },
                    { name: 'Empates', value: `${ties}` },
                ]);

            if (isBet) {
                player1DB.wallet += betValue;
                player2DB.wallet -= betValue;
                await membersDBrepo.save(player1DB);
                await membersDBrepo.save(player2DB);

                p1Profit += betValue;
                p2Profit -= betValue;
                embed.addField(`Lucro de ${player1.username}`, `${p1Profit} uwucoins`);
            }

            return message.edit({
                embeds: [embed],
                components: [restartButton()]
            });
        }

        if (p1Choice === 'recarregar' && p2Choice === 'atirar') { // Player 2 wins
            p2Victories++;
            description += `${player2.toString()} ganhou!`;
            embed.setDescription(description)
                .setColor('GREEN')
                .addFields([
                    { name: `Vitórias de ${player1.username}`, value: `${p1Victories}`, inline: true },
                    { name: `Vitórias de ${player2.username}`, value: `${p2Victories}`, inline: true },
                    { name: 'Empates', value: `${ties}` },
                ]);

            if (isBet) {
                player1DB.wallet -= betValue;
                player2DB.wallet += betValue;
                await membersDBrepo.save(player1DB);
                await membersDBrepo.save(player2DB);

                p1Profit -= betValue;
                p2Profit += betValue;
                embed.addField(`Lucro de ${player2.username}`, `${p2Profit} uwucoins`);
            }

            return message.edit({
                embeds: [embed],
                components: [restartButton()]
            });
        }

    });

    collector.once('end', () => {
        message.edit({
            components: []
        }).catch(() => { });
    });

}

function gameButtons(playerBullets: number) {

    let row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setEmoji(emojiOptions[0])
                .setCustomId('atirar')
                .setLabel('Atirar')
                .setStyle('SECONDARY')
                .setDisabled(playerBullets === 0),
            new MessageButton()
                .setEmoji(emojiOptions[1])
                .setCustomId('recarregar')
                .setLabel('Recarregar')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setEmoji(emojiOptions[2])
                .setCustomId('defender')
                .setLabel('Defender')
                .setStyle('SECONDARY')
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
    return row;
}