import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../utils/main.js";

export default {
  prefix: "hey",

  /**
   *
   * @param {ButtonInteraction} ctx
   */
  async run(ctx) {
    await ctx.deferReply({ ephemeral: true });
    const firstParam =
      typeof parsedId === "string" ? parsedId : parsedId.firstParam; // That's just the TS compiler being dumb...

    const newNumber = parseInt(firstParam) + 1;

    await ctx.editReply(`The random number + 1 is ${newNumber}!`);
  },
};
