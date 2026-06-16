'use client';

import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState<number>(4500000);
  const [rate, setRate] = useState<number>(8.4);
  const [tenure, setTenure] = useState<number>(20);
  const [calcMethod, setCalcMethod] = useState<'reducing' | 'flat'>('reducing');

  const { emi, totalInterest, totalAmount, amortization } = useMemo(() => {
    if (!principal || !tenure || principal <= 0 || tenure <= 0) {
      return { emi: 0, totalInterest: 0, totalAmount: 0, amortization: [] };
    }

    let calculatedEmi = 0;
    let totalInt = 0;
    let totalAmt = 0;
    const months = tenure * 12;
    const schedule = [];

    if (calcMethod === 'reducing') {
      const r = rate / 12 / 100;
      if (r === 0) {
        calculatedEmi = principal / months;
        totalInt = 0;
        totalAmt = principal;
      } else {
        calculatedEmi = principal * r * (Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
        totalAmt = calculatedEmi * months;
        totalInt = totalAmt - principal;
      }

      // Generate Amortization Schedule (Yearly)
      let balance = principal;
      for (let year = 1; year <= tenure; year++) {
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        for (let m = 1; m <= 12; m++) {
          const interestForMonth = balance * (rate / 12 / 100);
          const principalForMonth = calculatedEmi - interestForMonth;
          yearlyInterest += interestForMonth;
          yearlyPrincipal += principalForMonth;
          balance -= principalForMonth;
        }
        schedule.push({
          year,
          principalPaid: Math.round(yearlyPrincipal),
          interestPaid: Math.round(yearlyInterest),
          balance: Math.max(0, Math.round(balance)),
        });
      }
    } else {
      // Flat Rate
      totalInt = principal * (rate / 100) * tenure;
      totalAmt = principal + totalInt;
      calculatedEmi = totalAmt / months;
      
      // Simple linear amortization for Flat Rate
      const yearlyPrincipal = principal / tenure;
      const yearlyInterest = totalInt / tenure;
      let balance = principal;
      for (let year = 1; year <= tenure; year++) {
        balance -= yearlyPrincipal;
        schedule.push({
          year,
          principalPaid: Math.round(yearlyPrincipal),
          interestPaid: Math.round(yearlyInterest),
          balance: Math.max(0, Math.round(balance)),
        });
      }
    }

    return { 
      emi: calculatedEmi, 
      totalInterest: totalInt, 
      totalAmount: totalAmt,
      amortization: schedule
    };
  }, [principal, rate, tenure, calcMethod]);

  const principalPercentage = totalAmount > 0 ? (principal / totalAmount) * 100 : 0;
  const interestPercentage = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="mb-6 flex gap-3 items-center">
        <h2 className="text-2xl font-light text-white tracking-tight">Advanced EMI Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Loan Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Calculation Method</label>
                <Select value={calcMethod} onValueChange={(val) => setCalcMethod(val as 'reducing' | 'flat')}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 focus:ring-emerald-500">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                    <SelectItem value="reducing">Reducing Balance (Standard)</SelectItem>
                    <SelectItem value="flat">Flat Rate (Consumer Durable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Principal Amount (₹)</label>
                <Input 
                  type="number" 
                  value={principal} 
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Interest Rate (% p.a.)</label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={rate} 
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Tenure (Years)</label>
                <Input 
                  type="number" 
                  value={tenure} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono text-slate-200"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-xl p-5 overflow-hidden relative h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="text-center py-4">
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2">Monthly EMI</div>
              <div className="text-5xl font-bold text-white tracking-tight mb-8">
                ₹{Math.round(emi).toLocaleString()}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Principal Amount</span>
                <span className="text-slate-300 font-medium">₹{principal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Interest</span>
                <span className="text-slate-300 font-medium">₹{Math.round(totalInterest).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-white/5 text-sm">
                <span className="text-slate-300 font-medium uppercase tracking-wider text-[10px]">Total Payment</span>
                <span className="text-emerald-400 font-bold font-mono">₹{Math.round(totalAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                <span>Principal ({principalPercentage.toFixed(1)}%)</span>
                <span>Interest ({interestPercentage.toFixed(1)}%)</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${principalPercentage}%` }}></div>
                <div className="h-full bg-amber-500" style={{ width: `${interestPercentage}%` }}></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Amortization Schedule */}
      {amortization.length > 0 && (
        <section className="bg-[#121214] border border-white/5 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yearly Amortization Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5 hover:bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-slate-400 text-xs text-center w-20">Year</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Principal Paid</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Interest Paid</TableHead>
                  <TableHead className="text-slate-400 text-xs text-right">Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortization.map((row) => (
                  <TableRow key={row.year} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-center font-mono text-sm text-slate-300">{row.year}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-400">₹{row.principalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-400">₹{row.interestPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-200">₹{row.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
