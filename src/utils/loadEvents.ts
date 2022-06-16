import { readdirSync } from 'fs';
import { consoleLog } from '.';

export function loadEvents() {
    const files = readdirSync(`${__dirname}/../events`).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    files.forEach(file => import(`../events/${file}`));
    consoleLog(`[EVENTS_LOADER] ${files.length} Events loaded!`);
}