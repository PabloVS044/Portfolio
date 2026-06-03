const prerender = false;
const API_URL = "https://model.clawstitch.com/v1";
const API_KEY = "sk-6c754f253b69eb050c05d872e6644116e298e2cadda618d289cd2c6673e2575d";
const API_MODEL = "Qwen/Qwen3.6-27B-FP8";
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: body.messages,
        temperature: 0.1,
        max_tokens: 1500,
        chat_template_kwargs: { enable_thinking: false },
        thinking: { type: "disabled" }
      })
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: res.status });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
