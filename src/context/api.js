// src/context/api.js
const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = localStorage.getItem('token');
  
  console.log('Token from localStorage:', token);
  console.log('Making request to:', `${API_URL}/${endpoint}`);
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Authorization header set:', headers['Authorization']);
  }

  const options = { method, headers };
  if (data) {
    options.body = JSON.stringify(data);
    console.log('Request data:', data);
  }

  try {
    const res = await fetch(`${API_URL}/${endpoint}`, options);
    console.log('Response status:', res.status);
    
    // Get the raw text first to see what PHP is returning
    const text = await res.text();
    console.log('Raw response:', text);
    
    if (!res.ok) {
      if (res.status === 401) {
        console.error('401 Unauthorized - clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        throw new Error('Unauthorized. Please login again.');
      }
      
      // Try to parse as JSON, if it fails we'll see the HTML error
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        console.error('Response is not JSON, raw text:', text);
        throw new Error('Server returned an error (see console for details)');
      }
      
      console.error('API Error:', errorData);
      throw new Error(errorData.message || 'API request failed');
    }
    
    // Parse the successful response
    const result = JSON.parse(text);
    console.log('API Response:', result);
    return result;
  } catch (err) {
    console.error('Request failed:', err.message);
    throw err; // Re-throw instead of returning
  }
};