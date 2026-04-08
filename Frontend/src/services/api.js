/**
 * API Service layer for connecting React frontend to FastAPI backend.
 * Uses Fetch API with VITE_API_URL environment variable.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const request = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Backend is unreachable. Start the API server and retry.');
    }
    throw error;
  }
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
};

export const apiService = {
  // --- Victim Endpoints ---
  registerVictim: async (formData) => {
    // Expects FormData with: name, age, description, photo
    return request(`${API_BASE_URL}/victim/register`, {
      method: 'POST',
      body: formData,
    });
  },

  getVictimProfile: async () => {
    return request(`${API_BASE_URL}/victim/profile`);
  },

  // --- Sighting Endpoints ---
  reportSighting: async (formData) => {
    // Expects FormData with: location, timestamp, latitude, longitude, notes, image
    return request(`${API_BASE_URL}/sighting/report`, {
      method: 'POST',
      body: formData,
    });
  },

  getAllSightings: async () => {
    return request(`${API_BASE_URL}/sightings/all`);
  },

  getSightingLogs: async () => {
    return request(`${API_BASE_URL}/sightings/logs`);
  },

  getAlerts: async () => {
    return request(`${API_BASE_URL}/sightings/alerts`);
  },

  // --- Dashboard Stats ---
  getDashboardStats: async () => {
    return request(`${API_BASE_URL}/sightings/stats`);
  },

  // --- Health Check ---
  healthCheck: async () => {
    return request(`${API_BASE_URL}/`);
  }
};
