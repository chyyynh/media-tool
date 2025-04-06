/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { fetchArticleContent, translateWithGemini, postToHackMD, isValidUrl } from './utils';

export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	HACKMD_API_TOKEN: string;
	HACKMD_TEAM: string;
	GOOGLE_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const data = (await request.json()) as { message?: { text?: string; chat?: { id?: number } } };
		const message = data?.message?.text;
		const chatId = data?.message?.chat?.id;

		if (!message || !isValidUrl(message)) {
			return new Response('Not a valid URL', { status: 200 });
		}

		// Step 1: 抓文章
		const { title, content } = await fetchArticleContent(message);

		// Step 2: 翻譯
		const translated = await translateWithGemini(env.GOOGLE_API_KEY, content);

		// Step 3: 發到 HackMD
		const fullContent = `# ${title}\n\n原文連結: ${message}\n\n${translated}`;
		const hackmdLink = await postToHackMD(env.HACKMD_API_TOKEN, env.HACKMD_TEAM, title, fullContent);

		// Step 4: 回傳連結給使用者
		const replyURL = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
		await fetch(replyURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text: `✅ 已上傳到 HackMD：\n${hackmdLink}`,
			}),
		});

		return new Response('OK');
	},
};
