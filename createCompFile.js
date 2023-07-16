require("dotenv/config");
const axios = require('axios');
const cheerio = require("cheerio");
const fs = require("fs");

const url = process.env.URL_NAME;

axios.get(url)
  .then(function (response) {
    const html = response.data;
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

    const jsonString = JSON.stringify(compositions, null, 2);

    fs.writeFile("./weeklyComps.json", jsonString, (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully wrote file");
      }
    });
  })
  .catch(function (err) {
    console.error(err);
  });

function getImages($) {
  const images = $(".wp-block-image.size-large");

  const imageUrls = images
    .map(function () {
      if ($(this).children().prop("name") === "img") {
        return $(this).children("img").attr("src");
      } else {
        return $(this).children("a").children("img").attr("src");
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

    if ($element.text().includes("How to Play")) {
      shouldExtract = true;
      currentText = "";
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
