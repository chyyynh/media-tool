## Media Tool

This project is a simple article translation service using Cloudflare Workers and a Telegram Bot. When you send an article link to the Telegram Bot, it will scrape the article content, use the Google Gemini API for translation, then post the translated article to HackMD, and finally return the HackMD link to you.

## Features

- Receives article links from Telegram messages.
- Scrapes article content using Cheerio.
- Translates article content using the Google Gemini API.
- Posts the translated content to HackMD.
- Returns the HackMD link to the user.
