import { Client, Collection, IntentsBitField } from "discord.js";
import { deployCommands } from "djs-command-helper";

// I use JSON here, but you can also use dotenv
const config = (
    await import("../config.json", {
        with: { type: "json" },
    })
).default;

// dotenv:
/*
import dotenv from "dotenv";
dotenv.config({path: "./.env"});
*/

// ES Modules are a bit different than commonjs modules so we are constructing ou own Dirname variable here.
const _filename = fileURLToPath(import.meta.url);
const _dirname = getDirname(_filename);
console.log("Current directory path (index.js):", _dirname);

// Create Client instance
var client =new Client({
    // Add more if you want it
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildWebhooks,
      IntentsBitField.Flags.AutoModerationConfiguration,
      IntentsBitField.Flags.AutoModerationExecution,
      IntentsBitField.Flags.DirectMessages,
      IntentsBitField.Flags.GuildModeration,
    ],
  
    // Or leave this property blank if you want to cache everything without 
    makeCache: Options.cacheWithLimits({
      MessageManager: 1024,
      GuildMessageManager: 1024,
    }),
  
    // I personally don't mind of replies fail if not found, but if you want it, set it to `true`
    failIfNotExists: false,
  
    // Enables events from uncached channels like closed posts or DMs
    partials: [Partials.Channel],
  
    // If you only want to enable  certain mentions. This can be overridden when sending a message/reply.
    allowedMentions: { parse: ["users", "roles"], repliedUser: false },
});

// Commands mapped by their name
let commands = new Collection();
// Components mapped by their "prefix" - Read more about that here: <link-to-readme>
let components = new Collection();

const commandsPath = pathJoin(_dirname, "commands");
const commandFiles = readdirSync(commandsPath, { encoding: "utf-8" })
  .filter((fn) => fn.endsWith(".js"))
  .map((fn) => pathJoin(commandsPath, fn));

/**
 * @typedef {Object} CommandFile
 * @property {SlashCommandBuilder?} [data] The slash command's data
 * @property {Function?} [run] The function to be run when the component is executed.
 * @property {Function?} [autocomplete] Optional function if slash command has option(s) with autocomplete.
 * @property {*} [key]
 */

/**
 * @typedef {Object} ComponentFile
 * @property {string?} [preifx] The prefix of the component - <link-to-readme>
 * @property {Function?} [run] The function to be run when the component is executed.
 * @property {*} [key]
 */

for (const file of commandFiles) {
    const filePath = "file://" + file;
    /**
     * @type {CommandFile}
     */
    const command = (await import(filePath)).default; // Command file structure example: <link-here>
    console.log("CommandData:", command?.data);
    if (
      typeof command == "object" &&
      command.hasOwnProperty("data") &&
      command.hasOwnProperty("run")
    ) {
      commands.set(command.data.name, command);
    } else {
      console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "run" property.`);
    }
}

for (const file of componentFiles) {
  const filePath = "file://" + file;
  /**
   * @type {ComponentFile}
   */
  const comp = (await import(filePath)).default;
  if (comp && comp.hasOwnProperty("prefix") && comp.hasOwnProperty("run")) {
    components.set(comp.prefix, comp);
  } else {
    console.error(`[WARNING] The componentFile at ${filePath} is missing a required "prefix" or "run" property.`,);
  }
}

// Event files structure: <link-to-readme>

const eventsPath = pathJoin(_dirname, "events");
const eventsFolders = readdirSync(eventsPath, { encoding: "utf-8" });

for (const event of eventsFolders) {
  let eventPath = pathJoin(eventsPath, event);
  let eventFiles = readdirSync(eventPath)
    .filter((file) => file.endsWith(".js"))
    .map((fn) => pathJoin(eventPath, fn));

  for (let file of eventFiles) {
    const filePath = "file://" + file;
    const func = (await import(filePath)).default;
    if (typeof func !== "function") continue;
    client.on(event, (...args) => func(...args));
  }
}

client.on("interactionCreate", async (interaction) => {
  // Command Handling
  if (interaction.isCommand() || interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);

    if (!command) {
      return console.error(
        `No command matching '${interaction.commandName}' was found.`
      );
    }

    try {
      if (interaction.isAutocomplete()) {
        await command.autocomplete(interaction);
      } else {
        await command.run(interaction);
      }
    } catch (error) {
      console.error(
        `Error while executing command (${interaction.commandName})`,
        error
      );
      if (interaction.isAutocomplete()) return; // You could send a response to an autocomplete request here.

      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: "There was an error while executing this command!",
          })
          .catch((e) => console.error(e));
      } else {
        await interaction
          .reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          })
          .catch((e) => console.error(e));
      }
    }

  // Component Handling
  } else if (
    // Ignore temporary components with the prefix "~/"
    (interaction.isMessageComponent() || interaction.isModalSubmit()) &&
    !interaction.customId.startsWith("~/")
  ) {
    const comp = components.get(parseCustomId(interaction.customId, true));

    if (!comp) {
      console.error(
        `No component matching '${interaction.customId}' was found.`
      );
      return;
    }

    try {
      await comp.run(interaction);
    } catch (error) {
      console.error(
        `Error while executing component (${interaction.customId})`,
        error
      );
      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: "There was an error while executing this component!",
          })
          .catch((e) => console.error(e));
      } else {
        await interaction
          .reply({
            content: "There was an error while executing this component!",
            ephemeral: true,
          })
          .catch((e) => console.error(e));
      }
    }
  }
});

client.on("ready", async (client) => {
  console.info(`Logged in as ${client.user.tag} | ${client.user.id}`);

  await deployCommands(commandsPath, {
    appId: client.application.id,
    appToken: client.token,
  });
});

(async function start() {

  // Either connect directly
  client.login(config.botToken);
  console.info("Bot started");
  // Do additional stuff here

  // Or connect with a mongoose connection
  /*
  mongoose.connect(config.MongoDBUrl).then(async () => {
    console.info("Connected to DB");

    client.login(config.botToken);
    console.info("Bot started");

    // Do additional stuff here
  });
  */
})();
