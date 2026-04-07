/**
 * API Service layer for connecting React frontend to FastAPI backend.
 * Uses Fetch API with VITE_API_URL environment variable.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    const response = await fetch(`${API_BASE_URL}/victim/register`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  getVictimProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/victim/profile`);
    return handleResponse(response);
  },

  // --- Sighting Endpoints ---
  reportSighting: async (formData) => {
    // Expects FormData with: location, timestamp, latitude, longitude, notes, image
    const response = await fetch(`${API_BASE_URL}/sighting/report`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  getAllSightings: async () => {
    const response = await fetch(`${API_BASE_URL}/sightings/all`);
    return handleResponse(response);
  },

  getAlerts: async () => {
    const response = await fetch(`${API_BASE_URL}/sightings/alerts`);
    return handleResponse(response);
  },

  // --- Dashboard Stats ---
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/sightings/stats`);
    return handleResponse(response);
  },

  // --- Health Check ---
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    return handleResponse(response);
  }
};
