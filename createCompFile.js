require("dotenv/config");
const axios = require("axios");
const cheerio = require("cheerio");

const url = process.env.URL_NAME;

const createComp = async () => {
  try{
    const response = await axios.get(url);

  const html = response.data;
  const compositions = createJSONFromHTML(html);

  //TODO: replace JSON text for supabase
  //get to see if entries match
  //post new entry if dont

  const jsonString = JSON.stringify(compositions, null, 2);
  console.log(jsonString);
  } catch(e){
    console.error(err)
  }
};

createComp()

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
