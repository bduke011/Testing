import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67b0b2635f8cdee30693faa8", 
  requiresAuth: true // Ensure authentication is required for all operations
});
