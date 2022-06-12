declare global {
    namespace NodeJS {
        interface ProcessEnv {
            botToken: string;
            welcomeChannel: string;
            leaveChannel: string;
            NODE_ENV: 'dev' | 'prod' | 'debug';
            twitchUsername: string;
            twitchPasword: string;
            roseId: string;
        }
    }
}

export { };