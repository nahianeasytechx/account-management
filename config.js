const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
};

export default config;