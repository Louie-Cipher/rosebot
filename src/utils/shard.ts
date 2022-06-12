import { ShardingManager } from 'discord.js';
import { consoleLog } from '.';

const filePath = (process.env.NODE_ENV && process.env.NODE_ENV === 'prod') ? './dist/index.js' : './src/index.ts';

const manager = new ShardingManager(filePath, {
    token: process.env.botToken,
    totalShards: 2,
    shardList: 'auto',
    mode: 'worker'
});

manager.spawn();

manager.on('shardCreate', (shard) => consoleLog(`Shard #${shard.id} criada`));