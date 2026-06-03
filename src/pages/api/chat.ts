export const prerender = false;

import type { APIRoute } from 'astro';

const API_URL   = import.meta.env.PUBLIC_AGENT_API_URL;
const API_KEY   = import.meta.env.PUBLIC_AGENT_API_KEY;
const API_MODEL = import.meta.env.PUBLIC_AGENT_MODEL;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();

		const res = await fetch(`${API_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: API_MODEL,
				messages: body.messages,
				temperature: 0.1,
				max_tokens: 1500,
				chat_template_kwargs: { enable_thinking: false },
				thinking: { type: 'disabled' },
			}),
		});

		if (!res.ok) {
			const err = await res.text();
			return new Response(JSON.stringify({ error: err }), { status: res.status });
		}

		const data = await res.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
};
