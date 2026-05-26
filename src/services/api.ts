// src/lib/api.ts

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '../store/useAuthStore';


// ==============================
// AXIOS INSTANCE
// ==============================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// ==============================
// TOKEN REFRESH STATE
// ==============================

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];


// ==============================
// PROCESS FAILED QUEUE
// ==============================

const processQueue = (
  error: any,
  token: string | null = null
) => {

  failedQueue.forEach((promise) => {

    if (error) {

      promise.reject(error);

    } else {

      promise.resolve(token!);
    }
  });

  failedQueue = [];
};


// ==============================
// REQUEST INTERCEPTOR
// ==============================

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {

    const token =
      useAuthStore
        .getState()
        .accessToken;

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ==============================
// RESPONSE INTERCEPTOR
// ==============================

api.interceptors.response.use(

  (response) => response,

  async (error: AxiosError | any) => {

    const originalRequest =
      error.config as any;


    // ==========================
    // HANDLE 401
    // ==========================

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {

      // Prevent infinite refresh loop
      if (
        originalRequest.url?.includes(
          '/auth/refresh'
        )
      ) {

        useAuthStore
          .getState()
          .logout();

        return Promise.reject(error);
      }

      originalRequest._retry = true;


      // ==========================
      // IF REFRESH IN PROGRESS
      // ==========================

      if (isRefreshing) {

        return new Promise(
          (resolve, reject) => {

            failedQueue.push({

              resolve: (
                token: string
              ) => {

                originalRequest.headers =
                  originalRequest.headers || {};

                originalRequest.headers.Authorization =
                  `Bearer ${token}`;

                resolve(
                  api(originalRequest)
                );
              },

              reject: (err: any) => {
                reject(err);
              },
            });
          }
        );
      }


      // ==========================
      // START REFRESH
      // ==========================

      isRefreshing = true;

      try {

        const response =
          await axios.post(

            `${api.defaults.baseURL}/api/auth/refresh`,

            {},

            {
              withCredentials: true,
            }
          );


        // ==========================
        // EXTRACT TOKEN
        // ==========================

        const newAccessToken =
          response.data?.token ||
          response.data?.accessToken ||
          response.data?.data?.token ||
          response.data?.data?.accessToken ||
          response.data?.data?.user?.token ||
          response.data?.data?.user?.accessToken;

        if (!newAccessToken) {

          throw new Error(
            'No access token returned'
          );
        }


        // ==========================
        // SAVE TOKEN
        // ==========================

        useAuthStore
          .getState()
          .setAccessToken(
            newAccessToken
          );


        // ==========================
        // OPTIONAL USER UPDATE
        // ==========================

        if (response.data?.user) {

          useAuthStore.setState({
            user: response.data.user,
          });
        }


        // ==========================
        // PROCESS QUEUE
        // ==========================

        processQueue(
          null,
          newAccessToken
        );


        // ==========================
        // RETRY ORIGINAL REQUEST
        // ==========================

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (refreshError) {


        // ==========================
        // REFRESH FAILED
        // ==========================

        processQueue(
          refreshError,
          null
        );

        useAuthStore
          .getState()
          .logout();

        return Promise.reject(
          refreshError
        );

      } finally {

        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;