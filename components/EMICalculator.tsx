'use client';

import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function EMICalculator() {
  const [principal, setPrincipal] = useState<number>(1000000);
  const [rate, setRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(15);
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
  const [calcMethod, setCalcMethod] = useState<'reducing' | 'flat'>('reducing');

  const { emi, totalInterest, totalAmount, amortization } = useMemo(() => {
    const p = Number(principal) || 0;
    const r = Number(rate) || 0;
    let t = Number(tenure) || 0;

    if (p <= 0 || t <= 0) {
      return { emi: 0, totalInterest: 0, totalAmount: 0, amortization: [] };
    }

    const months = tenureType === 'years' ? t * 12 : t;
    const yearsForSchedule = Math.ceil(months / 12);

    let calculatedEmi = 0;
    let totalInt = 0;
    let totalAmt = 0;
    const schedule = [];

    if (calcMethod === 'reducing') {
      const monthlyRate = r / 12 / 100;
      if (monthlyRate === 0) {
        calculatedEmi = p / months;
        totalInt = 0;
        totalAmt = p;
      } else {
        const mathPow = Math.pow(1 + monthlyRate, months);
        calculatedEmi = p * monthlyRate * (mathPow / (mathPow - 1));
        totalAmt = calculatedEmi * months;
        totalInt = totalAmt - p;
      }

      // Generate Amortization Schedule (Yearly breakdown)
      let balance = p;
      let currentMonth = 1;
      
      for (let year = 1; year <= yearsForSchedule; year++) {
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        
        let monthsInThisYear = 0;
        while (monthsInThisYear < 12 && currentMonth <= months) {
          const interestForMonth = balance * monthlyRate;
          const principalForMonth = calculatedEmi - interestForMonth;
          yearlyInterest += interestForMonth;
          yearlyPrincipal += principalForMonth;
          balance -= principalForMonth;
          currentMonth++;
          monthsInThisYear++;
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
      const tenureInYears = months / 12;
      totalInt = p * (r / 100) * tenureInYears;
      totalAmt = p + totalInt;
      calculatedEmi = totalAmt / months;
      
      // Simple linear amortization for Flat Rate
      const yearlyPrincipal = p / tenureInYears;
      const yearlyInterest = totalInt / tenureInYears;
      let balance = p;
      
      for (let year = 1; year <= yearsForSchedule; year++) {
        const fractionOfYear = (year === yearsForSchedule && months % 12 !== 0) ? (months % 12) / 12 : 1;
        const pPaid = yearlyPrincipal * fractionOfYear;
        const iPaid = yearlyInterest * fractionOfYear;
        balance -= pPaid;
        
        schedule.push({
          year,
          principalPaid: Math.round(pPaid),
          interestPaid: Math.round(iPaid),
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
  }, [principal, rate, tenure, tenureType, calcMethod]);

  const p = Number(principal) || 0;
  const principalPercentage = totalAmount > 0 ? (p / totalAmount) * 100 : 0;
  const interestPercentage = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="mb-6 flex gap-3 items-center">
        <h2 className="text-2xl font-light text-white tracking-tight">Advanced EMI Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk">Loan Parameters</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Calculation Method</label>
                <Select value={calcMethod} onValueChange={(val) => setCalcMethod(val as 'reducing' | 'flat')}>
                  <SelectTrigger className="w-full bg-black/20 border-white/10 text-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors h-10">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121214] border-white/10 text-slate-200 rounded-lg">
                    <SelectItem value="reducing">Reducing Balance (Standard)</SelectItem>
                    <SelectItem value="flat">Flat Rate (Consumer Durable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest font-grotesk">Principal Amount</label>
                  <span className="text-emerald-400 font-mono text-sm font-semibold">{formatCurrency(principal)}</span>
                </div>
                <Input 
                  type="number" 
                  value={principal || ''} 
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 text-slate-200 font-mono focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors h-10"
                />
                <input 
                  type="range" 
                  min="10000" max="50000000" step="10000" 
                  value={principal} 
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10K</span>
                  <span>5Cr</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest font-grotesk">Interest Rate (% p.a.)</label>
                  <span className="text-emerald-400 font-mono text-sm font-semibold">{rate}%</span>
                </div>
                <Input 
                  type="number" 
                  step="0.1"
                  value={rate || ''} 
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 text-slate-200 font-mono focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors h-10"
                />
                <input 
                  type="range" 
                  min="1" max="30" step="0.1" 
                  value={rate} 
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1%</span>
                  <span>30%</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest font-grotesk">Tenure</label>
                  <Tabs value={tenureType} onValueChange={(v) => setTenureType(v as 'years' | 'months')} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-8 bg-black/20 border border-white/5">
                      <TabsTrigger value="years" className="text-[10px] data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400">Yr</TabsTrigger>
                      <TabsTrigger value="months" className="text-[10px] data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400">Mo</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Input 
                  type="number" 
                  value={tenure || ''} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full bg-black/20 border border-white/10 text-slate-200 font-mono focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors h-10"
                />
                <input 
                  type="range" 
                  min="1" max={tenureType === 'years' ? 30 : 360} step="1" 
                  value={tenure} 
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 {tenureType === 'years' ? 'Yr' : 'Mo'}</span>
                  <span>{tenureType === 'years' ? '30 Yrs' : '360 Mos'}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl overflow-hidden relative h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="text-center py-4">
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-2">Monthly EMI</div>
              <div className="text-5xl font-bold text-white tracking-tight mb-8">
                {formatCurrency(Math.round(emi))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-400">Principal Amount</span>
                </div>
                <span className="text-slate-300 font-medium">{formatCurrency(p)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-slate-400">Total Interest</span>
                </div>
                <span className="text-slate-300 font-medium">{formatCurrency(Math.round(totalInterest))}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-white/5 text-sm">
                <span className="text-slate-300 font-medium uppercase tracking-wider text-[10px]">Total Payment</span>
                <span className="text-emerald-400 font-bold font-mono text-lg">{formatCurrency(Math.round(totalAmount))}</span>
              </div>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                <span>Principal ({principalPercentage.toFixed(1)}%)</span>
                <span>Interest ({interestPercentage.toFixed(1)}%)</span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${principalPercentage}%` }}></div>
                <div className="h-full bg-amber-500 transition-all duration-500 ease-out" style={{ width: `${interestPercentage}%` }}></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Amortization Schedule */}
      {amortization.length > 0 && (
        <section className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-xl mt-6">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk">Yearly Amortization Schedule</h3>
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
                    <TableCell className="text-right font-mono text-sm text-emerald-400">{formatCurrency(row.principalPaid)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-400">{formatCurrency(row.interestPaid)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-200">{formatCurrency(row.balance)}</TableCell>
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

