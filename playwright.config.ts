import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
        {
            name: 'firefox',
            use: {
                browserName: 'firefox',
            },
        },
    ],
};

export default config;
