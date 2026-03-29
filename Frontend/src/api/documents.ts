import api from '@/lib/axios'
import { Document, DocumentType } from '@/types'
import { mapDocumentResponse } from './mappers'

export const documentsApi = {
  getDocuments: async (applicationId?: string): Promise<Document[]> => {
    const res = applicationId
      ? await api.get(`/api/documents/application/${applicationId}`)
      : await api.get('/api/documents')
    return Array.isArray(res.data) ? res.data.map(mapDocumentResponse) : []
  },

  uploadDocument: async (
    file: File,
    applicationId: string | undefined,
    type: DocumentType,
    onUploadProgress?: (progress: number) => void
  ): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    if (applicationId) {
      formData.append('applicationId', applicationId)
    }
    formData.append('type', type)
    const res = await api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(progress)
        }
      },
    })
    return mapDocumentResponse(res.data)
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/api/documents/${id}`)
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const res = await api.get(`/api/documents/${id}`, {
      responseType: 'blob',
    })
    return res.data
  },
}
