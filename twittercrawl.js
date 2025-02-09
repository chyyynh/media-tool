import * as dotenv from "dotenv"; // 載入環境變數
dotenv.config(); // 載入環境變數

// Twitter API configuration
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

async function getUserProfileUrls(username) {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
    },
  };

  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by?usernames=${username}&user.fields=id,profile_image_url,profile_banner_url`,
      options
    );

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("User not found");
    }

    const user = data.data[0];

    // Get original size profile image by removing '_normal' from the URL
    const originalProfileImageUrl = user.profile_image_url.replace(
      "_normal",
      ""
    );

    return {
      id: user.id,
      username: username,
      profileImageUrl: originalProfileImageUrl,
      profileBannerUrl: user.profile_banner_url,
    };
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const username = "PirateNation";
    const userData = await getUserProfileUrls(username);

    console.log("User data retrieved successfully:");
    console.log(userData);
  } catch (error) {
    console.error("Main process failed:", error.message);
  }
}

main();
