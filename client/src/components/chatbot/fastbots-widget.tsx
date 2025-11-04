import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Maximize2, Minimize2 } from "lucide-react";

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
  const [containerId] = useState(`fastbots-container-${Date.now()}`);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  
  const { data: config } = useQuery({
    queryKey: ['/api/settings/fastbots'],
  });

  useEffect(() => {
    if (!config?.enabled || !config?.botId || isClosed) {
      // Remove container if it exists
      const existing = document.getElementById(containerId);
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
      // Check if container already exists
      const existing = document.getElementById(containerId);
      if (existing) {
        return;
      }

      // Create container
      const container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;';
      
      // Create header with controls
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: linear-gradient(135deg, hsl(142 76% 36%), hsl(45 93% 52%));
        border-radius: 12px 12px 0 0;
        color: white;
        font-weight: 600;
        font-size: 14px;
      `;
      header.innerHTML = '<span>Study Assistant</span>';
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 8px;';
      
      // Minimize button
      const minimizeBtn = document.createElement('button');
      minimizeBtn.innerHTML = isMinimized ? 
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>' :
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      minimizeBtn.style.cssText = 'background: rgba(255,255,255,0.2); border: none; border-radius: 4px; padding: 4px; cursor: pointer; display: flex; align-items: center; color: white;';
      minimizeBtn.onclick = () => {
        setIsMinimized(!isMinimized);
        const iframe = document.getElementById(iframeId) as HTMLElement;
        if (iframe) {
          iframe.style.display = isMinimized ? 'block' : 'none';
        }
        minimizeBtn.innerHTML = !isMinimized ? 
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>' :
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      };
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      closeBtn.style.cssText = 'background: rgba(255,255,255,0.2); border: none; border-radius: 4px; padding: 4px; cursor: pointer; display: flex; align-items: center; color: white;';
      closeBtn.onclick = () => {
        setIsClosed(true);
        const containerEl = document.getElementById(containerId);
        if (containerEl) {
          containerEl.remove();
        }
      };
      
      buttonContainer.appendChild(minimizeBtn);
      buttonContainer.appendChild(closeBtn);
      header.appendChild(buttonContainer);
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = iframeSrc;
      iframe.style.cssText = 'width: 400px; height: 600px; border: none; border-radius: 0 0 12px 12px; display: block;';
      
      // Assemble
      container.appendChild(header);
      container.appendChild(iframe);
      document.body.appendChild(container);

      console.log('[FastBots] Chatbot loaded successfully');

      // Cleanup function
      return () => {
        const containerToRemove = document.getElementById(containerId);
        if (containerToRemove) {
          containerToRemove.remove();
        }
      };
    } catch (error) {
      console.error('[FastBots] Error loading chatbot:', error);
    }
  }, [config?.enabled, config?.botId, iframeId, containerId, isMinimized, isClosed]);

  // This component doesn't render anything visible
  // The iframe is injected directly into the body
  return null;
}
