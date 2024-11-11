import axios from "axios";

export const httpClient = axios.create({
  baseURL: process.env.DB_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
