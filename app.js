const axios = require("axios"); // 發送 HTTP 請求
const cheerio = require("cheerio"); // 解析 HTML
const { Telegraf } = require("telegraf"); // Telegram Bot API
require("dotenv").config(); // 載入環境變數

// 設置 telegram API
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 設置 HackMD API Token 和 API URL
const HACKMD_API_URL = "https://api.hackmd.io/v1/teams/funblocks/notes";
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN; // HackMD API Token

// Lingva Translate API 函數
async function translateWithLingva(text, sourceLang = "en", targetLang = "zh") {
  const lingvaUrl = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}`;

  try {
    // 使用 POST 請求將 text 作為請求的主體
    const response = await axios.post(lingvaUrl, {
      text: text, // 將需要翻譯的文本放在請求主體中
    });

    // 假設 API 回應的結構未變更，這裡也需確認 API 文件
    return response.data.translation;
  } catch (error) {
    console.error("翻譯失敗:", error);
    return null; // 或者根據需要處理錯誤
  }
}

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
        let imgSrc = $(element).attr("src");
        const imgId = $(element).attr("id");
        const imgAlt = $(element).attr("alt");

        // console.log(
        //   `Image found - src: ${imgSrc}, id: ${imgId}, alt: ${imgAlt}`
        // );

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

    // 翻譯文章內容
    const targetLanguage = "zh";
    const translatedContent = await translateWithLingva(
      fullContent,
      "en",
      targetLanguage
    );

    console.log(translatedContent);

    // 返回最終的 Markdown 內容
    return { title, content: translatedContent || fullContent };
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

    // console.log(response);

    if (response.data && response.data.publishLink) {
      return `筆記已成功發佈！查看連結：${response.data.publishLink}`;
    } else {
      return "發佈到 HackMD 失敗，請稍後再試。";
    }
  } catch (error) {
    console.error("發佈到 HackMD 失敗:", error); // 更詳細的錯誤輸出
  }
}

// 處理 Telegram Bot 發送的訊息
bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  // 檢查是否為有效的網址
  if (isValidUrl(url)) {
    ctx.reply("正在抓取文章，請稍候...");

    const articleData = await fetchArticleContent(url);
    const duplicatedlink = await isArticleUploaded(articleData.title);
    if (duplicatedlink != 0) {
      ctx.reply(`已上傳過本篇文章，文章連結: ${duplicatedlink}`);
    } else if (articleData && articleData.content) {
      // 將文章發佈到 HackMD
      const postResult = await postToHackMD(
        articleData.title,
        articleData.content
      );

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

async function isArticleUploaded(title) {
  try {
    const response = await axios.get(
      `https://api.hackmd.io/v1/teams/funblocks/notes`,
      {
        headers: {
          Authorization: `Bearer ${HACKMD_API_TOKEN}`, // 替換成你的 API Key
        },
      }
    );

    const notes = response.data; // 獲取筆記數據
    // console.log(notes); // 打印 API 回應數據

    // 找到所有重複標題的筆記連結
    const duplicateLinks = notes
      .filter((note) => note.title === title) // 過濾出標題匹配的筆記
      .map((note) => note.publishLink); // 獲取對應的 publishLink

    // console.log(duplicateLinks.join(", "));

    if (duplicateLinks.length > 0) {
      // 如果找到重複的標題，返回連結
      return duplicateLinks.join(", "); // 返回所有重複標題的連結
    } else {
      // 沒有重複的標題
      return 0; // 或者返回 null, 根據需求
    }
  } catch (error) {
    console.error("檢查上傳狀態時出錯:", error);
    return null; // 或者根據需要處理錯誤
  }
}
