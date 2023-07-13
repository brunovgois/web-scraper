require("dotenv/config");

const { Telegraf } = require("telegraf");

const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);
const filePath = "weeklyComps.json";

bot.command("comps", async (ctx) => {
  console.log(ctx.from);
  try {
    const jsonString = await fs.promises.readFile(filePath, "utf8");
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

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
