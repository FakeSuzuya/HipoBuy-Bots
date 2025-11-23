module.exports = (client) => {

    client.security = {
        level: "medium",

        whitelist: [],

        antiNuke: {
            enabled: true,
            maxActions: 3,
            timeframe: 5000,
            actions: new Map()
        },

        antiToken: {
            enabled: true,
            regex: /(discord\.gift|nitro|free|steam-gift|login|qr-code|nitro-drop|free-nitro)/i
        },

        antiFile: {
            enabled: true,
            bannedExtensions: ["exe","scr","bat","cmd","js","vbs","jar"],
            bannedNames: ["stealer","hack","cheat","inject","token"]
        },

        log: null
    };

};
