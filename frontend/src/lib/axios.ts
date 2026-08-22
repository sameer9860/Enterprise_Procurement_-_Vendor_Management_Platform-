import axios from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Main axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for Render cold start
})

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 + refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = Cookies.get('refresh_token')

      if (!refreshToken) {
        // No refresh token — clear cookies and redirect to login
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/login/refresh/`, {
          refresh: refreshToken,
        })

        const newAccessToken = response.data.access
        Cookies.set('access_token', newAccessToken, { expires: 1 / 24 }) // 1 hour

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed — clear everything and redirect
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
