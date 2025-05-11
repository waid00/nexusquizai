// src/utils/environment.ts
// Utility functions for handling environment-specific configurations

/**
 * Determines if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  // For testing, return true to bypass API calls
  return true;
  // Uncomment the line below when ready for production
  // return import.meta.env.MODE === 'development';
};

/**
 * Gets the base URL for API calls, accounting for different environments
 */
export const getApiBaseUrl = (): string => {
  console.log('Getting API base URL...');
  
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Use the current window location as base for API calls
    console.log('Window location:', window.location.origin);
    return window.location.origin;
  }
  
  // Default to empty string which will result in relative URLs (current domain)
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
