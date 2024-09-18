const axios = require("axios"); // 發送 HTTP 請求
const cheerio = require("cheerio"); // 解析 HTML
const fs = require("fs"); // 寫入檔案
require("dotenv").config(); // 載入環境變數
const OpenAI = require("openai"); // 引入 OpenAI API

// 設置 OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 使用環境變數中的 API key
});

// 目標網頁 URL
const url =
  "https://world.mirror.xyz/AzD5skm2IrCVnNOHkRNOsOTxAyBLtJ4zm71QoFNqQwg";

async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Get the title and convert to Markdown header
    const title = $("title").text();
    const markdownTitle = `# ${title}\n\n`; // Markdown 標題

    // Get the main article content
    const paragraphs = [];
    $("p").each((index, element) => {
      paragraphs.push($(element).text());
    });

    // 合併段落
    const content = paragraphs.join("\n\n"); // Markdown 以兩個換行符號區分段落

    // 合併標題和內容
    const markdownContent = markdownTitle + content;

    // 翻譯文章內容
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
  } catch (error) {
    console.error("抓取失敗:", error);
  }
}

// 調用函數
fetchArticleContent(url);
