/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function EligibilityChecker() {
  const [loanType, setLoanType] = useState<'home' | 'personal' | 'car'>('home');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(124000);
  const [currentEMIs, setCurrentEMIs] = useState<number>(15000);
  
  // Default values based on loan type will be managed by useEffect
  const [tenure, setTenure] = useState<number>(20);
  const [rate, setRate] = useState<number>(8.5);

  useEffect(() => {
    if (loanType === 'home') {
      setTenure(20);
      setRate(8.5);
    } else if (loanType === 'personal') {
      setTenure(5);
      setRate(11.5);
    } else if (loanType === 'car') {
      setTenure(7);
      setRate(9.0);
    }
  }, [loanType]);

  const eligibility = useMemo(() => {
    // Dynamic FOIR logic based on loan type and income
    let foirLimit = 0.5;
    if (loanType === 'home') foirLimit = monthlyIncome > 100000 ? 0.65 : 0.6;
    else if (loanType === 'personal') foirLimit = monthlyIncome > 100000 ? 0.6 : 0.5;
    else if (loanType === 'car') foirLimit = 0.55;

    const maxEmiAllowed = (monthlyIncome * foirLimit) - currentEMIs;
    
    if (maxEmiAllowed <= 0) {
      return { eligibleLoan: 0, maxEmi: 0, foirUsed: 1, foirLimit, processingFee: 0, gst: 0, stampDuty: 0 };
    }

    const r = rate / 12 / 100;
    const n = tenure * 12; // tenure in years -> months
    let maxLoan = 0;

    if (r === 0) {
      maxLoan = maxEmiAllowed * n;
    } else {
      maxLoan = maxEmiAllowed / (r * (Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)));
    }

    // Statutory Charges (KFS Elements)
    const pfPercent = loanType === 'home' ? 1 : loanType === 'personal' ? 2 : 1.5;
    const processingFee = (maxLoan * pfPercent) / 100;
    const gst = processingFee * 0.18;
    const stampDuty = maxLoan * 0.0015; // average 0.15%

    return {
      eligibleLoan: Math.max(0, maxLoan),
      maxEmi: maxEmiAllowed,
      foirUsed: currentEMIs / (monthlyIncome * foirLimit),
      foirLimit,
      processingFee,
      gst,
      stampDuty
    };
  }, [monthlyIncome, currentEMIs, tenure, rate, loanType]);

  const { eligibleLoan, maxEmi, foirUsed, foirLimit, processingFee, gst, stampDuty } = eligibility;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="mb-6 flex gap-3 items-center">
        <h2 className="text-2xl font-light text-white tracking-tight">Advanced Eligibility Checker</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#121214] border border-white/5 rounded-xl p-5 h-fit">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Profile & Financial Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Loan Type</label>
              <Select value={loanType} onValueChange={(val) => setLoanType(val as 'home' | 'personal' | 'car')}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 focus:ring-emerald-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectItem value="home">Home Loan</SelectItem>
                  <SelectItem value="personal">Personal Loan</SelectItem>
                  <SelectItem value="car">Car Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Net Monthly Income (₹)</label>
              <Input 
                type="number" 
                value={monthlyIncome} 
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Existing EMIs (₹/month)</label>
              <Input 
                type="number" 
                value={currentEMIs} 
                onChange={(e) => setCurrentEMIs(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-amber-400 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Tenure (Yrs)</label>
                 <Input 
                   type="number" 
                   value={tenure} 
                   onChange={(e) => setTenure(Number(e.target.value))}
                   className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200 focus:border-emerald-500"
                 />
               </div>
               <div>
                 <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Rate (%)</label>
                 <Input 
                   type="number" 
                   step="0.1"
                   value={rate} 
                   onChange={(e) => setRate(Number(e.target.value))}
                   className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200 focus:border-emerald-500"
                 />
               </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Estimated Max Loan</h3>
            
            <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-emerald-500 flex items-center justify-center mb-6">
              <div className="text-center">
                <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">
                  {(Math.round(eligibleLoan/100000)).toLocaleString()}L
                </span>
                <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Cap</span>
              </div>
            </div>

            <div className="text-3xl font-light text-white tracking-tight mb-2">
              ₹{Math.round(eligibleLoan).toLocaleString()}
            </div>
            
            <div className="text-xs text-slate-400 text-center italic mt-2">
              Based on {loanType === 'home' ? 'Home' : loanType === 'personal' ? 'Personal' : 'Car'} Loan FOIR guidelines ({(foirLimit * 100).toFixed(0)}% max).
            </div>
            
            <div className="w-full mt-8 pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                <span>Debt-to-Income Utilization</span>
                <span className="text-slate-300 font-mono">{(foirUsed * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div 
                  className={`h-1 rounded-full ${foirUsed > 0.8 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, foirUsed * 100)}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Key Fact Statement (KFS) Estimations */}
          {eligibleLoan > 0 && (
            <section className="bg-[#121214] border border-white/5 rounded-xl p-5 relative overflow-hidden">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Statutory Charges (KFS Estimates)</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Est. Processing Fee</span>
                  <span className="text-slate-300 font-mono">₹{Math.round(processingFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">GST on PF (18%)</span>
                  <span className="text-slate-300 font-mono">₹{Math.round(gst).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Est. Stamp Duty</span>
                  <span className="text-slate-300 font-mono">₹{Math.round(stampDuty).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest">Total Upfront Costs</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{Math.round(processingFee + gst + stampDuty).toLocaleString()}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
