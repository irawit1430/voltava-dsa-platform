'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { handleFirestoreError, OperationType, makeId } from '@/lib/db';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, UploadCloud, File, Loader2 } from 'lucide-react';

export default function DocumentVault() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubLeads = onSnapshot(query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid)), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
    });
    return () => unsubLeads();
  }, []);

  useEffect(() => {
    if (!selectedLeadId) {
      setTimeout(() => {
        setDocuments([]);
        setIsLoading(false);
      }, 0);
      return;
    }

    // Security: Validate selectedLeadId to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(selectedLeadId)) {
      console.error('Security Error: Invalid lead ID format.');
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    setTimeout(() => setIsLoading(true), 0);
    const unsubDocs = onSnapshot(query(collection(db, `leads/${selectedLeadId}/documents`), where('userId', '==', auth.currentUser?.uid)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leads/${selectedLeadId}/documents`);
    });
    return () => unsubDocs();
  }, [selectedLeadId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    if (!selectedLeadId || !auth.currentUser) {
      alert('Please select a lead first');
      return;
    }

    // Security: Validate selectedLeadId to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(selectedLeadId)) {
      alert('Security Error: Invalid lead ID format. Potential path traversal detected.');
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];

    // Security: Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Security Error: Invalid file type. Only PDF and images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Security Error: File exceeds 5MB size limit.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    
    try {
      // Security: Sanitize filename to prevent path traversal issues
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `leads/${selectedLeadId}/documents/${Date.now()}_${sanitizedName}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      const newDoc = {
        userId: auth.currentUser.uid,
        leadId: selectedLeadId,
        name: file.name,
        url: downloadUrl,
        storagePath: storagePath,
        createdAt: Date.now()
      };
      await addDoc(collection(db, `leads/${selectedLeadId}/documents`), newDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `leads/${selectedLeadId}/documents`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (document: any) => {
    if (!confirm('Delete this document?')) return;
    try {
      if (document.storagePath) {
        const fileRef = ref(storage, document.storagePath);
        await deleteObject(fileRef).catch(err => {
          console.warn('Failed to delete file from Storage:', err);
        });
      }
      await deleteDoc(doc(db, `leads/${selectedLeadId}/documents`, document.id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `leads/${selectedLeadId}/documents/${document.id}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex gap-3 items-center">
        <h2 className="text-2xl font-light text-white tracking-tight">Document Vault</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-1 space-y-6 bg-[#121214] border border-white/5 rounded-2xl p-6 h-full shadow-xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Lead Selection</h3>
          <Select value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val || '')}>
            <SelectTrigger className="bg-black/20 border-white/10 text-slate-200 h-10 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors">
              <SelectValue placeholder="Search leads..." />
            </SelectTrigger>
            <SelectContent className="bg-[#121214] border-white/10 text-slate-200 rounded-lg">
              {leads.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLeadId && (
            <div className="pt-6 border-t border-white/5 mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Upload File</h3>
              <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-emerald-500 mb-2" />
                  )}
                  <p className="mb-1 text-xs text-slate-300 font-medium tracking-wide">Click to browse</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">PDF, JPG, PNG</p>
                </div>
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.jpg,.jpeg,.png,.webp" />
                </label>
            </div>
          )}
        </section>

        <section className="col-span-2 bg-[#121214] border border-white/5 rounded-2xl p-6 h-full min-h-[500px] flex flex-col shadow-xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Uploaded Files</h3>
          
          {!selectedLeadId ? (
            <div className="flex-1 flex flex-col justify-center items-center opacity-50">
               <File className="w-8 h-8 text-slate-600 mb-3" />
               <p className="text-slate-500 text-sm">Select a lead to view documents</p>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-slate-500 w-5 h-5" /></div>
          ) : documents.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center opacity-70">
              <p className="text-slate-500 text-sm italic">Vault is empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#121214] rounded-lg flex items-center justify-center text-[10px] uppercase font-bold text-emerald-500 mr-4 border border-white/5">
                      DOC
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors">{doc.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest px-3 py-1 bg-emerald-500/10 rounded-lg">Uploaded</span>
                    <button aria-label="Delete document" title="Delete document" onClick={() => handleDelete(doc)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
