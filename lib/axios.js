import axios from "axios";

const api = axios.create({
  withCredentials: true, // 🔥 REQUIRED
});

export default api;