require("dotenv/config");
const path = require("path");
const { Telegraf } = require("telegraf");

const { createClient } = require("@supabase/supabase-js");

const bot = new Telegraf(process.env.BOT_TOKEN);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const messagesIdLog = [];

bot.telegram.setMyCommands([
  {
    command: "comps",
    description:
      "Get a list of the best team compositions and how to play with them",
  },
  {
    command: "top_5",
    description: "Get the top 5 team compositions",
  }
]);

bot.command("comps", async (ctx) => {
  try {
    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return;
    }

    console.log(data)

    for (const comp of data[0].comps) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON:", e);
  }
});

bot.command("top_5", async (ctx) => {
  try {
    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return;
    }

    for (const comp of data[0].comps.slice(0, 5)) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON:", e);
  }
});

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
