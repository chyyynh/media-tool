import * as dotenv from "dotenv"; // 載入環境變數
import { createClient } from "@supabase/supabase-js";
dotenv.config(); // 載入環境變數

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseUpload() {
  const mockData = {
    id: 12,
    x_id: "1467886228397776899",
    profile_image_url:
      "https://pbs.twimg.com/profile_images/1717520022485041152/4W8oYQFQ_normal.png",
    profile_banner_url:
      "https://pbs.twimg.com/profile_banners/1467886228397776899/1699652187",
    username: "movingcastles_",
  };

  try {
    const { data, error } = await supabase
      .from("games_twitter_info")
      .insert([mockData])
      .select();

    if (error) {
      console.error("Error uploading mock data:", error);
    } else {
      console.log("Successfully uploaded mock data:", data);
    }
  } catch (error) {
    console.error("Error during upload process:", error.message);
  }
}

// Run the test function
testSupabaseUpload();
