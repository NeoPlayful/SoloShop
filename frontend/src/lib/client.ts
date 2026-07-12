import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // /auth/me 在游客状态下必然返回 401，这是正常行为，不跳转
      if (error.config?.url === "/auth/me") {
        return Promise.reject(error);
      }
      // 未登录或 token 过期，跳转到登录页
      const path = window.location.pathname;
      if (path.startsWith("/admin") && !path.includes("/login")) {
        window.location.href = "/admin/login";
      } else if (!path.includes("/login") && !path.includes("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export { apiClient };
