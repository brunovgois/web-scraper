require("dotenv/config");
const axios = require("axios");
const cheerio = require("cheerio");

const URL = process.env.URL_NAME;
const databaseURL = process.env.URL_DATABASE;

const createComp = async () => {
  try {
    const response = await axios.get(URL);

    const html = response.data;
    const compositions = createJSONFromHTML(html);

    //TODO: replace JSON text for supabase
    //get to see if entries match
    //post new entry if dont

    const jsonString = JSON.stringify(compositions, null, 2);

    const getCompFromDatabase = await axios.get(databaseURL, {
      headers: {
        apiKey: process.env.API_KEY_DATABASE,
      },
    });

    console.log();

    console.log();

    const bool = areJSONCompsEqual(
      jsonString,
      getCompFromDatabase.data[0].comps
    ); //change 2 parameter

    console.log(bool);

  } catch (e) {
    console.error(e);
  }
};

createComp();

// Function to recursively sort properties within an object
function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject).sort();
  }

  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortObject(obj[key]);
  });


  return sortedObj;
}

// Function to compare two JSON objects
function areObjectsEqual(obj1, obj2) {
  const sortedObj1 = sortObject(obj1);
  const sortedObj2 = sortObject(obj2);
  return JSON.stringify(sortedObj1) === JSON.stringify(sortedObj2);
}

// Function to compare the responses
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
  return true;
}

/* // Function to sort properties within an object
function sortObject(obj) {
  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = obj[key];
    });
  return sortedObj;
}

// Function to compare two JSON objects
function areObjectsEqual(obj1, obj2) {
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
} */

function createJSONFromHTML(html) {
  const $ = cheerio.load(html);

  const titles = getCompTitles($);
  const images = getImages($);
  const texts = getHowToPlay($);

  const compositions = [];

  for (let i = 0; i < titles.length; i++) {
    const obj = {
      title: titles[i],
      img: images[i].slice(2),
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
        return $(this).children("img").attr("src").replace(".webp ", "");
      } else {
        return $(this)
          .children("a")
          .children("img")
          .attr("src")
          .replace(".webp", "");
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

  return extractedTexts;
}
