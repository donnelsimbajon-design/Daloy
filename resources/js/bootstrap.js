import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Send cookies (XSRF-TOKEN) with every request
window.axios.defaults.withXSRFToken = true;   // Automatically attach XSRF-TOKEN header

// Global interceptor for banned users
window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 403 && error.response?.data?.message === 'Your account has been banned.') {
            window.location.href = '/banned';
        }
        return Promise.reject(error);
    }
);
