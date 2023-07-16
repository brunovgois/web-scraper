require("dotenv/config");
const path = require("path");
const { Telegraf } = require("telegraf");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const messagesIdLog = [];

bot.telegram.setMyCommands([
  {
    command: "comps",
    description:
      "Get a list of the weekly best team compositions and how to play with them",
  },
  /*   {
    command: "test",
    description: "testing",
  }, */
]);

bot.command("comps", async (ctx) => {
  console.log(ctx.from);
  try {
    const jsonString = await fs.promises.readFile(
      require.resolve("./weeklyComps"),
      "utf8"
    );
    const objects = JSON.parse(jsonString);

    for (const comp of objects) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON file:", e);
  }
});

/* bot.command("test", (ctx) => {
  //testing
  ctx.reply(messagesIdLog.toString(), {
    reply_to_message_id: messagesIdLog[2],
  });
}); */

async function sendMessageWithDelay(ctx, comp, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      ctx.telegram
        .sendMessage(
          ctx.chat.id,
          `${comp.title}\n\n${comp.text}\n\n${comp.img}`,
          {
            disable_notification: true,
          }
        )
        .then((m) => {
          messagesIdLog.push(m.message_id);
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
      resolve();
    }, delay);
  });
}

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
