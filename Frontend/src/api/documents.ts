import api from '@/lib/axios'
import { Document, DocumentType } from '@/types'

export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const res = await api.get('/api/documents')
    return res.data
  },

  uploadDocument: async (
    file: File,
    type: DocumentType,
    onUploadProgress?: (progress: number) => void
  ): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const res = await api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(progress)
        }
      },
    })
    return res.data
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/api/documents/${id}`)
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const res = await api.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    })
    return res.data
  },
}
