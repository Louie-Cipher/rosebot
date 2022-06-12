import { consoleError } from './utils';
import { init } from './utils/init';
import 'dotenv/config';
import client from './client';
init(client);

process.on('uncaughtException', (err) => consoleError('uncaughtException:\n' + err));
process.on('unhandledRejection', (err) => consoleError('unhandledRejection:\n' + err));