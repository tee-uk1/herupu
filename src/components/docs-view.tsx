"use client"
import { useState } from "react"
import { FileText, Plus, ArrowLeft, Clock } from "lucide-react"
import { DocumentEditor } from "./document-editor"
import { createDocument, updateDocument } from "@/app/actions"

export function DocsView({ documents, workspaceId }: { documents: any[], workspaceId: string }) {
  const [activeDoc, setActiveDoc] = useState<any | null>(null)

  const handleCreate = async () => {
    // This perfectly links the new document to the current workspace
    const newDoc = await createDocument("Untitled Document", { workspaceId })
    setActiveDoc(newDoc)
  }

  const handleSave = async (title: string, content: string) => {
    if (!activeDoc) return
    await updateDocument(activeDoc.id, { title, content })
  }

  if (activeDoc) {
    return (
      <div className="flex flex-col h-full bg-[#0c0d10] animate-in fade-in duration-300">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <button 
            onClick={() => setActiveDoc(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </button>
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Auto-saving
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DocumentEditor 
            initialTitle={activeDoc.title}
            initialContent={activeDoc.content}
            onSave={handleSave}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0c0d10]">
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <FileText className="text-indigo-400" />
          Workspace Docs
        </h1>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors text-sm font-medium shadow-lg shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {documents.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/30">
            <p className="text-zinc-500 mb-2">No documents found in this workspace.</p>
            <p className="text-sm text-zinc-600">Create one to start drafting onboarding processes or reference guides.</p>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900 hover:border-indigo-500/50 cursor-pointer group transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-zinc-200 truncate">{doc.title}</h3>
              </div>
              <div className="text-xs text-zinc-500 flex justify-between items-center pt-2 border-t border-zinc-800/50">
                <span className="truncate pr-2">By {doc.authorName}</span>
                <span className="shrink-0">{new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}