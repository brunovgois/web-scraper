require('dotenv/config');
const rp = require('request-promise');
const url = process.env.URL_NAME;

rp(url)
  .then(function(html){
    console.log(html);
  })
  .catch(function(err){
    console.error(err)
  });