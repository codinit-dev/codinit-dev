import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WebTools');

export interface SearchWebArgs {
  query: string;
  isFirstParty?: boolean;
  taskNameActive: string;
  taskNameComplete: string;
}

export interface FetchFromWebArgs {
  urls: string[];
  taskNameActive: string;
  taskNameComplete: string;
}

export async function searchWeb(args: SearchWebArgs) {
  logger.info('Searching web for:', args.query);

  try {
    const searchUrl = args.isFirstParty
      ? `https://api.vercel.com/v1/search?q=${encodeURIComponent(args.query)}&firstParty=true`
      : `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}`;

    const apiKey = args.isFirstParty ? process.env.VERCEL_SEARCH_API_KEY : process.env.BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      logger.warn('No search API key configured, using fallback');
      return {
        query: args.query,
        results: [],
        message:
          'Search API not configured. Please set BRAVE_SEARCH_API_KEY or VERCEL_SEARCH_API_KEY environment variable.',
      };
    }

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const results = args.isFirstParty ? parseVercelSearchResults(data) : parseBraveSearchResults(data);

    return {
      query: args.query,
      isFirstParty: args.isFirstParty,
      results,
      totalResults: results.length,
    };
  } catch (error) {
    logger.error('Error searching web:', error);
    throw new Error(`Failed to search web: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseVercelSearchResults(data: any): Array<{
  title: string;
  url: string;
  snippet: string;
}> {
  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results.slice(0, 10).map((result: any) => ({
    title: result.title || '',
    url: result.url || '',
    snippet: result.description || result.snippet || '',
  }));
}

function parseBraveSearchResults(data: any): Array<{
  title: string;
  url: string;
  snippet: string;
}> {
  if (!data.web || !data.web.results || !Array.isArray(data.web.results)) {
    return [];
  }

  return data.web.results.slice(0, 10).map((result: any) => ({
    title: result.title || '',
    url: result.url || '',
    snippet: result.description || '',
  }));
}

export async function fetchFromWeb(args: FetchFromWebArgs) {
  logger.info('Fetching from URLs:', args.urls);

  try {
    const results = await Promise.all(
      args.urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'CodinIT-Bot/1.0',
            },
          });

          if (!response.ok) {
            return {
              url,
              success: false,
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          const html = await response.text();
          const text = extractTextFromHTML(html);

          return {
            url,
            success: true,
            content: text,
            contentLength: text.length,
          };
        } catch (error) {
          return {
            url,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );

    return {
      urls: args.urls,
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  } catch (error) {
    logger.error('Error fetching from web:', error);
    throw new Error(`Failed to fetch from web: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractTextFromHTML(html: string): string {
  let text = html;

  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  text = text.replace(/<[^>]+>/g, ' ');

  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  text = text.replace(/\s+/g, ' ');

  text = text.trim();

  if (text.length > 50000) {
    text = text.substring(0, 50000) + '\n\n[Content truncated at 50000 characters]';
  }

  return text;
}
