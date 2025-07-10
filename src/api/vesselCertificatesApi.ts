import { VesselCertificate } from '../types';
import API_BASE_URL from './config';

const API_URL = `${API_BASE_URL}/vesselCertificates`;

export const vesselCertificatesApi = {
  // Get all certificates
  getAll: async (): Promise<VesselCertificate[]> => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  // Get certificate by ID
  getById: async (id: string): Promise<VesselCertificate> => {
    try {
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  },

  // Create new certificate
  create: async (certificateData: Omit<VesselCertificate, 'id'>): Promise<VesselCertificate> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  },

  // Update certificate
  update: async (id: string, certificateData: Partial<VesselCertificate>): Promise<VesselCertificate> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  },

  // Delete certificate
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  },

  // Get expiring certificates (within 30 days)
  getExpiring: async (): Promise<VesselCertificate[]> => {
    try {
      const response = await fetch(`${API_URL}/status/expiring`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching expiring certificates:', error);
      throw error;
    }
  },

  // Get expired certificates
  getExpired: async (): Promise<VesselCertificate[]> => {
    try {
      const response = await fetch(`${API_URL}/status/expired`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching expired certificates:', error);
      throw error;
    }
  }
}; 