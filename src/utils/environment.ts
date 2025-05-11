// src/utils/environment.ts
// Utility functions for handling environment-specific configurations

/**
 * Determines if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development' || true; // Forcing true for testing
};

/**
 * Gets the base URL for API calls, accounting for different environments
 */
export const getApiBaseUrl = (): string => {
  // Check if a base URL is specified in the environment
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }
  
  // For Vercel deployments, we might need to use the deployment URL
  const vercelUrl = import.meta.env.VITE_VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  
  // Default to empty string which will result in relative URLs
  return '';
};

/**
 * Builds an API endpoint URL considering the current environment
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with '/'
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${formattedPath}`;
};
