import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, ShieldAlert, PhoneIncoming } from 'lucide-react';
import { Input } from './ui/input';

const objections = [
  {
    category: "Interest Rate",
    title: "Interest rate bahut zyada hai (Rate is too high)",
    response: "Sir/Mam, baaki banks me processing fee, insurance, aur hidden charges lagne ke baad actual rate yahi padta hai. Humara rate transparent hai, koi hidden cost nahi. Plus, approval bhi fast hai."
  },
  {
    category: "Already have a loan",
    title: "Mera already loan chal raha hai (Already have a loan)",
    response: "Sir, hum aapke existing loan ko top-up kar sakte hain, ya phir balance transfer karke aapki EMI kam kar sakte hain. Ek baar eligibility check kar lete hain, free of cost."
  },
  {
    category: "Processing Fee",
    title: "Processing fee nahi dunga (Won't pay processing fee)",
    response: "Sir, processing fee one-time hoti hai aur EMI me adjust ho jati hai. Mai apne side se try karunga ki kuch discount dila saku, par ek baar login kar lete hain."
  },
  {
    category: "Trust",
    title: "Aap log fraud lagte ho (You seem like fraud)",
    response: "Sir, mai samajh sakta hu aaj kal frauds hote hain. Par hum RBI registered NBFCs/Banks ke through kaam karte hain. Aapko sirf official link pe apply karna hoga, mere personal number pe koi detail nahi bhejni hai."
  },
  {
    category: "Not right now",
    title: "Abhi zarurat nahi hai, baad me dekhenge (Don't need it right now)",
    response: "Koi baat nahi sir. Par abhi festive offers chal rahe hain toh rate of interest kaafi kam hai. Pre-approved limit le kar rakh lijiye, zarurat padne par instantly use kar sakte hain."
  },
  {
    category: "Documentation",
    title: "Mere paas ITR/Salary slip nahi hai (No ITR/Salary Slip)",
    response: "Sir, agar aapke bank statement me transactions achhe hain, toh hum bina ITR ke bhi aapko loan dila sakte hain. Humare paas aise programs hain jisme sirf KYC aur Bank Statement lagti hai."
  }
];

export default function ObjectionHandling() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredObjections = objections.filter(obj => 
    obj.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    obj.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-light text-white tracking-tight">Objection Handling Cheat Sheet</h2>
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-500/10 rounded">Hindi / Hinglish</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl sticky top-6">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Ready Answers</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Quickly handle common customer objections during cold calls. Search for keywords like "interest", "fee", or "fraud" to find the right response instantly.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search objections..." 
                className="pl-9 bg-black/20 border-white/10 text-slate-200 h-10 focus:border-amber-500/50 focus:ring-amber-500/20 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {filteredObjections.length === 0 ? (
            <div className="bg-[#121214] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center">
              <PhoneIncoming className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No matching objections found.</p>
            </div>
          ) : (
            filteredObjections.map((obj, idx) => (
              <div 
                key={idx} 
                className={`bg-[#121214] border rounded-xl overflow-hidden transition-all duration-200 ${openIndex === idx ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'border-white/5 hover:border-white/10'}`}
              >
                <button 
                  className="w-full text-left p-5 flex justify-between items-center"
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-1 block">{obj.category}</span>
                    <h4 className={`text-base font-medium transition-colors ${openIndex === idx ? 'text-amber-400' : 'text-slate-200'}`}>
                      {obj.title}
                    </h4>
                  </div>
                  {openIndex === idx ? (
                    <ChevronUp className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                
                {openIndex === idx && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-amber-500/5">
                    <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-amber-500/50 pl-4 py-1">
                      &quot;{obj.response}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
