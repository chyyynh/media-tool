const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
require("dotenv").config(); // 載入環境變數

// HackMD API 設定
const HACKMD_API_URL = "https://api.hackmd.io/v1";
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN;

// 翻譯 Azure Function
async function translateWithAzure(text) {
  const AZURE_API_URL = "https://api.cognitive.microsofttranslator.com";
  const AZURE_API_KEY = process.env.AZURE_API_KEY;
  const region = "eastasia";

  try {
    const response = await axios({
      method: "post",
      url: `${AZURE_API_URL}/translate?api-version=3.0&from=en&to=zh-Hant`,
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      data: [
        {
          Text: text,
        },
      ],
    });

    const translation = response.data[0].translations[0].text;
    return translation;
  } catch (error) {
    console.error("翻譯失敗:", error);
    return null;
  }
}

// 從 HackMD 取得文件內容
async function fetchHackMDDocument(docId) {
  console.log(`${HACKMD_API_URL}/notes/${docId}`);
  try {
    const response = await axios.get(`${HACKMD_API_URL}/notes/${docId}`, {
      headers: {
        Authorization: `Bearer ${HACKMD_API_TOKEN}`,
      },
    });

    console.log(response.data.content);

    return response.data.content; // 返回文件的內容
  } catch (error) {
    console.error("無法取得 HackMD 文件:", error);
    return null;
  }
}

// 主流程
async function translateHackMD(docId) {
  // 1. 讀取 HackMD 文件內容
  const content = await fetchHackMDDocument(docId);
  if (!content) return;

  // 2. 翻譯內容
  const lines = content.split("\n"); // 按行分割
  const translatedLines = [];

  for (const line of lines) {
    if (line.trim() === "") {
      // 保留空行
      translatedLines.push("");
      continue;
    }
    const translatedLine = await translateWithAzure(line);
    if (translatedLine) {
      // 加入原文和翻譯
      translatedLines.push(line); // 原文
      translatedLines.push(translatedLine); // 翻譯
    } else {
      translatedLines.push(line); // 如果翻譯失敗則保留原文
    }
  }

  const translatedContent = translatedLines.join("\n");

  // Update Hackmd
  try {
    const response = await axios.post(
      `https://api.hackmd.io/v1/notes/`,
      {
        title: "title",
        content: translatedContent,
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

    console.log("文件已更新:", response.data.publishLink);

    const del = await axios.delete(`https://api.hackmd.io/v1/notes/${docId}`, {
      headers: {
        Authorization: `Bearer ${HACKMD_API_TOKEN}`,
      },
    });
  } catch (error) {
    console.error("更新失敗:", error.response?.status, error.response?.data);
  }
}

// 啟動終端輸入介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("請輸入 HackMD Document ID: ", (docId) => {
  translateHackMD(docId).then(() => rl.close());
});
