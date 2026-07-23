'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/db';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bot, Loader2, Sparkles, User, Copy, MessageCircle, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';

export default function AIScriptWriter() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [language, setLanguage] = useState<string>('Hinglish');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string>('');
  
  const [isGeneratingWa, setIsGeneratingWa] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');

  const selectedLead = leads.find(l => l.id === selectedLeadId);

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

  const generateContent = async (type: 'script' | 'whatsapp') => {
    if (!selectedLeadId) return;
    
    const lead = selectedLead;
    if (!lead) return;

    if (type === 'script') {
      setIsGenerating(true);
      setScript('');
    } else {
      setIsGeneratingWa(true);
      setWhatsappMessage('');
    }
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("You must be logged in to generate scripts.");
      }

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          leadDetails: lead, 
          language, 
          generateType: type,
          agentName: auth.currentUser?.displayName || 'Agent'
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (type === 'script') {
        setScript(data.text);
      } else {
        setWhatsappMessage(data.text);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      if (type === 'script') setIsGenerating(false);
      else setIsGeneratingWa(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = () => {
    const lead = selectedLead;
    if (!lead || !lead.mobile) {
      alert("No mobile number available for this lead.");
      return;
    }
    const cleanNumber = lead.mobile.replace(/\D/g, '');
    const number = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-light text-white tracking-tight">AI Personalizer</h2>
        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded">Powered by Gemini</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Target Profile</h3>
            <div className="space-y-4">
              <Select value={selectedLeadId} onValueChange={(val) => setSelectedLeadId(val || '')}>
                <SelectTrigger className="bg-black/20 border-white/10 text-slate-200 h-10 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors">
                  <SelectValue placeholder="Select Lead..." />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10 text-slate-200 rounded-lg">
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mt-6 mb-3">Language preference</h3>
            <div className="space-y-4">
              <Select value={language} onValueChange={(val) => setLanguage(val || 'Hinglish')}>
                <SelectTrigger className="bg-black/20 border-white/10 text-slate-200 h-10 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors">
                  <SelectValue placeholder="Select Language..." />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10 text-slate-200 rounded-lg">
                  <SelectItem value="Hinglish">Hinglish (Default)</SelectItem>
                  <SelectItem value="Hindi">Pure Hindi (नमस्ते)</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {selectedLeadId && selectedLead && (
            <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5 flex items-center">
                 Context Variables
              </h3>
              <div className="text-xs text-slate-300 space-y-4">
                <>
                  <div><strong className="text-slate-500 block mb-1 uppercase text-[10px] tracking-widest font-grotesk">Prospect Name</strong> {selectedLead.fullName}</div>
                  <div><strong className="text-slate-500 block mb-1 uppercase text-[10px] tracking-widest font-grotesk">Mobile</strong> {selectedLead.mobile}</div>
                  <div><strong className="text-slate-500 block mb-1 uppercase text-[10px] tracking-widest font-grotesk">Loan Value</strong> <span className="font-mono text-emerald-400">₹{selectedLead.loanAmount?.toLocaleString()}</span></div>
                  <div><strong className="text-slate-500 block mb-1 uppercase text-[10px] tracking-widest font-grotesk">Employment Target</strong> {selectedLead.company || 'N/A'}</div>
                  <div><strong className="text-slate-500 block mb-1 uppercase text-[10px] tracking-widest font-grotesk">Pipeline Stage</strong> <span className="uppercase text-[10px] tracking-widest font-grotesk text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{selectedLead.status}</span></div>
                </>
              </div>
            </section>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <section className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 shadow-xl flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-5">
               <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-grotesk flex items-center gap-2">
                 <Bot className="w-4 h-4" /> Call Script & Objection Handling
               </h3>
               {script && (
                 <button onClick={() => copyToClipboard(script)} className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest font-grotesk hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1 rounded">
                   Copy
                 </button>
               )}
            </div>
            
            <div className="flex-1 bg-black/40 rounded-xl border border-emerald-500/10 p-6 text-sm leading-relaxed text-slate-300 font-serif overflow-y-auto w-full prose prose-invert prose-emerald max-w-none shadow-inner">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-emerald-500/50 min-h-[150px]">
                   <Loader2 className="w-6 h-6 animate-spin mb-3" />
                   <p className="text-[10px] uppercase tracking-widest font-grotesk font-bold">Synthesizing Script...</p>
                </div>
              ) : script ? (
                <Markdown>{script}</Markdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-emerald-900/50 min-h-[150px]">
                  <Sparkles className="w-8 h-8 mb-3 opacity-30 text-emerald-500" />
                  <p className="text-[10px] uppercase tracking-widest font-grotesk font-bold">Select a lead to generate script</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => generateContent('script')}
              disabled={!selectedLeadId || isGenerating}
              className="mt-5 w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-widest font-bold font-grotesk hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all rounded-lg outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isGenerating ? 'Analyzing...' : script ? 'Regenerate Script' : 'Generate Calling Script'}
            </button>
          </section>

          <section className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6 shadow-xl flex flex-col min-h-[250px]">
            <div className="flex justify-between items-center mb-5">
               <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-grotesk flex items-center gap-2">
                 <MessageCircle className="w-4 h-4" /> WhatsApp Follow-up Template
               </h3>
               {whatsappMessage && (
                 <button onClick={() => copyToClipboard(whatsappMessage)} className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest font-grotesk hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1 rounded">
                   Copy
                 </button>
               )}
            </div>
            
            <div className="flex-1 bg-black/40 rounded-xl border border-blue-500/10 p-5 text-sm leading-relaxed text-slate-300 font-serif overflow-y-auto w-full shadow-inner whitespace-pre-wrap">
              {isGeneratingWa ? (
                <div className="h-full flex flex-col items-center justify-center text-blue-500/50 min-h-[100px]">
                   <Loader2 className="w-6 h-6 animate-spin mb-3" />
                   <p className="text-[10px] uppercase tracking-widest font-grotesk font-bold">Drafting Message...</p>
                </div>
              ) : whatsappMessage ? (
                whatsappMessage
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-blue-900/50 min-h-[100px]">
                  <MessageCircle className="w-8 h-8 mb-3 opacity-30 text-blue-500" />
                  <p className="text-[10px] uppercase tracking-widest font-grotesk font-bold">Ready to generate WhatsApp template</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => generateContent('whatsapp')}
                disabled={!selectedLeadId || isGeneratingWa}
                className="flex-1 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest font-bold font-grotesk hover:bg-blue-500/20 hover:border-blue-500/50 transition-all rounded-lg outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingWa ? 'Drafting...' : whatsappMessage ? 'Regenerate Template' : 'Generate WhatsApp Message'}
              </button>
              
              {whatsappMessage && (
                <button 
                  onClick={openWhatsApp}
                  className="px-6 py-3 bg-[#25D366] text-white text-[10px] uppercase tracking-widest font-bold font-grotesk hover:bg-[#1DA851] transition-all rounded-lg outline-none cursor-pointer flex items-center gap-2"
                >
                  Send <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
