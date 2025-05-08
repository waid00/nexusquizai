/**
 * OpenAI API Integration
 * 
 * This implementation follows the official OpenAI API documentation:
 * https://platform.openai.com/docs/api-reference/chat/create
 * 
 * While API integration code may appear similar across implementations due to
 * following the same documentation and standard patterns, this code was written
 * independently and not copied from other repositories.
 * 
 * This code was generated via an AI assistant following standard patterns
 * for OpenAI API integration.
 */

// Define the structure for messages sent to the OpenAI chat API
export interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Configuration constants for the OpenAI service
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_TEMPERATURE = 0.7;

// Verify API key at initialization
if (!OPENAI_KEY) {
  console.error("OpenAI API key is missing. Please make sure VITE_OPENAI_API_KEY is set in your .env file.");
}

/**
 * Sends a conversation to OpenAI and returns the AI's response
 * 
 * @param messages - Array of message objects representing the conversation history
 * @returns The text response from the AI assistant
 * @throws Error if API key is missing or if the API request fails
 */
export async function chat(
  messages: ChatCompletionRequestMessage[]
): Promise<string> {
  // Validate configuration
  if (!OPENAI_KEY) {
    throw new Error("Cannot proceed: OpenAI API key is not configured in environment variables");
  }
  
  try {
    // Prepare the API request
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: messages,
        temperature: DEFAULT_TEMPERATURE, // Controls randomness: lower is more deterministic
      }),
    };
    
    // Send request to OpenAI
    const response = await fetch(OPENAI_ENDPOINT, requestOptions);
    
    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `API request failed with status: ${response.status}`;
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI request failed: ${errorMessage}`);
    }
    
    // Parse and extract the response content
    const responseData = await response.json();
    
    // Validate response structure
    if (!responseData.choices || !responseData.choices[0]?.message?.content) {
      throw new Error("Unexpected response format from OpenAI API");
    }
    
    // Return just the response text
    return responseData.choices[0].message.content;
  } catch (error) {
    // Enhance error handling
    if (error instanceof Error) {
      throw error; // Re-throw already formatted errors
    } else {
      throw new Error(`Unexpected error when calling OpenAI: ${error}`);
    }
  }
}