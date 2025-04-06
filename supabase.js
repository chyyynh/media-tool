import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config(); // 載入環境變數

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key");
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data: link } = await supabase
    .from("articles")
    .select("metadata->link");

  const allslug = link ? link.map((item) => ({ slug: item.link })) : [];
  console.log(`allslug-link: ${allslug}`);

  const { data: slugs, error } = await supabase.from("games").select("slug");

  if (error) {
    console.log(error);
    return [];
  }

  // 直接回傳 slug 資料
  const allSlugs = slugs
    ? slugs.map((item) => ({ slug: item.slug })) // 直接取出 slug
    : [];

  console.log(`allslug-gameslug: ${allSlugs}`);
})();
