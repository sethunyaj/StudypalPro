import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function FastBotsWidget() {
  const { data: config } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  useEffect(() => {
    if (!config?.enabled || !config?.botId) {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[data-bot-id="${config.botId}"]`);
    if (existingScript) {
      return;
    }

    // Create and append the FastBots embed script
    const script = document.createElement('script');
    script.src = 'https://fastbots.ai/embed.js';
    script.setAttribute('data-bot-id', config.botId);
    script.async = true;

    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts or config changes
    return () => {
      const scriptToRemove = document.querySelector(`script[data-bot-id="${config.botId}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      // Also remove any FastBots widget elements
      const widget = document.querySelector('#fastbots-widget, [class*="fastbots"]');
      if (widget) {
        widget.remove();
      }
    };
  }, [config?.enabled, config?.botId]);

  // This component doesn't render anything visible
  // The FastBots script creates its own floating widget
  return null;
}
