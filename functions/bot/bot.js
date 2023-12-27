require("dotenv/config");
const { Telegraf } = require("telegraf");

const { createClient } = require("@supabase/supabase-js");

const bot = new Telegraf(process.env.BOT_TOKEN);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const messagesIdLog = [];

let cachedData = undefined;

async function fetchTeamComps() {
  const { data, error } = await supabase
    .from("TeamComps")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching data from Supabase:", error);
    return null;
  }

  return data[0];
}

bot.telegram.setMyCommands([
  {
    command: "comps",
    description:
      "Get a list of the best team compositions and how to play with them",
  },
  {
    command: "s_tier",
    description: "Get the S tier team compositions",
  },
  {
    command: "a_tier",
    description: "Get the A tier team compositions",
  },
  {
    command: "b_tier",
    description: "Get the b tier team compositions",
  }
]);

bot.command("comps", async (ctx) => {
  try {

    if (!cachedData) {
      cachedData = await fetchTeamComps();
    }

    for (const comp of cachedData.comps) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON:", e);
  }
});

bot.command("s_tier", async (ctx) => {
  try {
    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    const filteredCompositions = data[0].comps.filter(composition => {
      data[0].comp_names.S.includes(composition.title)

      const normalizedTitle = data[0].comp_names.S.map(title => title.toLowerCase().trim());
      const normalizedCompositionTitle = composition.title.toLowerCase().trim();

      return normalizedTitle.includes(normalizedCompositionTitle);
    });

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return;
    }

    for (const comp of filteredCompositions) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON:", e);
  }
});

bot.command("a_tier", async (ctx) => {
  try {
    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    const filteredCompositions = data[0].comps.filter(composition => {
      data[0].comp_names.A.includes(composition.title)

      const normalizedTitle = data[0].comp_names.A.map(title => title.toLowerCase().trim());
      const normalizedCompositionTitle = composition.title.toLowerCase().trim();

      return normalizedTitle.includes(normalizedCompositionTitle);
    });

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return;
    }

    for (const comp of filteredCompositions) {
      await sendMessageWithDelay(ctx, comp, 300);
    }
  } catch (e) {
    console.error("Error reading or parsing JSON:", e);
  }
});

bot.command("b_tier", async (ctx) => {
  try {
    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    const filteredCompositions = data[0].comps.filter(composition => {
      data[0].comp_names.B.includes(composition.title)

      const normalizedTitle = data[0].comp_names.B.map(title => title.toLowerCase().trim());
      const normalizedCompositionTitle = composition.title.toLowerCase().trim();

      return normalizedTitle.includes(normalizedCompositionTitle);
    });

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      return;
    }

    for (const comp of filteredCompositions) {
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
