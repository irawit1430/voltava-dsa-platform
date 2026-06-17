'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Users, Calculator, FileCheck, 
  FilesIcon, Bot, LogOut, Loader2, Calendar,
  User as UserIcon, ShieldAlert
} from 'lucide-react';

import LeadsSection from './LeadsSection';
import EMICalculator from './EMICalculator';
import EligibilityChecker from './EligibilityChecker';
import DocumentVault from './DocumentVault';
import AIScriptWriter from './AIScriptWriter';
import FollowUpTasks from './FollowUpTasks';
import ObjectionHandling from './ObjectionHandling';

export default function Dashboard({ user, onLogout }: { user: User | null, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'leads' | 'tasks' | 'emi' | 'eligibility' | 'docs' | 'ai' | 'objections'>('leads');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await onLogout();
  };

  const navItems = [
    { id: 'leads', label: 'Lead Tracker', icon: Users },
    { id: 'tasks', label: 'Follow-ups', icon: Calendar },
    { id: 'emi', label: 'EMI Calculator', icon: Calculator },
    { id: 'eligibility', label: 'Eligibility Check', icon: FileCheck },
    { id: 'docs', label: 'Document Vault', icon: FilesIcon },
    { id: 'ai', label: 'AI Script (Gemini)', icon: Bot },
    { id: 'objections', label: 'Hindi Objections', icon: ShieldAlert },
  ] as const;

  return (
    <div className="flex h-screen w-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#0F0F11] border-r border-white/5 flex flex-col hide-scrollbar">
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0F0F11]">
          <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center mr-3 shrink-0">
            <span className="text-white font-bold text-sm">$</span>
          </div>
          <span className="text-white font-light text-lg tracking-tight">LoanPro <span className="text-emerald-500 font-medium">DSA</span></span>
        </div>
        
        <div className="flex-1 py-6 px-3 flex flex-col space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-white/5 text-emerald-400' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            {user?.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 uppercase shrink-0">
                {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2) : <UserIcon className="w-4 h-4 text-emerald-400" />}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-slate-300 truncate">{user?.displayName || 'Agent'}</span>
              <span className="text-xs text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-500 hover:text-white transition-colors"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 mr-3 animate-spin"/> : <LogOut className="w-4 h-4 mr-3" />}
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#0A0A0B]">
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'tasks' && <FollowUpTasks />}
        {activeTab === 'emi' && <EMICalculator />}
        { activeTab === 'eligibility' && <EligibilityChecker /> }
        { activeTab === 'docs' && <DocumentVault /> }
        { activeTab === 'ai' && <AIScriptWriter /> }
        { activeTab === 'objections' && <ObjectionHandling /> }
      </div>
    </div>
  );
}
