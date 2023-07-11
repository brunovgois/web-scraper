require("dotenv/config");
const rp = require("request-promise");
const cheerio = require("cheerio");

const url = process.env.URL_NAME;

rp(url)
  .then(function (html) {
    const $ = cheerio.load(html);
    const images = $("a img");

    const imageUrls = images
      .map(function () {
        return $(this).attr("src");
      })
      .get();

    console.log("Number of images:", images.length);
    console.log("Image URLs:", imageUrls);
  })
  .catch(function (err) {
    console.error(err);
  });
