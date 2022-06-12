import { readdirSync } from 'fs';

export function loadEvents() {
    const files = readdirSync(`${__dirname}/../events`).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    files.forEach(file => import(`../events/${file}`));
}