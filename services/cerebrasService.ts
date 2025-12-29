import { Message, Settings } from '../types';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { SYSTEM_PROMPT } from '../constants/systemPrompt';

// --- DEVELOPER CONFIGURATION ---
// Truy cập biến môi trường thông qua import.meta.env
const DEVELOPER_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY; 
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';

// Kiểm tra nếu thiếu API Key để báo lỗi rõ ràng trong console
if (!DEVELOPER_API_KEY) {
  console.error("VITE_CEREBRAS_API_KEY is not defined in .env.local");
}

const cerebras = createOpenAI({
  apiKey: DEVELOPER_API_KEY || '', // Đảm bảo luôn là string
  baseURL: CEREBRAS_BASE_URL,
});

// --- TOOL DEFINITIONS (Separated for access) ---
export const toolsDef = {
  get_current_weather: tool({
    description: 'Get the current weather in a given location',
    parameters: z.object({
      location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    }),
    execute: async ({ location }: { location: string }) => {
      try {
        // Helper function to fetch from Geocoding API
        const fetchGeo = async (query: string) => {
             const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
             const res = await fetch(url);
             return await res.json();
        };

        // 1. Geocoding Attempt 1: Try exact string (e.g., "San Francisco, CA")
        let geoData = await fetchGeo(location);

        // 2. Geocoding Attempt 2: Fallback - If empty and contains comma, try just the city name (e.g., "San Francisco")
        if ((!geoData.results || geoData.results.length === 0) && location.includes(',')) {
            const cleanLocation = location.split(',')[0].trim();
            console.log(`Retrying geocoding for: ${cleanLocation}`);
            geoData = await fetchGeo(cleanLocation);
        }

        if (!geoData.results || geoData.results.length === 0) {
           return { error: `Location '${location}' not found. Please try entering just the city name.` };
        }

        const { latitude, longitude, name, country, admin1 } = geoData.results[0];
        const locationName = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

        // 3. Weather Fetch
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const units = weatherData.current_units;

        // Helper to interpret WMO codes
        const getWeatherCondition = (code: number) => {
            if (code === 0) return "Clear sky";
            if (code === 1 || code === 2 || code === 3) return "Mainly clear, partly cloudy, and overcast";
            if (code === 45 || code === 48) return "Fog";
            if (code >= 51 && code <= 55) return "Drizzle";
            if (code >= 61 && code <= 65) return "Rain";
            if (code >= 80 && code <= 82) return "Rain showers";
            if (code >= 95) return "Thunderstorm";
            return "Unknown/Mixed";
        };

        return {
          location: locationName,
          coordinates: { lat: latitude, lng: longitude },
          temperature: `${current.temperature_2m} ${units.temperature_2m}`,
          condition: getWeatherCondition(current.weather_code),
          humidity: `${current.relative_humidity_2m} ${units.relative_humidity_2m}`,
          wind_speed: `${current.wind_speed_10m} ${units.wind_speed_10m}`,
          source: "Open-Meteo API (Real-time)"
        };

      } catch (error) {
        console.error("Weather fetch failed", error);
        return { error: "Failed to fetch weather data due to network issue." };
      }
    },
  }),
  search_documentation: tool({
    description: 'Search the technical documentation for a given query',
    parameters: z.object({
      query: z.string().describe('The search query term'),
    }),
    execute: async ({ query }: { query: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        query: query,
        results: [
          "Cerebras Wafer-Scale Engine (WSE) is the largest chip ever built.",
          "CS-3 systems provide unprecedented AI compute performance.",
          "Linear scaling across millions of cores."
        ]
      };
    },
  }),
  create_document: tool({
    description: 'Create a new document, code snippet, or artifact. Use this when the user wants to generate and save a long text or code.',
    parameters: z.object({
      title: z.string().optional().describe('The title of the document. Defaults to "Untitled".'),
      type: z.string().optional().describe('The type of content (e.g., markdown, code). Defaults to "markdown".'),
      content: z.string().describe('The initial content of the document'),
    }),
    execute: async ({ title, type, content }: { title?: string; type?: string; content: string }) => {
      // Logic handled in App.tsx to update state
      return { message: `Document '${title || 'Untitled'}' created successfully.` };
    }
  }),
  update_document: tool({
    description: 'Update an existing document. Use this when the user wants to modify a saved artifact.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      content: z.string().describe('The new full content of the document'),
    }),
    execute: async ({ id, content }: { id: string; content: string }) => {
      // Logic handled in App.tsx to update state
      return { message: `Document ${id} updated successfully.` };
    }
  }),
};

// Helper to convert internal messages to SDK CoreMessage
const convertToCoreMessages = (messages: Message[]): any[] => {
  return messages.map(msg => {
    if (msg.role === 'user') {
        return { role: 'user', content: msg.content || "" };
    }
    
    if (msg.role === 'assistant') {
        // If message has tool calls, we need to structure it strictly
        if (msg.toolCalls && msg.toolCalls.length > 0) {
             const content: any[] = [];
             
             // Only add text block if there is actual content to avoid API validation errors
             if (msg.content && msg.content.trim().length > 0) {
                 content.push({ type: 'text', text: msg.content });
             }

             msg.toolCalls.forEach(tc => {
                 content.push({
                     type: 'tool-call',
                     toolCallId: tc.toolCallId,
                     toolName: tc.toolName,
                     args: tc.args
                 });
             });
             return { role: 'assistant', content: content as any };
        }
        // Normal text message
        return { role: 'assistant', content: msg.content || "" };
    }
    
    if (msg.role === 'tool') {
        // For SDK 'tool' role requires content array with tool-result
        let result;
        try {
            result = JSON.parse(msg.content);
        } catch (e) {
            // Fallback for non-JSON content
            result = { output: msg.content };
        }

        return { 
            role: 'tool', 
            content: [{
                type: 'tool-result',
                toolCallId: msg.id, // We use msg.id as toolCallId provided by App.tsx
                result: result
            }] 
        };
    }
    
    return { role: 'system', content: msg.content || "" };
  });
};

// --- RECOVERY PARSERS ---

// 1. Python-style function calls like: func(key='val', key2="val")
const parseBadToolCallRegex = (text: string) => {
   // Get function name
   const nameMatch = text.match(/^([a-zA-Z0-9_]+)\(/);
   if (!nameMatch) return null;
   const name = nameMatch[1];
   
   // Extract arguments string
   const argsStr = text.substring(name.length + 1, text.lastIndexOf(')'));
   if (!argsStr) return null;

   const args: Record<string, any> = {};
   
   // Regex matches: key \s* = \s* ( '...' | "..." )
   const paramRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)")/g;
   
   let match;
   let foundAny = false;

   while ((match = paramRegex.exec(argsStr)) !== null) {
       foundAny = true;
       const key = match[1];
       let val = match[2] || match[3];
       
       if (val !== undefined) {
            val = val
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
       }
       args[key] = val;
   }
   
   if (!foundAny) return null;
   return { name, args };
};

// 2. Main Recovery Function
const recoverToolCall = (text: string) => {
    // Strategy 1: Try Parsing as JSON Object directly (Handles { type: "function", ... } or { name: "...", parameters: ... })
    try {
        const obj = JSON.parse(text);
        
        // Structure A: { name: "tool", parameters: { ... } } or { name: "tool", arguments: { ... } }
        if (obj.name && (obj.parameters || obj.arguments)) {
            return { name: obj.name, args: obj.parameters || obj.arguments };
        }
        
        // Structure B: { type: "function", name: "tool", parameters: ... } (Seen in errors)
        if (obj.type === 'function' && obj.name && obj.parameters) {
             return { name: obj.name, args: obj.parameters };
        }

        // Structure C: { function: { name: "...", parameters: ... } } (Standard OpenAI Tool)
        if (obj.function && obj.function.name) {
             const args = obj.function.parameters || obj.function.arguments;
             // args might be string in some OpenAI-like formats
             if (typeof args === 'string') {
                 return { name: obj.function.name, args: JSON.parse(args) };
             }
             return { name: obj.function.name, args };
        }
    } catch (e) {
        // Not valid JSON, proceed to regex
    }

    // Strategy 2: Python-style func(arg="val")
    return parseBadToolCallRegex(text);
};

export interface ServiceResponse {
    content: string;
    toolCalls?: {
        id: string;
        name: string;
        args: any;
    }[];
}

const sendToGoogleGenAI = async (messages: Message[], settings: Settings): Promise<ServiceResponse> => {
    if (!settings.customApiKey) throw new Error("Google API Key is missing");
    
    const model = settings.customModelId || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.customApiKey}`;

    // Map messages to Google's format
    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content || "" }]
        }));

    const body: any = {
        contents: contents,
        generationConfig: {
            temperature: settings.temperature,
            topP: settings.topP,
            maxOutputTokens: settings.maxTokens,
        }
    };

    if (SYSTEM_PROMPT) {
        body.systemInstruction = {
            parts: [{ text: SYSTEM_PROMPT }]
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
        content: text,
        toolCalls: []
    };
};

export const sendMessageToAI = async (
  messages: Message[],
  settings: Settings
): Promise<ServiceResponse> => {
  try {
    // === CUSTOM PROVIDER ROUTING ===
    if (settings.model === 'custom') {
        if (settings.provider === 'google') {
            return await sendToGoogleGenAI(messages, settings);
        } else if (settings.provider === 'openai') {
            throw new Error("OpenAI provider coming soon.");
        } else {
            throw new Error("Invalid provider selected.");
        }
    }

    // === CEREBRAS / DEFAULT ROUTING ===
    let sdkMessages = convertToCoreMessages(messages);

    const result = await generateText({
      model: cerebras(settings.model),
      system: SYSTEM_PROMPT,
      messages: sdkMessages,
      tools: toolsDef,
      temperature: settings.temperature,
      topP: settings.topP,
    });

    return {
        content: result.text || "", // Ensure string return even if empty
        toolCalls: result.toolCalls?.map(tc => ({
            id: tc.toolCallId,
            name: tc.toolName,
            args: (tc as any).args
        }))
    };

  } catch (error: any) {
    console.error("AI Service Error:", JSON.stringify(error, null, 2));

    // --- ERROR RECOVERY FOR CEREBRAS MALFORMED TOOL CALLS ---
    if (error.responseBody) {
        try {
            const body = typeof error.responseBody === 'string' 
                ? JSON.parse(error.responseBody) 
                : error.responseBody;

            if (body.code === 'tool_use_failed' && body.failed_generation) {
                console.warn("Attempting to recover from malformed tool call...");
                const fixed = recoverToolCall(body.failed_generation);
                
                if (fixed) {
                    console.log("Recovery successful:", fixed);
                    return {
                        content: "System: Recovered tool command from raw stream.",
                        toolCalls: [{
                            id: 'rec-' + Math.random().toString(36).substr(2, 9),
                            name: fixed.name,
                            args: fixed.args
                        }]
                    };
                }
            }
        } catch (parseErr) {
            console.error("Recovery parsing failed:", parseErr);
        }
    }

    if (error.message?.includes('401')) {
        throw new Error("Authentication Failed. Please check API Key.");
    }
    
    throw new Error(error.message || "Failed to connect to AI Service.");
  }
};

export const executeTool = async (name: string, args: any) => {
    const tool = (toolsDef as any)[name];
    if (!tool) throw new Error(`Tool ${name} not found`);
    return await tool.execute(args, { toolCallId: 'manual-exec', messages: [] });
};