require("dotenv/config");
const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const URL = process.env.URL_NAME;

const createComp = async () => {
  try {
    const response = await axios.get(URL);

    const html = response.data;
    const compositions = createJSONFromHTML(html);

    const { data, error } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);


    const thisWeekEqualPastWeek = areJSONCompsEqual(
      compositions,
      data[0].comps
    );

    if (thisWeekEqualPastWeek) {

      return;
    } else {
      const { data: newData, error: insertError } = await supabase
        .from("TeamComps")
        .insert([{ comps: compositions }]);

      if (insertError) {
        console.error("Error inserting new data to Supabase:", insertError);
        return;
      }

      console.log("New entry added to Supabase:", newData);

    }
  } catch (e) {
    console.error(e);
  }
};

createComp();

function sortObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject).sort();
  }

  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = sortObject(obj[key]);
    });

  return sortedObj;
}

function areObjectsEqual(obj1, obj2) {
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    return obj1 === obj2;
  }

  const sortedObj1 = sortObject(obj1);
  const sortedObj2 = sortObject(obj2);
  return JSON.stringify(sortedObj1) === JSON.stringify(sortedObj2);
}

function areJSONCompsEqual(response1, response2) {

  if (response1.length !== response2.length) {
    console.log("The JSON responses are not equal.");
    return false;
  }

  for (let i = 0; i < response1.length; i++) {
    if (!areObjectsEqual(response1[i], response2[i])) {
      console.log("The JSON responses are not equal.");
      return false;
    }
  }
  console.log("The JSON responses are equal.");
  return true;
}

function createJSONFromHTML(html) {
  const $ = cheerio.load(html);

  const titles = getCompTitles($);
  const images = getImages($);

  const texts = getHowToPlay($);

  const compositions = [];

  for (let i = 0; i < titles.length; i++) {
    const obj = {
      title: titles[i],
      img: images[i],
      text: texts[i],
    };
    compositions.push(obj);
  }

  return compositions;
}

function getImages($) {
  const images = $(".wp-block-image.size-large");

  const imageUrls = images
    .map(function () {
      if ($(this).children().prop("name") === "img") {
        return $(this).children("img").attr("data-origin-src")
      } else {
        return $(this).children("a").children("img").attr("data-origin-src")
      }
    })
    .get();


  return imageUrls;
}
function getCompTitles($) {
  const compTitles = $("h3");
  const titles = [];

  compTitles.each(function (index, element) {
    const $element = $(element);
    titles.push($element.text());
  });

  return titles;
}

function getHowToPlay($) {
  const pTags = $("p");

  const extractedTexts = [];
  var shouldExtract = false;
  var currentText = "";

  pTags.each(function (index, element) {
    var $element = $(element);

    const previousSibling = $element.prev();
    const isPreviousSiblingFigure = previousSibling.is("figure");

    if (isPreviousSiblingFigure) {
      currentText = $element.text() + "\n";
    }

    if ($element.text().includes("How to Play")) {
      shouldExtract = true;
    }

    if (shouldExtract) {
      currentText += $element.text().trim() + " ";

      if ($element.text().includes("Counters")) {
        shouldExtract = false;
        extractedTexts.push(
          currentText.replace("Items: Core: ", "").slice(0, -9).trim()
        );
      }
    }
  });

  extractedTexts.forEach((text, index) => {
    extractedTexts[index] = text.replace("Augments:", "");
  });

  return extractedTexts;
}
