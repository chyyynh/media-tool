const axios = require("axios"); // 發送 HTTP 請求
const cheerio = require("cheerio"); // 解析 HTML
const fs = require("fs"); // 寫入檔案
const { Telegraf } = require("telegraf"); // Telegram Bot API
const OpenAI = require("openai"); // 引入 OpenAI API
require("dotenv").config(); // 載入環境變數

// 設置 OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 使用環境變數中的 API key
});

// 設置 telegram API
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 設置 HackMD API Token 和 API URL
const HACKMD_API_URL = "https://api.hackmd.io/v1/teams/funblocks/notes";
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN; // HackMD API Token

async function getTeamNotes(teamPath) {
  try {
    const response = await axios.get(
      `https://api.hackmd.io/v1/teams/${teamPath}/notes`,
      {
        headers: {
          Authorization: `Bearer ${HACKMD_API_TOKEN}`, // 替換成你的 API Key
        },
      }
    );
    console.log(response.data); // 打印 API 回應數據
  } catch (error) {
    console.error("Error fetching team notes:", error);
  }
}

function isLinkUploaded(publishLink) {
  // 使用 Array 的 some() 方法檢查是否有相符的 publishLink
  return notes.some((note) => note.publishLink === publishLink);
}

getTeamNotes("funblocks");
