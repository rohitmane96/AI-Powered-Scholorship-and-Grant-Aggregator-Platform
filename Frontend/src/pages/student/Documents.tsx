import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Upload,
  Trash2,
  Download,
  FileText,
  Image,
  File,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import { documentsApi } from '@/api/documents'
import { DocumentType } from '@/types'
import { formatDocumentType, formatFileSize, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { NativeSelect } from '@/components/ui/Select'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonCard } from '@/components/ui/Spinner'

const documentTypeOptions = Object.values(DocumentType).map(v => ({
  value: v,
  label: formatDocumentType(v),
}))

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-rose-400" />
  if (mimeType.includes('image')) return <Image className="w-8 h-8 text-blue-400" />
  return <File className="w-8 h-8 text-slate-400" />
}

export default function Documents() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.TRANSCRIPT)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getDocuments,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: DocumentType }) =>
      documentsApi.uploadDocument(file, type, setUploadProgress),
    onSuccess: () => {
      toast.success('Document uploaded successfully!')
      setUploadProgress(0)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      toast.error('Upload failed. Please try again.')
      setUploadProgress(0)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted.')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Delete failed.'),
  })

  async function handleDownload(id: string, name: string) {
    try {
      const blob = await documentsApi.downloadDocument(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed.')
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be under 10MB')
      return
    }
    uploadMutation.mutate({ file, type: selectedType })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Documents</h1>
        <p className="text-slate-400 text-sm mt-1">Upload and manage your application documents</p>
      </div>

      {/* Upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass p-6"
      >
        <h2 className="font-semibold text-slate-100 mb-4">Upload Document</h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <NativeSelect
            label="Document Type"
            options={documentTypeOptions}
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as DocumentType)}
            className="sm:w-64"
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-200 group
            ${isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30'
            }
          `}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={e => handleFiles(e.target.files)}
          />

          {uploadMutation.isPending ? (
            <div className="space-y-3">
              <Upload className="w-10 h-10 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-slate-300 font-medium">Uploading...</p>
              <div className="max-w-xs mx-auto">
                <Progress value={uploadProgress} size="md" color="gradient" showLabel />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
              <p className="text-slate-300 font-medium">
                Drop file here or <span className="text-indigo-400">click to browse</span>
              </p>
              <p className="text-slate-500 text-sm mt-1">
                PDF, DOC, DOCX, JPG, PNG up to 10MB
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Documents grid */}
      <div>
        <h2 className="font-semibold text-slate-100 mb-4">
          Your Documents
          {documents && <span className="text-slate-500 font-normal ml-2">({documents.length})</span>}
        </h2>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !documents || documents.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No documents yet"
            description="Upload your documents to attach them to scholarship applications."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-glass hover:border-slate-600/50 p-5 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-slate-800/60 shrink-0">
                      <FileIcon mimeType={doc.mimeType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{doc.originalName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="primary">{formatDocumentType(doc.type)}</Badge>
                    {doc.verified ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3" /> Pending
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mb-3">Uploaded {formatDate(doc.uploadedAt)}</p>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(doc.id, doc.originalName)}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(doc.id)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Document"
        description="Are you sure you want to delete this document? This cannot be undone."
        size="sm"
      >
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
