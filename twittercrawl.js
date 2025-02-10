import * as dotenv from "dotenv"; // 載入環境變數
import { createClient } from "@supabase/supabase-js";
dotenv.config(); // 載入環境變數

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Twitter API configuration
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Extract username from Twitter URL
function extractTwitterUsername(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    return path.split("/")[1];
  } catch (error) {
    console.error("Invalid Twitter URL:", url);
    return null;
  }
}

async function getUserProfileUrls(username) {
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
    },
  };

  try {
    // Construct URL with multiple usernames
    const response = await fetch(
      `https://api.x.com/2/users/by/username/${username}?user.fields=id,profile_image_url,profile_banner_url`,
      options
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Twitter API response:", data); // Debug log

    return {
      twitter_id: data.data.id,
      username: username,
      profile_image_url: data.data.profile_image_url || null,
      profile_banner_url: data.data.profile_banner_url || null,
    };
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    throw error;
  }
}

// Uncomment the following line to run the test function
// testGetUsersProfileUrls();

async function processGames() {
  try {
    // Fetch games with Twitter links
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, link");

    if (gamesError) throw gamesError;

    // Log the first few games to debug the structure
    console.log("First few games structure:", games.slice(0, 3));

    // Filter games with valid Twitter links
    const gamesWithTwitter = games.filter((game) => {
      if (!game.link) {
        console.log(`Game ${game.id} has no link field`);
        return false;
      }
      if (typeof game.link !== "object") {
        console.log(`Game ${game.id} link is not an object:`, game.link);
        return false;
      }
      if (!game.link.twitter) {
        console.log(`Game ${game.id} has no Twitter link`);
        return false;
      }
      return true;
    });

    console.log(`Found ${gamesWithTwitter.length} games with Twitter links`);

    // Process each game one at a time
    for (const game of gamesWithTwitter) {
      const username = extractTwitterUsername(game.link.twitter);

      if (!username) {
        console.log(
          `Could not extract username from Twitter URL for game ${game.id}:`,
          game.link.twitter
        );
        continue;
      }

      console.log(
        `Processing game ${game.id} with Twitter username: ${username}`
      );

      const twitterData = await getUserProfileUrls(username);

      if (!twitterData) {
        console.log(`No Twitter data found for username: ${username}`);
        continue;
      }

      try {
        const { data, error } = await supabase
          .from("games_twitter_info")
          .insert([
            {
              id: game.id,
              x_id: twitterData.twitter_id,
              username: twitterData.username,
              profile_image_url: twitterData.profile_image_url,
              profile_banner_url: twitterData.profile_banner_url,
            },
          ])
          .select();

        if (error) {
          console.error(`Error upserting data for game ${game.id}:`, error);
          continue;
        }

        console.log(
          `Successfully processed game ${game.id} - Twitter user ${username}`
        );
      } catch (error) {
        console.error(`Error processing game ${game.id}:`, error.message);
      }

      // Add delay between requests to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("Processing completed");
  } catch (error) {
    console.error("Main process failed:", error);
    console.error("Error stack:", error.stack);
  }
}

// Run the processor
processGames();
