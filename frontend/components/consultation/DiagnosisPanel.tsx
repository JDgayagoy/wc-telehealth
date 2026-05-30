'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Activity, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DiagnosisPanelProps {
    appointmentId: string;
    patientId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export function DiagnosisPanel({ appointmentId, patientId, onClose, onSaveSuccess }: DiagnosisPanelProps) {
    const [primary, setPrimary] = useState('');
    const [secondaries, setSecondaries] = useState<string[]>(['']);
    const [complaint, setComplaint] = useState('');
    const [notes, setNotes] = useState('');
    const [followUp, setFollowUp] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');

    const [submitting, setSubmitting] = useState(false);

    // Draft autosave effect (mock)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (primary || complaint || notes) {
                // In a real app, send a PATCH request to autosave draft.
                console.log('Draft autosaved');
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [primary, secondaries, complaint, notes, followUp, followUpDate]);

    const addSecondary = () => setSecondaries([...secondaries, '']);
    const updateSecondary = (index: number, val: string) => {
        const newArr = [...secondaries];
        newArr[index] = val;
        setSecondaries(newArr);
    };
    const removeSecondary = (index: number) => {
        if (secondaries.length > 1) {
            setSecondaries(secondaries.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        if (!primary.trim() || !complaint.trim()) {
            toast.error('Primary Diagnosis and Chief Complaint are required.'); return;
        }

        setSubmitting(true);
        try {
            const finalDiagnosis = [
                `Primary: ${primary}`,
                ...secondaries.filter(s => s.trim()).map(s => `Secondary: ${s}`)
            ].join('\n');

            const finalNotes = [
                `Chief Complaint: ${complaint}`,
                `Clinical Notes: ${notes}`,
                followUp ? `Follow-up Required: Yes (Date: ${followUpDate || 'Not specified'})` : ''
            ].filter(Boolean).join('\n\n');

            await axios.post(`/patients/by-appointment/${appointmentId}/medical-records`, {
                diagnosis: finalDiagnosis,
                treatment: 'See Clinical Notes', // Optional field in DB
                consultationNotes: finalNotes
            });

            toast.success('Diagnosis saved to EMR successfully');
            onSaveSuccess(); // notify parent
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Failed to save diagnosis');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b flex items-center gap-2 bg-blue-50 shrink-0">
                <Activity size={15} className="text-blue-600" />
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Clinical Diagnosis</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Primary Diagnosis *</label>
                    <Input placeholder="e.g. Acute Bronchitis" value={primary} onChange={e => setPrimary(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Secondary Diagnosis(es)</label>
                        <Button variant="ghost" size="sm" onClick={addSecondary} className="h-6 px-2 text-blue-600 hover:bg-blue-50">
                            <Plus size={12} className="mr-1" /> Add
                        </Button>
                    </div>
                    {secondaries.map((sec, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <Input placeholder="e.g. Hypertension" value={sec} onChange={e => updateSecondary(idx, e.target.value)} className="bg-gray-50" />
                            <Button variant="ghost" size="icon" onClick={() => removeSecondary(idx)} disabled={secondaries.length === 1} className="h-9 w-9 text-gray-400 hover:text-red-600">
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Chief Complaint *</label>
                    <Textarea placeholder="Describe the patient's symptoms..." value={complaint} onChange={e => setComplaint(e.target.value)} rows={3} className="resize-none" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Clinical Notes / Findings</label>
                    <Textarea placeholder="Additional observations..." value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="resize-none" />
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={followUp} onChange={e => setFollowUp(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        Follow-up Required
                    </label>
                    {followUp && (
                        <div className="mt-3">
                            <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full" />
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                    {submitting ? 'Saving...' : 'Finalize & Save to EMR'}
                </Button>
            </div>
        </div>
    );
}
