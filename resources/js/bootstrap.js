import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Send cookies (XSRF-TOKEN) with every request
window.axios.defaults.withXSRFToken = true;   // Automatically attach XSRF-TOKEN header
