require("dotenv/config");
const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const URL = process.env.URL_NAME;
const categories = { S: [], A: [], B: [] };

const createComp = async () => {
  try {
    const response = await axios.get(URL);

    const html = response.data;
    const compositions = createJSONFromHTML(html);

    const { data } = await supabase.from("TeamComps").select("*").order('created_at', { ascending: false }).limit(1);

    const thisWeekEqualPastWeek = areJSONCompsEqual(
      compositions,
      data[0].comps
    );

    if (thisWeekEqualPastWeek) {
      console.log("The JSON responses are equal. Nothing added to database");
      return;
    } else {
      const { error: insertError } = await supabase
        .from("TeamComps")
        .insert([{ comps: compositions, comp_names: categories }]);

      if (insertError) {
        console.error("Error inserting new data to Supabase:", insertError);
        return;
      }
      console.log("New entry added to database");

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
    return false;
  }

  for (let i = 0; i < response1.length; i++) {
    if (!areObjectsEqual(response1[i], response2[i])) {
      return false;
    }
  }
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

function extractLargestSrcSet(imageUrls) {
  const largestURLs = [];

  imageUrls.forEach((imageUrlSet) => {
    const urls = imageUrlSet.split(', ');

    let maxResolution = 0;
    let largestURL = '';

    urls.forEach((url) => {
      const [imageUrl, resolution] = url.split(' ');

      const value = parseInt(resolution, 10);

      if (!isNaN(value) && value > maxResolution) {
        maxResolution = value;
        largestURL = imageUrl;
      }
    });

    largestURLs.push(largestURL);
  });

  return largestURLs;
}


function getImages($) {
  const images = $(".gb-block-image");

  const imageUrls = images
    .map(function () {
      return $(this).children("a").children("img").attr("srcset")
    })
    .get();

  const updatedImageUrls = extractLargestSrcSet(imageUrls)


  return updatedImageUrls;
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

  pTags.each(function (_, element) {
    var $element = $(element);
    const previousSibling = $element.prev();
    const parent = $element.parent();

    const isPreviousSiblingFigure = previousSibling.is("figure");
    const isParentPreviousSiblingH2 = parent.prev().is("h2");

    if (isParentPreviousSiblingH2) {
      const parts = $element.text().split(/([SAB]:)\s*/).filter(part => part.trim().length > 0);
      let currentCategory = '';

      parts.forEach(part => {
        if (part.endsWith(':')) {
          currentCategory = part.slice(0, 1);
        } else {
          const strings = part.split(',').map(s => s.trim()).filter(Boolean);
          categories[currentCategory] = categories[currentCategory].concat(strings);
        }
      });

    }
    if (isPreviousSiblingFigure) {
      currentText = $element.text() + "\n\n";
    }

    if ($element.text().includes("Headliner")) {
      shouldExtract = true;
    }

    if (shouldExtract) {
      currentText += $element.text() + " ";

      if ($element.text().includes("Items")) {
        shouldExtract = false;
        extractedTexts.push(
          currentText.trim().replace("Items:", "").
          replace(/\s*Item Holder:\s*/g, '\n\nItem Holder: ').
          replace(/\s*Best Emblem\s*/g, '\n\nBest Emblem').
          replace(/\s*How to Play\s*/g, '\n\nHow to Play')
        );
      }
    }
  });

  return extractedTexts;
}
