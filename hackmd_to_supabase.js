// hackmd_to_supabase.js

import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import matter from "gray-matter";

// 讀取 .env 檔案以取得環境變數
import dotenv from "dotenv";
dotenv.config();

// Supabase 設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HACKMD_API_TOKEN = process.env.HACKMD_API_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadHackMDToSupabase(hackmdDocId) {
  try {
    // 從 HackMD API 讀取檔案內容
    // HackMD API 設定
    const HackMDteamid = "funblocks";
    const HACKMD_API_URL = "https://api.hackmd.io/v1";
    const response = await axios.get(
      `${HACKMD_API_URL}/teams/${HackMDteamid}/notes/${hackmdDocId}`,
      {
        headers: {
          Authorization: `Bearer ${HACKMD_API_TOKEN}`,
        },
      }
    );
    const fileContent = response.data.content;

    // 使用 gray-matter 解析 frontmatter 和內容
    const { data: frontmatter, content } = matter(fileContent);

    // 確保 frontmatter 和 content 都存在
    if (!frontmatter || !content) {
      console.error("Error: 無法解析 frontmatter 或內容。");
      return;
    }

    // 準備要插入 Supabase 的資料
    const postData = {
      metadata: {
        link: frontmatter.link,
        image: frontmatter.image,
        title: frontmatter.title,
        author: frontmatter.author,
        summary: frontmatter.summary,
        originalLink: frontmatter.OrginalLink,
        publishedAt: frontmatter.publishedAt,
        translatedBy: frontmatter.translateBy,
      },
      content: content,
    };

    // 插入資料到 Supabase 表格 (表格名稱為 'articles_draft')
    const { data, error } = await supabase
      .from("articles_draft")
      .insert([postData]);

    if (error) {
      console.error("Supabase 插入錯誤:", error);
    } else {
      console.log("成功插入資料到 Supabase:", data);
    }
  } catch (error) {
    console.error("檔案讀取或處理錯誤:", error);
  }
}

// 範例用法：請替換成你的 HackMD Document ID
// https://hackmd.io/@funblocks/H1KnnOXdkg
const hackmdDocId = "H1KnnOXdkg"; //  需要使用者提供 HackMD Document ID
uploadHackMDToSupabase(hackmdDocId);

console.log(
  "hackmd_to_supabase.js 檔案已更新，使用 HackMD API 讀取檔案內容。請修改 hackmdDocId 變數為你的 HackMD Document ID，並確保已正確設定 Supabase 環境變數。"
);
