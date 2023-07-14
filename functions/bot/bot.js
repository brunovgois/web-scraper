require("dotenv/config");
const path = require("path");
const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

/* const rootDir = process.env.LAMBDA_TASK_ROOT;

const filePath = path.join(rootDir, "weeklyComps.json"); */

const fileName = "weeklyComps.json";
const resolved = process.env.LAMBDA_TASK_ROOT
  ? path.resolve(process.env.LAMBDA_TASK_ROOT, fileName)
  : path.resolve(__dirname, fileName);

bot.telegram.setMyCommands([
  {
    command: "comps",
    description:
      "Get a list of the weekly best team compositions and how to play with them",
  },
]);

bot.command("comps", async (ctx) => {
  console.log(ctx.from);
  try {
    const jsonString = await fs.promises.readFile(resolved, "utf8");
    const objects = JSON.parse(jsonString);

    for (const comp of objects) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON file:", e);
  }
});

async function sendMessageWithDelay(ctx, comp, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      ctx.telegram.sendMessage(
        ctx.chat.id,
        `${comp.title}\n\n${comp.text}\n\n${comp.img}`,
        {
          disable_notification: true,
        }
      );
      resolve();
    }, delay);
  });
}

/* bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
 */

exports.handler = async (event) => {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: "" };
  } catch (e) {
    console.error("error in handler:", e);
    return {
      statusCode: 400,
      body: "This endpoint is meant for bot and telegram communication",
    };
  }
};
