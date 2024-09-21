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
const HACKMD_API_URL = "https://api.hackmd.io/v1/notes";
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN; // HackMD API Token

async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Create an array to hold the mixed content (text and images)
    const contentArray = [];

    // Get the title and convert to Markdown header
    const title = $("title").text();
    const Title = `# ${title}\n\n`; // Markdown 標題

    // 抓取所有段落和圖片，按出現順序加入
    $("p, img").each((index, element) => {
      if ($(element).is("p")) {
        // 如果是段落，加入文字
        contentArray.push($(element).text());
      } else if ($(element).is("img")) {
        // 如果是圖片，加入 Markdown 圖片標籤
        let imgSrc = $(element).attr("src");

        // 處理相對路徑
        if (imgSrc && !imgSrc.startsWith("http")) {
          imgSrc = new URL(imgSrc, url).href; // 將相對路徑轉換為絕對路徑
        }

        if (imgSrc) {
          contentArray.push(`![Image](${imgSrc})`); // Markdown 格式圖片
        }
      }
    });

    // 將混合的內容用兩個換行符號分隔，組織成 Markdown 格式
    const fullContent = `${Title}${contentArray.join("\n\n")}`;

    /* 翻譯文章內容
    const targetLanguage = "zh";
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Translate the following text to ${targetLanguage}`,
        },
        { role: "user", content: content }, // content 是抓取的文章內容
      ],
    });

    const translatedContent =
      translationResponse.data.choices[0].message.content;

    // 將內容寫入 .md 檔案
    fs.writeFile("article.md", translatedContent, "utf8", (err) => {
      if (err) {
        console.error("寫入檔案失敗:", err);
      } else {
        console.log("文章已成功儲存到 article.md");
      }
    });
    */

    // 返回最終的 Markdown 內容
    return fullContent;
  } catch (error) {
    console.error("抓取失敗:", error);
  }
}

async function postToHackMD(title, content) {
  try {
    const response = await axios.post(
      HACKMD_API_URL,
      {
        title: title,
        content: content,
        readPermission: "owner",
        writePermission: "owner",
        commentPermission: "everyone",
      },
      {
        headers: {
          Authorization: `Bearer ${HACKMD_API_TOKEN}`,
        },
      }
    );

    if (response.data && response.data.publishLink) {
      return `筆記已成功發佈！查看連結：${response.data.publishLink}`;
    } else {
      return "發佈到 HackMD 失敗，請稍後再試。";
    }
  } catch (error) {
    console.error("發佈到 HackMD 失敗:", error); // 更詳細的錯誤輸出
    if (error.response) {
      // 如果有 response，輸出詳細的 response 資訊
      console.error("錯誤狀態碼:", error.response.status);
      console.error("錯誤訊息:", error.response.data);
      return `發佈到 HackMD 失敗，錯誤狀態碼: ${error.response.status}，錯誤訊息: ${error.response.data}`;
    } else if (error.request) {
      // 請求已發送，但沒有收到回應
      console.error("請求發送後無回應:", error.request);
      return "發佈到 HackMD 失敗，請求發送後無回應。";
    } else {
      // 其他錯誤
      console.error("錯誤訊息:", error.message);
      return `發佈到 HackMD 失敗，錯誤訊息: ${error.message}`;
    }
  }
}

// 處理 Telegram Bot 發送的訊息
bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  // 檢查是否為有效的網址
  if (isValidUrl(url)) {
    ctx.reply("正在抓取文章，請稍候...");

    const articleContent = await fetchArticleContent(url);

    if (articleContent) {
      // 將文章發佈到 HackMD
      const postResult = await postToHackMD("抓取文章", articleContent);

      // 回傳 HackMD 的結果連結
      ctx.reply(postResult);
    } else {
      ctx.reply("無法抓取文章，請稍後再試。");
    }
  } else {
    ctx.reply("請提供有效的網址。");
  }
});

// 啟動 bot
bot.launch();
console.log("Telegram bot 已啟動");

// 檢查是否為有效的 URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
