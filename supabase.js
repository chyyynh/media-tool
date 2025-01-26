const { createClient } = require("@supabase/supabase-js");
require("dotenv").config(); // 載入環境變數

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: articles } = await supabase.from("tutorails").select("*");
  // console.log(articles);
  const allBlogs = articles.sort((a, b) => {
    if (new Date(a.created_at) > new Date(b.created_at)) {
      return -1;
    }
    return 1;
  });
  console.log(articles);
})();
