/**
 * Live Website Probe Service
 * Performs real server-side HTTP/HTTPS probing of business websites:
 * - Real response latency (ms)
 * - True SSL/HTTPS status
 * - HTTP status code
 * - Mobile viewport tag presence (real mobile compatibility test)
 * - CMS / framework fingerprinting (WordPress, Wix, Shopify, etc.)
 */

export interface WebProbeResult {
  url: string;
  isReachable: boolean;
  httpStatus: number | null;
  latencyMs: number;
  hasHttps: boolean;
  hasMobileViewport: boolean;
  pageTitle?: string;
  detectedPlatform?: string;
  errorMessage?: string;
  measuredAt: string;
}

export async function probeWebsiteLive(rawUrl: string, timeoutMs = 6000): Promise<WebProbeResult> {
  const measuredAt = new Date().toISOString();
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      url: rawUrl || '',
      isReachable: false,
      httpStatus: null,
      latencyMs: 0,
      hasHttps: false,
      hasMobileViewport: false,
      errorMessage: 'No URL provided',
      measuredAt,
    };
  }

  let formattedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  const hasHttps = formattedUrl.toLowerCase().startsWith('https://');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  try {
    const res = await fetch(formattedUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WebLeadAI-Probe/2.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    // Read partial body (max 80kb) to inspect meta tags
    const reader = res.body?.getReader();
    let htmlSnippet = '';
    if (reader) {
      const decoder = new TextDecoder('utf-8');
      let bytesRead = 0;
      while (bytesRead < 80000) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        bytesRead += value.length;
        htmlSnippet += decoder.decode(value, { stream: true });
      }
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
    } else {
      htmlSnippet = await res.text().catch(() => '');
    }

    // Inspect meta viewport
    const hasMobileViewport = /<meta[^>]+name=["']viewport["']/i.test(htmlSnippet);

    // Extract title
    const titleMatch = htmlSnippet.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : undefined;

    // Fingerprint CMS / framework
    let detectedPlatform = 'Custom / Legacy';
    const lowerHtml = htmlSnippet.toLowerCase();
    if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) {
      detectedPlatform = 'WordPress';
    } else if (lowerHtml.includes('cdn.shopify.com') || lowerHtml.includes('shopify.')) {
      detectedPlatform = 'Shopify';
    } else if (lowerHtml.includes('wix.com') || lowerHtml.includes('wixstatic.com')) {
      detectedPlatform = 'Wix';
    } else if (lowerHtml.includes('squarespace.com')) {
      detectedPlatform = 'Squarespace';
    } else if (lowerHtml.includes('webflow.com') || lowerHtml.includes('data-wf-site')) {
      detectedPlatform = 'Webflow';
    } else if (lowerHtml.includes('_next/') || lowerHtml.includes('__next')) {
      detectedPlatform = 'Next.js';
    }

    return {
      url: formattedUrl,
      isReachable: res.ok || res.status < 500,
      httpStatus: res.status,
      latencyMs,
      hasHttps: res.url.toLowerCase().startsWith('https://'),
      hasMobileViewport,
      pageTitle,
      detectedPlatform,
      measuredAt,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const isTimeout = err.name === 'AbortError';

    // If HTTPS failed, try plain HTTP fallback once
    if (hasHttps && !isTimeout) {
      try {
        const httpFallbackUrl = formattedUrl.replace(/^https:\/\//i, 'http://');
        const fbRes = await fetch(httpFallbackUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
        });
        return {
          url: formattedUrl,
          isReachable: true,
          httpStatus: fbRes.status,
          latencyMs,
          hasHttps: false, // SSL is missing or broken!
          hasMobileViewport: false,
          errorMessage: 'SSL handshake failed. Website only operates on insecure HTTP.',
          measuredAt,
        };
      } catch {
        // Fallback failed
      }
    }

    return {
      url: formattedUrl,
      isReachable: false,
      httpStatus: null,
      latencyMs,
      hasHttps: false,
      hasMobileViewport: false,
      errorMessage: isTimeout ? 'Website connection timed out (>6s)' : err.message || 'Unreachable',
      measuredAt,
    };
  }
}
