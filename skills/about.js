//
// Adds meta information about the bot, and exposes them at a public endpoint 
//
module.exports = function (controller, bot) {

    //
    // OVERRIDE WITH YOUR BOT INFORMATION
    //
    var emoji = require('node-emoji');
    var botcommons = {

        // Bot description
        "description": emoji.get("soccer") + " Challenge your knowledge about the soccer players participating in Fifa WorldCup Russia 2018 " + emoji.get("soccer"),

        // Where to get more information about the bot
        "url": "https://github.com/diegofn/botkit-spark-worldcuptrivia",

        // Legal owner
        "legal-owner": "Diego Fernando Nieto <https://github.com/diegofn>",

        // Contact name for support
        "support-contact": "Diego Fernando Nieto <mailto:diegofn@me.com>",

        // Messaging platform
        "plaform": bot.type,

        // the precise bot identity is loaded asynchronously, as /people/me request - issued by "BotKit CiscoSparkBot.js" - returns
        "identity": "unknown",

        // Endpoint where to check the bot is alive
        "healthcheck": "https://" + controller.config.public_address + process.env.HEALTHCHECK_ROUTE,

        // BotCommons specifications version (should be an href)
        "botcommons": "draft",
    }

    //
    // Adding a metadata endpoint
    //
    controller.webserver.get(process.env.BOTCOMMONS_ROUTE, function (req, res) {
        // As the identity is load asynchronously from Cisco Spark token, we need to check until it's fetched
        if ((botcommons.identity == "unknown") && (bot.botkit.identity)) {
            botcommons.identity = bot.botkit.identity.emails[0];
        }
        res.json(botcommons);
    });
    console.log("CiscoSpark: Bot metadata available at: " + process.env.BOTCOMMONS_ROUTE);

    //
    // .botcommons skill
    //
    controller.hears([/^about$/i, /^botcommons$/, /^\.commons$/, /^\.bot$/], 'direct_message,direct_mention', function (bot, message) {

        // Return metadata
        var metadata = '{\n'
            + '   "description" : "' + botcommons["description"] + '",\n'
            + '   "url"         : "' + botcommons["url"] + '",\n'
            + '   "owner"       : "' + botcommons["legal-owner"] + '",\n'
            + '   "support"     : "' + botcommons["support-contact"] + '",\n'
            + '   "healthcheck" : "' + botcommons["healthcheck"] + '",\n'
            + '}\n';

        bot.reply(message, '```json\n' + metadata + '\n```');
    });

}
