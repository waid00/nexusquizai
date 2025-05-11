// src/utils/environment.ts
// Utility functions for handling environment-specific configurations

/**
 * Determines if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  // Check if we have a specific development override from localStorage
  if (typeof window !== 'undefined') {
    const devMode = localStorage.getItem('dev_mode');
    if (devMode === 'true') {
      console.log('Development mode enabled via localStorage');
      return true;
    }
    
    // Check for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return true;
    }
  }
  
  // Check environment mode
  const isDevEnv = import.meta.env.MODE === 'development';
  console.log('Environment mode:', import.meta.env.MODE);
  
  return isDevEnv;
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
