const axios = require("axios"); // 發送 HTTP 請求
const cheerio = require("cheerio"); // 解析 HTML
const fs = require("fs");

// import OpenAI from "openai"; // Import the OpenAI class

/* 設置 OpenAI API
const configuration = new Configuration({
  apiKey: "你的 OpenAI API 金鑰",
});
const openai = new OpenAIApi(configuration);
*/

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

    // 將內容寫入 .md 檔案
    fs.writeFile("article.md", markdownContent, "utf8", (err) => {
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
