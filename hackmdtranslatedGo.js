import axios from "axios";
import readline from "readline";
import * as dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config(); // 載入環境變數

// HackMD API 設定
const HACKMD_API_URL = "https://api.hackmd.io/v1";
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN;
const HackMDteamid = "funblocks";
const HackMDteam_API_URL = `${HACKMD_API_URL}/teams/${HackMDteamid}/notes/`;

// Google Generative AI 設定
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 翻譯 Google Generative AI Function
async function translateWithGoogle(text) {
  try {
    const prompt = `請將以下文字翻譯成繁體中文: \n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("翻譯失敗:", error);
    return null;
  }
}

// 從 HackMD 取得文件內容
async function fetchHackMDDocument(docId) {
  console.log(`${HACKMD_API_URL}/${HackMDteamid}/notes/${docId}`);
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

  // 2. 翻譯整篇內容
  const translatedContent = await translateWithGoogle(content);

  // Update Hackmd
  try {
    const response = await axios.post(
      `${HackMDteam_API_URL}`,
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
