## Web Scraper + Telegram Bot

[![Netlify Status](https://api.netlify.com/api/v1/badges/b693a613-8a7b-4c73-bdf9-7f2c3d0f54f0/deploy-status)](https://app.netlify.com/sites/tft-best-comps/deploys)

A telegram bot with commands to show the current best team composition to try it out on [Teamfight Tactics](https://teamfighttactics.leagueoflegends.com/en-us/).

Made with: 
- node
  - puppeteer -> data scraping
  - telegraf.js -> telegram Bot
- supabase -> DB
- netlify -> host lambda functions that run the server for the bot

Check it out [Here](https://t.me/tft_best_comps_bot)
