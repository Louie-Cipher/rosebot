import chalk from 'chalk';

export function consoleLog(...args: any[]) {
    const date = chalk.bgCyan(`[${dateTime(new Date())}] `)
    console.log(date, ...args);
}

export function consoleWarn(...args: any[]) {
    const date = chalk.bgYellow(`[${dateTime(new Date())}] `)
    console.warn(date, ...args);
}

export function consoleError(...args: any[]) {
    const date = chalk.bgRed(`[${dateTime(new Date())}] `)
    console.error(date, ...args);
}

export const localTime = (date: Date): Date => new Date(date.getTime() - 10800000);

export const dateTime = (date: Date): string =>
    `${datef(date.getDate())}/${datef(date.getMonth() + 1)} ${datef(date.getHours())}:${datef(date.getMinutes())}:${datef(date.getSeconds())}`;

const datef = (num: number): String => num < 10 ? `0${num}` : `${num}`;