'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PrescriptionPanelProps {
    appointmentId: string;
    patientId: string;
    onClose: () => void;
}

export function PrescriptionPanel({ appointmentId, patientId, onClose }: PrescriptionPanelProps) {
    const [rxList, setRxList] = useState([{ medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const [submitting, setSubmitting] = useState(false);
    const [existing, setExisting] = useState<any[]>([]);

    useEffect(() => {
        // We could fetch existing prescriptions if needed
    }, []);

    const addRxRow = () => setRxList([...rxList, { medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    const removeRxRow = (index: number) => {
        if (rxList.length > 1) {
            setRxList(rxList.filter((_, i) => i !== index));
        }
    };
    const updateRxRow = (index: number, field: string, value: string) => {
        const newList = [...rxList];
        newList[index] = { ...newList[index], [field]: value };
        setRxList(newList);
    };

    const handleSubmit = async () => {
        const isValid = rxList.every(rx => rx.medication.trim() && rx.dosage.trim());
        if (!isValid) { toast.error('Medication Name and Dosage are required for all entries.'); return; }

        setSubmitting(true);
        try {
            const dtos = rxList.map(rx => ({
                patientId,
                appointmentId,
                medication: rx.medication,
                dosage: rx.dosage,
                instructions: [
                    rx.frequency ? `Frequency: ${rx.frequency}` : '',
                    rx.duration ? `Duration: ${rx.duration}` : '',
                    rx.notes ? `Notes: ${rx.notes}` : ''
                ].filter(Boolean).join(' | ') || 'No additional instructions'
            }));

            await axios.post('/prescriptions/batch', dtos);
            toast.success('Prescriptions added successfully');
            setRxList([{ medication: '', dosage: '', frequency: '', duration: '', notes: '' }]);
            onClose(); // Optional: close panel on success
        } catch (e) {
            console.error(e);
            toast.error('Failed to add prescriptions');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b flex items-center gap-2 bg-purple-50 shrink-0">
                <Pill size={15} className="text-purple-600" />
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Write Prescription</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={addRxRow} className="h-8 text-purple-600 border-purple-200 hover:bg-purple-50">
                        <Plus size={14} className="mr-1" /> Add More
                    </Button>
                </div>
                {rxList.map((rx, idx) => (
                    <div key={idx} className="relative p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescription {idx + 1} of {rxList.length}</span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2"
                                onClick={() => removeRxRow(idx)}
                                disabled={rxList.length === 1}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Medication Name *" value={rx.medication} onChange={e => updateRxRow(idx, 'medication', e.target.value)} className="bg-gray-50" />
                            <Input placeholder="Dosage (e.g. 500mg) *" value={rx.dosage} onChange={e => updateRxRow(idx, 'dosage', e.target.value)} className="bg-gray-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Frequency" value={rx.frequency} onChange={e => updateRxRow(idx, 'frequency', e.target.value)} className="bg-gray-50 text-sm" />
                            <Input placeholder="Duration" value={rx.duration} onChange={e => updateRxRow(idx, 'duration', e.target.value)} className="bg-gray-50 text-sm" />
                        </div>
                        <Textarea placeholder="Notes / Instructions" value={rx.notes} onChange={e => updateRxRow(idx, 'notes', e.target.value)} rows={2} className="bg-gray-50 text-sm resize-none" />
                    </div>
                ))}
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700">
                    {submitting ? 'Saving...' : 'Submit Prescriptions'}
                </Button>
            </div>
        </div>
    );
}
