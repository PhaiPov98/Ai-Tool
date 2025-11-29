import { GoogleGenAI } from "@google/genai";
import { VideoConfig } from "../types";

/**
 * Initializes the API client.
 * IMPORTANT: Always create a new instance before a call to ensure the latest API Key is used.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select an API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVideo = async (
  config: VideoConfig
): Promise<Blob> => {
  const ai = getAiClient();

  // 1. Initiate Generation
  // Note: config.negativePrompt is intentionally ignored as current Veo API 
  // doesn't explicitly support it in the config object structure provided in guidelines.
  
  let operation = await ai.models.generateVideos({
    model: config.model,
    prompt: config.prompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio,
    },
  });

  console.log("Video generation initiated, operation:", operation);

  // 2. Poll for Completion
  // Veo operations take time. We poll every 5-10 seconds.
  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 8000)); // 8 second delay
    operation = await ai.operations.getVideosOperation({ operation: operation });
    console.log("Polling video status...", operation.metadata);
  }

  // 3. Handle Errors in Operation
  if (operation.error) {
    throw new Error(`Generation failed: ${operation.error.message || 'Unknown error'}`);
  }

  // 4. Extract Video URI
  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Generation completed but no video URI was returned.");
  }

  // 5. Download the Video Blob
  // We must append the API key to the fetch URL for the download to work.
  const apiKey = process.env.API_KEY;
  const downloadUrl = `${videoUri}&key=${apiKey}`;
  
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video content: ${response.statusText}`);
  }

  return await response.blob();
};

export const checkApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptApiKeySelection = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  } else {
    console.warn("AI Studio key selection helper not available.");
  }
};