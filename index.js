require("dotenv/config");
const rp = require("request-promise");
let $ = require("cheerio");

const url = process.env.URL_NAME;

if(typeof(cheerio) != 'function') $=require('cheerio').default

rp(url)
  .then(function (html) {
    console.log($('a img', html).length);
    console.log($('a img', html));
  })
  .catch(function (err) {
    console.error(err);
  });
