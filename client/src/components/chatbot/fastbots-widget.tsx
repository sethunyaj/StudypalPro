import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Helper function to extract bot ID from various formats
function extractBotId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // If user pasted entire script tag, extract the bot ID
  const scriptMatch = input.match(/data-bot-id=["']([^"']+)["']/);
  if (scriptMatch) {
    return scriptMatch[1];
  }

  // Otherwise, clean and validate the input
  const cleaned = input.trim();
  
  // Bot ID should be alphanumeric with hyphens/underscores, no special chars
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

export default function FastBotsWidget() {
  const { data: config } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  useEffect(() => {
    if (!config?.enabled || !config?.botId) {
      return;
    }

    // Extract and validate bot ID
    const botId = extractBotId(config.botId);
    if (!botId) {
      console.warn('[FastBots] Invalid bot ID format:', config.botId);
      return;
    }

    try {
      // Check if script already exists
      const existingScript = document.querySelector(`script[data-bot-id="${botId}"]`);
      if (existingScript) {
        return;
      }

      // Create and append the FastBots embed script
      const script = document.createElement('script');
      script.src = 'https://app.fastbots.ai/embed.js';
      script.setAttribute('data-bot-id', botId);
      script.async = true;

      document.body.appendChild(script);

      // Cleanup function to remove script when component unmounts or config changes
      return () => {
        try {
          const scriptToRemove = document.querySelector(`script[data-bot-id="${botId}"]`);
          if (scriptToRemove) {
            scriptToRemove.remove();
          }
          // Also remove any FastBots widget elements
          const widget = document.querySelector('#fastbots-widget, [class*="fastbots"]');
          if (widget) {
            widget.remove();
          }
        } catch (error) {
          console.error('[FastBots] Error during cleanup:', error);
        }
      };
    } catch (error) {
      console.error('[FastBots] Error loading chatbot:', error);
    }
  }, [config?.enabled, config?.botId]);

  // This component doesn't render anything visible
  // The FastBots script creates its own floating widget
  return null;
}
