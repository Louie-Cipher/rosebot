import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription('um gerador de nomes aleatórios')
        .addIntegerOption(option => option
            .setName('silabas')
            .setDescription('quantidade de sílabas na palavra')
            .setMinValue(1)
            .setMaxValue(8)
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('palavras')
            .setDescription('quantidade de palavras geradas')
            .setMinValue(1)
            .setMaxValue(40)
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('mid-variants')
            .setDescription('porcentagem de surgir letras no meio da sílaba')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('end-variants')
            .setDescription('porcentagem de surgir letras no final da sílaba')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(false)
        ),

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const silabas = interaction.options.getInteger('silabas') || Math.floor(Math.random() * 3) + 2;
        const palavras = interaction.options.getInteger('palavras') || 5;
        const midOption = interaction.options.getInteger('mid-variants');
        const endOption = interaction.options.getInteger('end-variants');

        const midVariantPercent = midOption !== null ? midOption : 30;
        const endVariantPercent = endOption !== null ? endOption : 30;

        function generateMessage(): MessageEmbed[] {

            let embed = new MessageEmbed()
                .setColor('AQUA')
                .setTitle('Gerador de nomes')
                .addFields([
                    { name: 'Sílabas', value: `${silabas}`, inline: true },
                    { name: 'Palavras', value: `${palavras}`, inline: true },
                ]);

            if (midOption !== null) embed.addField('Variações no meio da sílaba', `${midOption}%`);
            if (endOption !== null) embed.addField('Variações no final da sílaba', `${endOption}%`);

            let description = '';

            for (let i = 0; i < palavras; i++) {
                const newWord = `${generateWord(silabas, midVariantPercent, endVariantPercent)}\n`;

                if (description.length + newWord.length < 4000) description += newWord;
                else { description += '\n...'; break; }
            }

            embed.setDescription(description);

            return [embed];
        }

        const message = await interaction.editReply({
            embeds: generateMessage(),
            components: [button]
        }) as Message<boolean>;

        let lastGenerate = Date.now();

        const collector = message.createMessageComponentCollector({
            filter: (int) => int.isButton() && int.user.id === interaction.user.id,
            idle: 300_000
        });

        collector.on('collect', async (buttonInt: ButtonInteraction): Promise<any> => {

            buttonInt.deferReply().then(() => buttonInt.deleteReply().catch(() => { }));

            if (Date.now() - lastGenerate < 500) return;

            message.edit({ embeds: generateMessage() });

            lastGenerate = Date.now();

        }).on('end', () => { message.edit({ components: [] }).catch(() => { }) });
    }
});

const vogais = ['a', 'e', 'i', 'o', 'u'];
const consoantes = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
const endVariants = ['l', 'm', 'r', 's'];

function generateWord(silabas: number, midVariantPercent: number, endVariantPercent: number) {
    let result = "";

    for (let i = 0; i < silabas; i++) {
        const cRandom = consoantes[Math.floor(Math.random() * consoantes.length)];
        const vRandom = vogais[Math.floor(Math.random() * vogais.length)];

        result += cRandom;

        if (midVariantPercent > 0 && Math.floor(Math.random() * 100) + midVariantPercent > 100) { // Change of midVariant

            let midVariants: string[] = [];

            if (["b", "c", "d", "f", "g", "p", "t", "v"].includes(cRandom)) midVariants.push("r", "l");

            if (["c", "l", "n", "s"].includes(cRandom)) midVariants.push("h");
            if (cRandom === "q" && vRandom !== "u") midVariants.push("u", "u");

            if (midVariants.length > 0) result += midVariants[Math.floor(Math.random() * midVariants.length)];
        }

        result += vRandom;

        if (endVariantPercent > 0 && Math.floor(Math.random() * 100) + endVariantPercent > 100) // Chance of endVariant
            result += endVariants[Math.floor(Math.random() * endVariants.length)];
    }

    return result;
}

const button = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setLabel('Gerar novamente')
            .setCustomId('regenerate')
            .setStyle('SECONDARY')
            .setEmoji('🔄')
    );