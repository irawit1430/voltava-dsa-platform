'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/db';
import { Loader2, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export default function FollowUpTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'followUps'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'followUps');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (task: any) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateDoc(doc(db, 'followUps', task.id), { status: newStatus });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `followUps/${task.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this follow-up task?')) return;
    try {
      await deleteDoc(doc(db, 'followUps', taskId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `followUps/${taskId}`);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-light text-white tracking-tight flex items-center">
          <CalendarIcon className="w-6 h-6 mr-3 text-emerald-500" />
          Follow-up Tasks
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 flex-1 items-center"><Loader2 className="animate-spin text-slate-500" /></div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#121214] border border-white/5 rounded-xl p-12 text-center flex-1 flex flex-col justify-center items-center">
          <CalendarIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No follow-ups scheduled</h3>
          <p className="text-slate-500 max-w-sm">Schedule follow-ups from a Lead&apos;s details page to sync them here and with Google Workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Pending Tasks */}
          <div className="bg-[#121214] border border-white/5 rounded-xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                <Clock className="w-4 h-4 mr-2 text-amber-500" />
                Pending
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{pendingTasks.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {pendingTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={() => toggleStatus(task)} onDelete={() => deleteTask(task.id)} />
              ))}
              {pendingTasks.length === 0 && <p className="text-sm text-slate-500 p-4 text-center">No pending tasks.</p>}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-[#121214] border border-white/5 rounded-xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                Completed
              </h3>
              <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">{completedTasks.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2 opacity-75 grayscale hover:grayscale-0 transition-opacity hover:opacity-100">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={() => toggleStatus(task)} onDelete={() => deleteTask(task.id)} />
              ))}
              {completedTasks.length === 0 && <p className="text-sm text-slate-500 p-4 text-center">No completed tasks yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete }: { task: any, onToggle: () => void, onDelete: () => void }) {
  const [now] = useState(() => Date.now());
  const dateObj = new Date(task.date);
  const isPast = dateObj.getTime() < now && task.status === 'pending';
  
  return (
    <div className={`p-4 rounded-lg border transition-colors flex gap-4 \${
      task.status === 'completed' ? 'bg-white/5 border-transparent' : 
      isPast ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'
    }`}>
      <button aria-label={task.status === 'completed' ? "Mark as pending" : "Mark as completed"} title={task.status === 'completed' ? "Mark as pending" : "Mark as completed"} onClick={onToggle} className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0">
        {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-medium truncate \${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
            Call {task.leadName}
          </h4>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ml-2 \${
            isPast ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-slate-400'
          }`}>
            {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric'})} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {task.notes && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.notes}</p>
        )}
      </div>
      <button aria-label="Delete task" title="Delete task" onClick={onDelete} className="p-1.5 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors shrink-0 h-fit">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
