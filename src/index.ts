import { consoleError } from './utils';
import { init } from './utils/init';
import 'dotenv/config';
import client from './client';
init(client);

process.on('uncaughtException', (err) => consoleError('[UNCAUGHT_EXCEPTION]\n' + err));
process.on('unhandledRejection', (err) => consoleError('[UNHANDLED_REJECTION]\n' + err));