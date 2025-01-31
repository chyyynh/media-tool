// telegram_bot.js - modified
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv"; // 載入環境變數
import {
  translateWithAzure,
  fetchArticleContent,
  postToHackMD,
  isValidUrl,
  isArticleUploaded,
  formatTitle,
} from "./translate_to_hackmd.js";

dotenv.config(); // 載入環境變數

const TELEGRAM_BOT_TOKEN = process.env.FUNBLOCKS_BOT_TOKEN; // 在此填入你的 Telegram Bot Token

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome! Please choose an option:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Translate", callback_data: "translate" },
          { text: "Upload", callback_data: "upload" },
        ],
      ],
    },
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  if (callbackQuery.data === "translate") {
    bot.sendMessage(
      chatId,
      "You chose to translate. Please send the text you want to translate."
    );
    bot.once("message", async (msg) => {
      const translatedText = await fetchArticleContent(msg.text);
      bot.sendMessage(chatId, `Translated text: ${translatedText}`);
    });
  } else if (callbackQuery.data === "upload") {
    bot.sendMessage(
      chatId,
      "You chose to upload. Please send the file you want to upload."
    );
    // Here you can add the logic to handle the file upload
  }
});

console.log("Telegram Bot 已啟動");
