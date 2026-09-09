import axios from "axios";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";


const api = axios.create({

  baseURL:
    API_BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },

});

/*
|--------------------------------------------------------------------------
| Request interceptor
|--------------------------------------------------------------------------
|
| Every authenticated request automatically receives the current
| JWT access token.
|
*/

api.interceptors.request.use(

  (config) => {

    const accessToken =
      localStorage.getItem(
        "access"
      );


    if (accessToken) {

      config.headers.Authorization =
        `Bearer ${accessToken}`;

    }


    return config;

  },

  (error) => {

    return Promise.reject(
      error
    );

  }

);


/*
|--------------------------------------------------------------------------
| Refresh handling
|--------------------------------------------------------------------------
*/

let isRefreshing =
  false;


let failedRequests =
  [];


/*
|--------------------------------------------------------------------------
| Resolve queued requests
|--------------------------------------------------------------------------
*/

const processQueue =
  (
    error,
    accessToken = null,
  ) => {

    failedRequests.forEach(

      ({
        resolve,
        reject,
      }) => {

        if (error) {

          reject(
            error
          );

        } else {

          resolve(
            accessToken
          );

        }

      }

    );


    failedRequests =
      [];

  };


/*
|--------------------------------------------------------------------------
| Response interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

  (response) => {

    return response;

  },

  async (error) => {

    const originalRequest =
      error.config;


    const status =
      error.response?.status;


    /*
    |--------------------------------------------------------------------------
    | Only handle 401 errors
    |--------------------------------------------------------------------------
    */

    if (
      status !== 401 ||
      !originalRequest
    ) {

      return Promise.reject(
        error
      );

    }


    /*
    |--------------------------------------------------------------------------
    | Do not attempt to refresh the refresh endpoint itself
    |--------------------------------------------------------------------------
    */

    if (
      originalRequest.url?.includes(
        "/auth/token/refresh/"
      )
    ) {

      localStorage.removeItem(
        "access"
      );

      localStorage.removeItem(
        "refresh"
      );


      window.location.href =
        "/";


      return Promise.reject(
        error
      );

    }


    /*
    |--------------------------------------------------------------------------
    | Prevent infinite retry loops
    |--------------------------------------------------------------------------
    */

    if (
      originalRequest._retry
    ) {

      return Promise.reject(
        error
      );

    }


    /*
    |--------------------------------------------------------------------------
    | If refresh is already running, wait for it
    |--------------------------------------------------------------------------
    */

    if (
      isRefreshing
    ) {

      return new Promise(

        (
          resolve,
          reject,
        ) => {

          failedRequests.push({

            resolve,
            reject,

          });

        }

      )
        .then(

          (newAccessToken) => {

            originalRequest._retry =
              true;


            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;


            return api(
              originalRequest
            );

          }

        );

    }


    originalRequest._retry =
      true;


    isRefreshing =
      true;


    const refreshToken =
      localStorage.getItem(
        "refresh"
      );


    /*
    |--------------------------------------------------------------------------
    | No refresh token
    |--------------------------------------------------------------------------
    */

    if (!refreshToken) {

      isRefreshing =
        false;


      localStorage.removeItem(
        "access"
      );


      processQueue(
        error,
        null
      );


      window.location.href =
        "/";


      return Promise.reject(
        error
      );

    }


    try {

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | Use axios directly here.
      |
      | Do NOT use `api`.
      | Otherwise the interceptor can create a loop.
      |
      */

      const response =
        await axios.post(

  `${API_BASE_URL}/auth/token/refresh/`,

  {
    refresh:
      refreshToken,
  }

);

      const newAccessToken =
        response.data.access;


      if (!newAccessToken) {

        throw new Error(
          "Refresh endpoint did not return an access token."
        );

      }


      localStorage.setItem(

        "access",

        newAccessToken

      );


      api.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`;


      processQueue(

        null,

        newAccessToken

      );


      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest
      );

    } catch (refreshError) {

      processQueue(

        refreshError,

        null

      );


      localStorage.removeItem(
        "access"
      );


      localStorage.removeItem(
        "refresh"
      );


      localStorage.removeItem(
        "user"
      );


      window.location.href =
        "/";


      return Promise.reject(
        refreshError
      );

    } finally {

      isRefreshing =
        false;

    }

  }

);


export default api;