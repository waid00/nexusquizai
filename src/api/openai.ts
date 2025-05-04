// Define the shape of each message you send to OpenAI
export interface ChatCompletionRequestMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Check if API key is available
  if (!API_KEY) {
    console.error("OpenAI API key is missing. Please make sure VITE_OPENAI_API_KEY is set in your .env file.");
  }
  
  export async function chat(
    messages: ChatCompletionRequestMessage[]
  ): Promise<string> {
    if (!API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7, // Adding temperature for more consistent outputs
      }),
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "OpenAI API error");
    }
    const data = await res.json();
    return data.choices[0].message.content;
  }
