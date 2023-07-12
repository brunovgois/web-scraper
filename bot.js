require("dotenv/config");

const { Telegraf } = require("telegraf");

const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("comps", (ctx) => {
  console.log(ctx.from);

  const filePath = "weeklyComps.txt";

  // Read the image links from the text file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    const links = data
      .split("\n")
      .slice(1)
      .map((str) => str.trim());

    links.forEach((link) => {
      ctx.telegram.sendMessage(ctx.chat.id, link, {});
    });

    /*     links.forEach(async (link) => {
      const fileUrl = await ctx.telegram.getFileLink(link);
      ctx.replyWithPhoto({ url: fileUrl });
    }); */
  });
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
