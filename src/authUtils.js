// src/authUtils.js
import { fetchAuthSession } from 'aws-amplify/auth';

export const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) throw new Error("No ID token found");

    return {
      Authorization: `Bearer ${idToken}`,
    };
  } catch (error) {
    console.error("Error fetching auth headers:", error);
    throw error;
  }
};
