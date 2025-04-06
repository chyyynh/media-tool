import { GoogleGenerativeAI } from '@google/generative-ai';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';

export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch {
		return false;
	}
}

export async function fetchArticleContent(url: string): Promise<{ title: string; content: string }> {
	const res = await fetch(url);
	const html = await res.text();
	const $ = cheerio.load(html);

	const title = $('title').text().trim();
	let content = '';

	$('p, h1, img').each((_, el) => {
		if ($(el).is('h1')) {
			content += `## ${$(el).text().trim()}\n\n`;
		} else if ($(el).is('p')) {
			content += $(el).text().trim() + '\n\n';
		} else if ($(el).is('img')) {
			const src = $(el).attr('src');
			if (src && !src.includes('logo')) {
				const fullSrc = src.startsWith('http') ? src : new URL(src, url).href;
				content += `![image](${fullSrc})\n\n`;
			}
		}
	});

	return { title, content };
}

export async function translateWithGemini(apiKey: string, text: string): Promise<string> {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	const prompt = `請將以下內容翻譯成繁體中文：\n\n${text}`;
	const result = await model.generateContent(prompt);
	return result.response.text();
}

export async function postToHackMD(apiToken: string, team: string, title: string, content: string): Promise<string> {
	const response = await fetch(`https://api.hackmd.io/v1/teams/${team}/notes`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			title,
			content,
			readPermission: 'owner',
			writePermission: 'owner',
			commentPermission: 'everyone',
		}),
	});

	const data = (await response.json()) as { publishLink?: string };
	return data.publishLink || '';
}
