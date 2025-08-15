// Centralized API utility for all backend calls

const API_URL = 'http://192.168.1.2:3000';

export async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  try {
    const response = await fetch(url, options);
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, get text
      const text = await response.text();
      throw new Error(text || 'API error: Non-JSON response');
    }
    if (!response.ok) {
      throw new Error(data.error || 'API error');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// Example usage:
// const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
