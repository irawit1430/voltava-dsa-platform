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
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const storagePath = `leads/${selectedLeadId}/documents/${Date.now()}_${file.name}`;
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
        <section className="col-span-1 space-y-6 bg-[#121214] border border-white/5 rounded-xl p-5 h-full">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Lead Selection</h3>
          <Select value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val || '')}>
            <SelectTrigger className="bg-white/5 border-white/10 text-slate-200">
              <SelectValue placeholder="Search leads..." />
            </SelectTrigger>
            <SelectContent className="bg-[#121214] border-white/10 text-slate-200">
              {leads.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLeadId && (
            <div className="pt-6 border-t border-white/5 mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Upload File</h3>
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
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
            </div>
          )}
        </section>

        <section className="col-span-2 bg-[#121214] border border-white/5 rounded-xl p-5 h-full min-h-[500px] flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Uploaded Files</h3>
          
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
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 hover:border-emerald-500/20 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-[#121214] rounded flex items-center justify-center text-[10px] uppercase font-bold text-emerald-500 mr-3 border border-white/5">
                      DOC
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded">Uploaded</span>
                    <button onClick={() => handleDelete(doc)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
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
