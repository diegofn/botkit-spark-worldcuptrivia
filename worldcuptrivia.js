//
// Copyright (c) 2017 Diego Fernando Nieto <diegofn@me.com>
// Licensed under the MIT License 
//

//
// BotKit configuration
//

//
// Load environment variables from project .env file
//
require('node-env-file')(__dirname + '/.env');

if (!process.env.SPARK_TOKEN) {
    console.log("Could not start as bots require a Cisco Spark API access token.");
    console.log("Please add env variable SPARK_TOKEN on the command line or to the .env file");
    console.log("Example: ");
    console.log("> SPARK_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
    process.exit(1);
}

//
// Get public URL where Cisco Spark will post spaces notifications (webhook registration)
//

var public_url = process.env.PUBLIC_URL;
if (!public_url) {
    console.log("Could not start as this bot must expose a public endpoint.");
    console.log("Please add env variable PUBLIC_URL on the command line or to the .env file");
    console.log("Example: ");
    console.log("> SPARK_TOKEN=XXXXXXXXXXXX PUBLIC_URL=YYYYYYYYYYYYY node bot.js");
    process.exit(1);
}

//
// Create bot
//
var Botkit = require('botkit');

var env = process.env.NODE_ENV || "development";
var controller = Botkit.sparkbot({
    log: true,
    public_address: public_url,
    webserver: {
        static_dir: __dirname + '/public'
    },
    ciscospark_access_token: process.env.SPARK_TOKEN,
    secret: process.env.SECRET, // this is a RECOMMENDED security setting that checks of incoming payloads originate from Cisco Spark
    json_file_store: './botkit-sparkbot/',
    webhook_name: process.env.WEBHOOK_NAME || ('built with BotKit (' + env + ')')
});

var bot = controller.spawn({
});


//
// Launch bot
//
var port = process.env.PORT || 3000;
controller.setupWebserver(port, function (err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function () {
        console.log("Cisco Spark: Webhooks set up!");
    });

    //
    // installing Healthcheck
    //
    var healthcheck = {
        "up-since": new Date(Date.now()).toGMTString(),
        "hostname": require('os').hostname() + ":" + port,
        "version": "v" + require("./package.json").version,
        "bot": "unknown",   // loaded asynchronously
        "botkit": "v" + bot.botkit.version()
    };

    webserver.get(process.env.HEALTHCHECK_ROUTE, function (req, res) {

        //
        // As the identity is load asynchronously from Cisco Spark token, we need to check until it's fetched
        //
        if (healthcheck.bot == "unknown") {
            var identity = bot.botkit.identity;
            if (bot.botkit.identity) {
                healthcheck.bot = bot.botkit.identity.emails[0];
            }
        }

        res.json(healthcheck);
    });
    console.log("Cisco Spark: healthcheck available at: " + process.env.HEALTHCHECK_ROUTE);
});


//
// Load skills
//

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function (file) {
    try {
        require("./skills/" + file)(controller, bot);
        console.log("Cisco Spark: loaded skill: " + file);
    }
    catch (err) {
        if (err.code == "MODULE_NOT_FOUND") {
            if (file != "utils") {
                console.log("Cisco Spark: could not load skill: " + file);
            }
        }
    }
});


//
// Cisco Spark Utilities
//

// Utility to add mentions if Bot is in a 'Group' space
bot.appendMention = function (message, command) {

    // if the message is a raw message (from a post message callback such as bot.say())
    if (message.roomType && (message.roomType == "group")) {
        var botName = bot.botkit.identity.displayName;
        return "`@" + botName + " " + command + "`";
    }

    // if the message is a Botkit message
    if (message.raw_message && (message.raw_message.data.roomType == "group")) {
        var botName = bot.botkit.identity.displayName;
        return "`@" + botName + " " + command + "`";
    }

    return "`" + command + "`";
}
