/**
 * axios setup to use mock service
 */

import axios from 'axios';
import config from '../config';

// const SERVER_URL = 'http://localhost:8000/api';
const SERVER_BASE_URL = config.serverName;
const SERVER_URL = `${config.serverName}/api`;
const axiosServices = axios.create({baseURL: SERVER_URL});

// interceptor for http
axiosServices.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle session expiration here
            // For example, log the user out or attempt to refresh the token
            // You can also redirect the user to a login page
            window.location = '/login';
            console.log('Session expired. Logging out...');
          }

          if (error.response.status === 403 && error.response.data && error.response.data.redirect) {
            // Trial ended redirect
            window.location.href = error.response.data.redirect;
          }
        //   return Promise.reject(error);
        console.log(error.response);
        return Promise.reject((error.response && error.response.data) || 'Wrong Services');
    }
);

export { SERVER_URL, SERVER_BASE_URL };
export default axiosServices;
