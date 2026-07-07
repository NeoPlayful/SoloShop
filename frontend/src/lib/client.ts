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
      // 未登录或 token 过期，跳转到登录页
      const isAdminPage = window.location.pathname.startsWith("/admin");
      if (isAdminPage && !window.location.pathname.includes("/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

export { apiClient };
