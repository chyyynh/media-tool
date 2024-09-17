const axios = require("axios"); // 發送 HTTP 請求
const cheerio = require("cheerio"); // 解析 HTML
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

// 定義翻譯函數，通過 ChatGPT API
async function translateTextWithChatGPT(text, targetLanguage) {
  try {
    const prompt = `Please translate the following text to ${targetLanguage}: "${text}"`;
    const response = await openai.createCompletion({
      model: "text-davinci-003", // 可以使用最新的模型
      prompt: prompt,
      max_tokens: 1000,
    });
    return response.data.choices[0].text.trim(); // 提取翻譯結果
  } catch (error) {
    console.error("翻譯錯誤:", error);
  }
}

async function fetchArticleContent() {
  try {
    await axios
      .get(url)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);

        // Get the title
        const title = $("title").text();

        // Get the main article content
        const paragraphs = [];
        $("p").each((index, element) => {
          paragraphs.push($(element).text());
        });

        console.log("Title:", title);
        console.log("Content:", paragraphs);
      })
      .catch((error) => {
        console.error("Error fetching the page:", error);
      });
  } catch (error) {
    console.error("Error fetching article:", error);
  }
}

// 執行爬蟲
fetchArticleContent();
