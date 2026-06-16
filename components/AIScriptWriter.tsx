'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/db';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bot, Loader2, Sparkles, User, Copy } from 'lucide-react';
import Markdown from 'react-markdown';

export default function AIScriptWriter() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string>('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubLeads = onSnapshot(query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid)), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });
    return () => unsubLeads();
  }, []);

  const generateScript = async () => {
    if (!selectedLeadId) return;
    
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    setIsGenerating(true);
    setScript('');
    
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadDetails: lead })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setScript(data.text);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-light text-white tracking-tight">AI Personalizer</h2>
        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded">Powered by Gemini</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Target Profile</h3>
            <div className="space-y-4">
              <Select value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val || '')}>
                <SelectTrigger className="bg-white/5 border-white/10 text-slate-200">
                  <SelectValue placeholder="Select Lead..." />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10 text-slate-200">
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {selectedLeadId && leads.find(l => l.id === selectedLeadId) && (
            <section className="bg-[#121214] border border-white/5 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                 Context Variables
              </h3>
              <div className="text-xs text-slate-300 space-y-3">
                {(() => {
                  const l = leads.find(l => l.id === selectedLeadId);
                  return (
                    <>
                      <div><strong className="text-slate-500 block mb-0.5 uppercase text-[10px] tracking-wider">Prospect Name</strong> {l.fullName}</div>
                      <div><strong className="text-slate-500 block mb-0.5 uppercase text-[10px] tracking-wider">Loan Value</strong> <span className="font-mono text-emerald-400">₹{l.loanAmount?.toLocaleString()}</span></div>
                      <div><strong className="text-slate-500 block mb-0.5 uppercase text-[10px] tracking-wider">Employment Target</strong> {l.company || 'N/A'}</div>
                      <div><strong className="text-slate-500 block mb-0.5 uppercase text-[10px] tracking-wider">Pipeline Stage</strong> <span className="uppercase text-[10px] tracking-wider text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded">{l.status}</span></div>
                    </>
                  )
                })()}
              </div>
            </section>
          )}
        </div>

        <div className="md:col-span-2">
          <section className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                 <Bot className="w-4 h-4" /> Script Generator
               </h3>
               {script && (
                 <button onClick={copyToClipboard} className="text-[10px] text-emerald-300 uppercase tracking-widest hover:text-white transition-colors">
                   Copy to Clipboard
                 </button>
               )}
            </div>
            
            <div className="flex-1 bg-black/40 rounded border border-white/5 p-5 text-sm leading-relaxed text-slate-300 font-serif overflow-y-auto w-full prose prose-invert prose-emerald max-w-none">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-emerald-500/50">
                   <Loader2 className="w-6 h-6 animate-spin mb-3" />
                   <p className="text-xs uppercase tracking-widest font-sans">Synthesizing Pitch...</p>
                </div>
              ) : script ? (
                <Markdown>{script}</Markdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 font-sans">
                  <Sparkles className="w-8 h-8 mb-3 opacity-30 text-emerald-500" />
                  <p className="text-[10px] uppercase tracking-widest">Awaiting Parameters</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={generateScript}
              disabled={!selectedLeadId || isGenerating}
              className="mt-4 w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-500/20 transition-all rounded outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isGenerating ? 'Analyzing...' : script ? 'Regenerate Strategy' : 'Generate Calling Script'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
