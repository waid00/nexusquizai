// Define the shape of each message you send to OpenAI
export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
  
  export async function chat(
    messages: ChatCompletionRequestMessage[]
  ): Promise<string> {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
      }),
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    return data.choices[0].message.content;
  }
  