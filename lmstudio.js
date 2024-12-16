// 定義請求的 URL 和請求體
const url = "http://172.17.112.1:1234/v1/chat/completions";
const requestData = {
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: "Hello!",
    },
  ],
};

// 發送 POST 請求到 API
fetch(url, {
  method: "POST", // 使用 POST 方法
  headers: {
    "Content-Type": "application/json", // 指定傳送資料的格式
  },
  body: JSON.stringify(requestData), // 將資料轉為 JSON 字串
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log("模型回應:", data); // 處理並顯示模型回應
  })
  .catch((error) => {
    console.error("發生錯誤:", error); // 處理錯誤
  });
