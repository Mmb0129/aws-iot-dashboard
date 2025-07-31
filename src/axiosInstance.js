// src/axiosInstance.js
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

const axiosInstance = axios.create();

// Add interceptor to inject the Cognito ID token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.warn("⚠️ Unable to attach auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
