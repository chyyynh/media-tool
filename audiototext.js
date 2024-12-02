const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const { Telegraf } = require("telegraf"); // Telegram Bot API
const sdk = require("microsoft-cognitiveservices-speech-sdk");
require("dotenv").config(); // 載入環境變數

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const AZURE_SPEECH_API_URL = "https://eastasia.api.cognitive.microsoft.com/";
const AZURE_API_KEY = process.env.AZURE_SPEECH_API_KEY; // 在此填入你的 API key

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_API_KEY,
  process.env.SPEECH_REGION
);
speechConfig.speechRecognitionLanguage = "en-US";

// 1. 提取 YouTube 音訊
async function downloadAudio(youtubeURL) {
  const outputPath = "./audio.wav";

  await youtubedl(youtubeURL, {
    extractAudio: true,
    audioFormat: "wav",
    ffmpegLocation: "/opt/homebrew/bin/ffmpeg", // 確保有正確安裝 ffmpeg
    output: outputPath,
  });

  console.log("Audio downloaded:", outputPath);
  return outputPath;
}

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"

function audiotoText() {
  return new Promise((resolve, reject) => {
    let sentences = [];
    let audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync("audio.wav")
    );
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // 開始語音辨識
    speechRecognizer.startContinuousRecognitionAsync(
      () => {
        console.log("Recognition started.");
      },
      (err) => {
        console.log("Error starting recognition:", err);
        reject(err); // 若啟動識別過程出錯，拒絕 Promise
      }
    );

    // 當語音辨識到文字時
    speechRecognizer.recognized = (s, e) => {
      console.log("Recognition event triggered");
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        sentences.push(e.result.text); // 把每次辨識的文字推進陣列
        console.log(`RECOGNIZED: Text=${e.result.text}`);
        console.log("Sentences array:", sentences); // 顯示目前的 sentences 陣列
      }
    };

    // 處理識別過程中可能出現的錯誤
    speechRecognizer.canceled = (s, e) => {
      const cancellation = sdk.CancellationDetails.fromResult(e.result);
      console.log(`CANCELED: Reason=${cancellation.reason}`);

      if (cancellation.reason === sdk.CancellationReason.Error) {
        console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
        console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
        reject(new Error(cancellation.errorDetails)); // 如果發生錯誤，拒絕 Promise
      }
    };

    // 監聽語音識別結束事件
    speechRecognizer.sessionStopped = (s, e) => {
      console.log("Recognition session stopped.");
      resolve(sentences); // 當識別結束時返回 sentences
    };
  });
}

async function processAudio() {
  const recognizedText = await audiotoText();
  console.log(`Recognized Text`, recognizedText);

  let markdownContent = `# Recognized Speech Text\n\n`;

  recognizedText.forEach((sentence, index) => {
    markdownContent += `${sentence}`;
  });

  fs.writeFileSync("recognized_text.md", markdownContent, "utf8");
  console.log("Markdown file generated with multiple sentences!");
}

// audio to text
// https://learn.microsoft.com/zh-tw/azure/ai-services/speech-service/fast-transcription-create?tabs=locale-specified
// https://learn.microsoft.com/zh-tw/azure/ai-services/openai/whisper-quickstart?wt.mc_id=searchAPI_azureportal_inproduct_rmskilling&sessionId=8d29906dfebe426c9a3567df716f9d81&tabs=command-line%2Cpython-new%2Ctypescript-key%2Ctypescript-keyless&pivots=programming-language-javascript

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  const youtubeUrl = url;

  ctx.reply("正在處理您的請求，請稍等...");

  const outputFilePath = `./downloads/${Date.now()}.mp3`;

  try {
    // 步驟 1: 下載 YouTube 音訊
    await downloadAudio(youtubeUrl);
    ctx.reply("音訊下載完成！開始進行語音轉文字處理。");

    // 步驟 2: 語音轉文字
    processAudio();
    // const transcription = await transcribeAudioGoogle(outputFilePath); // 或 transcribeAudioWhisper(outputFilePath)
    // bot.sendMessage(chatId, `轉文字結果：\n\n${transcription}`);
  } catch (error) {
    console.error("Error processing request:", error);
    ctx.reply("抱歉，處理過程中發生錯誤。");
  } finally {
    // 清理下載的檔案
    /*
      if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath);
      }
        */
  }
});

bot.launch();
