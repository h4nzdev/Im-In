import axios from "axios";

const GAS_URL =
  import.meta.env.VITE_GAS_API_URL ||
  "https://script.google.com/macros/d/YOUR_GAS_ID/userweb/exec";

const client = axios.create({
  baseURL: GAS_URL,
  timeout: 10000,
});

export const api = {
  post: async (action, data = {}) => {
    const payload = JSON.stringify({ action, ...data });
    const { data: response } = await client.post("", payload, {
      headers: { "Content-Type": "text/plain" },
    });
    if (!response.success) throw new Error(response.message);
    return response;
  },

  get: async (action, params = {}) => {
    const { data: response } = await client.get("", {
      params: { action, ...params },
    });
    if (!response.success) throw new Error(response.message);
    return response;
  },
};
