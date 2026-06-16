'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/db';
import { createCalendarEvent, createGoogleTask } from '@/lib/workspace';
import { Plus, Calendar, CheckSquare, Trash2, Edit2, ChevronLeft, Loader2, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export default function LeadsSection() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', dob: '', fatherName: '', motherName: '', mobile: '', email: '',
    currentAddress: '', pincode: '', company: '', officeAddress: '', officePincode: '',
    referenceName: '', referenceNumber: '', loanAmount: 0, status: 'New'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'leads'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      const newLead = {
        userId: auth.currentUser.uid,
        ...formData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await addDoc(collection(db, 'leads'), newLead);
      setIsDialogOpen(false);
      setFormData({
        fullName: '', dob: '', fatherName: '', motherName: '', mobile: '', email: '',
        currentAddress: '', pincode: '', company: '', officeAddress: '', officePincode: '',
        referenceName: '', referenceNumber: '', loanAmount: 0, status: 'New'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await deleteDoc(doc(db, 'leads', id));
      if (selectedLeadId === id) setSelectedLeadId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  };

  const activeLead = leads.find(l => l.id === selectedLeadId);

  if (selectedLeadId && activeLead) {
    return <LeadDetails lead={activeLead} onBack={() => setSelectedLeadId(null)} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-light text-white tracking-tight">Lead Tracker</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4" />}>
            <Plus className="w-4 h-4 mr-2"/> Add Lead
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#121214] text-slate-200 border border-white/10 rounded-2xl h-[80vh] overflow-y-auto shadow-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-white text-xl font-light tracking-tight">Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Full Name</Label>
                  <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Mobile</Label>
                  <Input value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Date of Birth</Label>
                  <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Father&apos;s Name</Label>
                  <Input value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Mother&apos;s Name</Label>
                  <Input value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Current Address</Label>
                <Input value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Pincode</Label>
                  <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Loan Amount Requested</Label>
                  <Input type="number" value={formData.loanAmount} onChange={e => setFormData({...formData, loanAmount: Number(e.target.value)})} className="bg-white/5 border-white/10 font-mono text-emerald-400 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Employer/Company</Label>
                  <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Office Pincode</Label>
                  <Input value={formData.officePincode} onChange={e => setFormData({...formData, officePincode: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val || ''})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121214] border-white/10 text-slate-200 rounded-lg">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Documents Pending">Documents Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4 mt-6 border-t border-white/5">
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg h-10 px-6 border-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Lead'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && leads.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-1">Total Leads</span>
            <span className="text-3xl font-light text-white">{leads.length}</span>
          </div>
          <div className="bg-[#121214] border border-white/5 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-1">Active</span>
            <span className="text-3xl font-light text-white">{leads.filter(l => l.status !== 'Approved' && l.status !== 'Rejected').length}</span>
          </div>
          <div className="bg-[#121214] border border-white/5 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-1">Approved</span>
            <span className="text-3xl font-light text-emerald-400">{leads.filter(l => l.status === 'Approved').length}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12 flex-1 items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" /></div>
      ) : leads.length === 0 ? (
        <div className="bg-[#121214] border border-white/5 rounded-2xl p-12 text-center flex-1 flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
            <User className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-light text-white mb-2 tracking-tight">No leads yet</h3>
          <p className="text-slate-500 text-sm">Add your first lead to start tracking your DSA portfolio.</p>
        </div>
      ) : (
        <div className="bg-[#121214] border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0">
            <div className="col-span-2">Name & Employer</div>
            <div>Mobile</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5 overflow-y-auto flex-1 p-2 space-y-1">
            {leads.map((lead) => (
              <div key={lead.id} className="grid grid-cols-6 gap-4 p-3 items-center bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                <div className="col-span-2 font-medium text-slate-300 cursor-pointer" onClick={() => setSelectedLeadId(lead.id)}>
                  {lead.fullName}
                  <div className="text-xs text-slate-500 font-normal">{lead.company || 'Self/Other'}</div>
                </div>
                <div className="text-slate-300 text-sm">{lead.mobile}</div>
                <div className="text-emerald-400 font-mono text-sm">₹{lead.loanAmount?.toLocaleString() || '0'}</div>
                <div>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                    ${lead.status === 'New' ? 'bg-blue-500/20 text-blue-400' : 
                      lead.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 
                      lead.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 
                      'bg-amber-500/20 text-amber-400'}`}
                  >
                    {lead.status}
                  </span>
                </div>
                <div className="text-right flex justify-end gap-2">
                  <button aria-label="Edit lead" title="Edit lead" onClick={() => setSelectedLeadId(lead.id)} className="p-1 hover:bg-white/5 rounded text-emerald-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button aria-label="Delete lead" title="Delete lead" onClick={() => handleDelete(lead.id)} className="p-1 hover:bg-white/5 rounded text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDetails({ lead, onBack }: { lead: any, onBack: () => void }) {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: lead.fullName || '',
    mobile: lead.mobile || '',
    email: lead.email || '',
    dob: lead.dob || '',
    fatherName: lead.fatherName || '',
    motherName: lead.motherName || '',
    currentAddress: lead.currentAddress || '',
    pincode: lead.pincode || '',
    company: lead.company || '',
    officeAddress: lead.officeAddress || '',
    officePincode: lead.officePincode || '',
    loanAmount: lead.loanAmount || 0,
  });

  // Keep editForm synced with the parent live subscription changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditForm({
      fullName: lead.fullName || '',
      mobile: lead.mobile || '',
      email: lead.email || '',
      dob: lead.dob || '',
      fatherName: lead.fatherName || '',
      motherName: lead.motherName || '',
      currentAddress: lead.currentAddress || '',
      pincode: lead.pincode || '',
      company: lead.company || '',
      officeAddress: lead.officeAddress || '',
      officePincode: lead.officePincode || '',
      loanAmount: lead.loanAmount || 0,
    });
  }, [lead]);

  const handleSaveChanges = async () => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        ...editForm,
        updatedAt: Date.now()
      });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leads/${lead.id}`);
    }
  };

  const handleSchedule = async () => {
    if (!followUpDate) return;
    setIsScheduling(true);
    setScheduleSuccess('');
    try {
      const startTime = new Date(followUpDate).toISOString();
      const endTime = new Date(new Date(followUpDate).getTime() + 60*60*1000).toISOString();
      
      let syncError = false;
      try {
        await createCalendarEvent(`Follow up: ${lead.fullName}`, `${followUpNotes}\nPhone: ${lead.mobile}`, startTime, endTime);
        await createGoogleTask(`Call ${lead.fullName}`, followUpNotes, startTime);
      } catch (error: any) {
        console.warn('Google Workspace sync failed:', error);
        syncError = true;
      }
      
      const newFollowUp = {
        userId: auth.currentUser?.uid,
        leadId: lead.id,
        leadName: lead.fullName,
        date: startTime,
        notes: followUpNotes,
        status: 'pending',
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'followUps'), newFollowUp);
      
      if (syncError) {
        setScheduleSuccess('Saved in Follow-ups (Google Workspace sync unavailable)');
      } else {
        setScheduleSuccess('Scheduled in Google Workspace & Follow-ups!');
      }
      setFollowUpDate('');
      setFollowUpNotes('');
    } catch (error: any) {
      alert(`Scheduling failed: ${error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', lead.id), { status: newStatus, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leads/${lead.id}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6 text-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white px-2 py-1 h-auto text-sm bg-white/5">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-2xl font-light text-white">Lead Sheet: <span className="font-medium">{lead.fullName}</span></h2>
        </div>
        <div className="flex gap-2 items-center">
          {isEditing ? (
            <>
              <Button onClick={handleSaveChanges} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded h-9">
                Save Details
              </Button>
              <Button onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs rounded h-9 border border-white/10">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded h-9">
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Details
            </Button>
          )}
          <Select value={lead.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121214] border-white/10 text-slate-200">
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Documents Pending">Documents Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2 pb-12">
        <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Personal Details</h3>
          <div className="grid grid-cols-2 gap-y-5 gap-x-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Full Name</label>
              {isEditing ? (
                <Input value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.fullName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">DOB</label>
              {isEditing ? (
                <Input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.dob || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Mobile</label>
              {isEditing ? (
                <Input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.mobile || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Father&apos;s Name</label>
              {isEditing ? (
                <Input value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.fatherName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Mother&apos;s Name</label>
              {isEditing ? (
                <Input value={editForm.motherName} onChange={e => setEditForm({...editForm, motherName: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.motherName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Email</label>
              {isEditing ? (
                <Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.email || '-'}</p>
              )}
            </div>
            <div className="col-span-2 text-xs border-t border-white/5 pt-4 mt-2 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Current Address</label>
                {isEditing ? (
                  <Input value={editForm.currentAddress} onChange={e => setEditForm({...editForm, currentAddress: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
                ) : (
                  <p className="text-slate-300 leading-relaxed italic">{lead.currentAddress || 'No address provided'}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Pincode</label>
                {isEditing ? (
                  <Input value={editForm.pincode} onChange={e => setEditForm({...editForm, pincode: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
                ) : (
                  <p className="text-slate-300 leading-relaxed italic">{lead.pincode || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5">Employment & Loan Info</h3>
          <div className="grid grid-cols-1 gap-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Company Name</label>
              {isEditing ? (
                <Input value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.company || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Office Address</label>
              {isEditing ? (
                <Input value={editForm.officeAddress} onChange={e => setEditForm({...editForm, officeAddress: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
              ) : (
                <p className="text-sm text-slate-300 font-medium">{lead.officeAddress || '-'}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Office Pincode</label>
                {isEditing ? (
                  <Input value={editForm.officePincode} onChange={e => setEditForm({...editForm, officePincode: e.target.value})} className="bg-black/20 border-white/10 text-slate-200 text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
                ) : (
                  <p className="text-sm text-slate-300 font-medium">{lead.officePincode || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Requested Loan (₹)</label>
                {isEditing ? (
                  <Input type="number" value={editForm.loanAmount} onChange={e => setEditForm({...editForm, loanAmount: Number(e.target.value)})} className="bg-black/20 border-white/10 text-emerald-400 font-mono text-sm h-9 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors" />
                ) : (
                  <p className="text-sm text-emerald-400 font-mono font-medium">₹{lead.loanAmount?.toLocaleString() || '0'}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-xl col-span-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-grotesk mb-5 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-emerald-500" />
            Schedule Follow-up
          </h3>
          <div className="space-y-5 max-w-md">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Date & Time</label>
              <Input 
                type="datetime-local" 
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="bg-black/20 border-white/10 text-slate-200 text-sm h-10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-widest font-grotesk">Meeting Notes / Agenda</label>
              <Input 
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                placeholder="Ask about salary slips..."
                className="bg-black/20 border-white/10 text-slate-200 text-sm h-10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
              />
            </div>
            <Button 
              onClick={handleSchedule} 
              disabled={isScheduling || !followUpDate} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm h-10 border-none mt-2"
            >
              {isScheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              Sync to Workspace Calendar
            </Button>
            {scheduleSuccess && (
              <div className="text-xs text-emerald-400 text-center mt-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                {scheduleSuccess}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
