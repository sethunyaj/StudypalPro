import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Helper function to extract iframe src from embed code
function extractIframeSrc(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // If user pasted entire iframe tag, extract the src
  const iframeMatch = input.match(/src=["']([^"']+)["']/);
  if (iframeMatch) {
    return iframeMatch[1];
  }

  // If it's already a URL, validate it
  const cleaned = input.trim();
  if (cleaned.startsWith('http')) {
    return cleaned;
  }

  // If it's just a bot ID, construct the URL
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return `https://app.fastbots.ai/embed/${cleaned}`;
  }

  return null;
}

export default function FastBotsWidget() {
  const [iframeId] = useState(`fastbots-iframe-${Date.now()}`);
  
  const { data: config } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  useEffect(() => {
    if (!config?.enabled || !config?.botId) {
      // Remove iframe if it exists
      const existing = document.getElementById(iframeId);
      if (existing) {
        existing.remove();
      }
      return;
    }

    // Extract iframe src URL
    const iframeSrc = extractIframeSrc(config.botId);
    if (!iframeSrc) {
      console.warn('[FastBots] Invalid embed code format:', config.botId);
      return;
    }

    try {
      // Check if iframe already exists
      const existing = document.getElementById(iframeId);
      if (existing) {
        return;
      }

      // Create and append the FastBots iframe
      const iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = iframeSrc;
      iframe.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); z-index: 9999;';
      
      document.body.appendChild(iframe);

      console.log('[FastBots] Chatbot loaded successfully');

      // Cleanup function
      return () => {
        const iframeToRemove = document.getElementById(iframeId);
        if (iframeToRemove) {
          iframeToRemove.remove();
        }
      };
    } catch (error) {
      console.error('[FastBots] Error loading chatbot:', error);
    }
  }, [config?.enabled, config?.botId, iframeId]);

  // This component doesn't render anything visible
  // The iframe is injected directly into the body
  return null;
}
