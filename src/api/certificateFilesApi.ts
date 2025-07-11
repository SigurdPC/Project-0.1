import API_BASE_URL from './config';

export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  path: string;
}

class CertificateFilesApi {
  private baseUrl = `${API_BASE_URL}/certificate-files`;

  async uploadFile(file: File, customFileName?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (customFileName) {
      formData.append('customFileName', customFileName);
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload file';
      
      // Try to parse error response as JSON, but fallback to generic message if it fails
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        }
      } catch (parseError) {
        // If JSON parsing fails, use default error message
        console.warn('Failed to parse error response as JSON:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async downloadFile(filename: string, saveAsName?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/download/${filename}`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to download file';
      
      // Try to parse error response as JSON, but fallback to generic message if it fails
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        }
      } catch (parseError) {
        // If JSON parsing fails, use default error message
        console.warn('Failed to parse error response as JSON:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Check if File System Access API is supported for directory picker
    if ('showSaveFilePicker' in window) {
      try {
        // Modern browsers - allow user to choose save location
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: saveAsName || filename,
          types: [{
            description: 'Certificate files',
            accept: {
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
            },
          }],
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        window.URL.revokeObjectURL(url);
        return;
      } catch (err: any) {
        // Check if user cancelled the save dialog
        if (err.name === 'AbortError') {
          console.log('User cancelled file save');
          window.URL.revokeObjectURL(url);
          return; // Exit without downloading
        }
        
        // API not supported or other error, fall back to default download
        console.log('Save dialog not supported or other error, falling back to default download:', err);
      }
    }
    
    // Fallback for older browsers or if API is not supported (but NOT if user cancelled)
    const link = document.createElement('a');
    link.href = url;
    link.download = saveAsName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async deleteFile(filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete file';
      
      // Try to parse error response as JSON, but fallback to generic message if it fails
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        }
      } catch (parseError) {
        // If JSON parsing fails, use default error message
        console.warn('Failed to parse error response as JSON:', parseError);
      }
      
      throw new Error(errorMessage);
    }
  }

  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}/download/${filename}`;
  }
}

export const certificateFilesApi = new CertificateFilesApi(); 