'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 0 },
];

interface AddScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddScheduleModal({ open, onOpenChange, onSuccess }: AddScheduleModalProps) {
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [timeRanges, setTimeRanges] = useState([{ startTime: '09:00', endTime: '17:00' }]);
    const [repeat, setRepeat] = useState<'none' | 'weekly' | 'custom'>('none');
    const [endDate, setEndDate] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const toggleDay = (dayValue: number) => {
        if (selectedDays.includes(dayValue)) {
            setSelectedDays(selectedDays.filter(d => d !== dayValue));
        } else {
            setSelectedDays([...selectedDays, dayValue]);
        }
    };

    const addTimeRange = () => {
        setTimeRanges([...timeRanges, { startTime: '09:00', endTime: '17:00' }]);
    };

    const updateTimeRange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newRanges = [...timeRanges];
        newRanges[index][field] = value;
        setTimeRanges(newRanges);
    };

    const removeTimeRange = (index: number) => {
        if (timeRanges.length > 1) {
            setTimeRanges(timeRanges.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        if (selectedDays.length === 0) {
            toast.error('Please select at least one day.');
            return;
        }
        if (timeRanges.some(r => !r.startTime || !r.endTime || r.startTime >= r.endTime)) {
            toast.error('Please ensure all time ranges have valid start and end times (Start < End).');
            return;
        }
        if (repeat === 'custom' && !endDate) {
            toast.error('Please select an end date for custom repetition.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/schedules/custom', {
                days: selectedDays,
                timeRanges,
                repeat,
                endDate: repeat === 'custom' ? endDate : undefined
            });
            onSuccess();
            onOpenChange(false);
            // Reset state
            setSelectedDays([]);
            setTimeRanges([{ startTime: '09:00', endTime: '17:00' }]);
            setRepeat('none');
            setEndDate('');
        } catch (e) {
            console.error(e);
            toast.error('Failed to save schedule');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Add New Schedule</DialogTitle>
                    <DialogDescription>
                        Define your availability slots. You can select multiple days and time ranges.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Select Days */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-900 block">① Select Day(s)</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                        selectedDays.includes(day.value)
                                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Select Time Ranges */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-900">② Select Time Range(s)</label>
                            <Button type="button" variant="ghost" size="sm" onClick={addTimeRange} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2">
                                <Plus size={14} className="mr-1" /> Add Time Slot
                            </Button>
                        </div>
                        
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {timeRanges.map((range, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Clock size={14} className="text-gray-400" />
                                            </div>
                                            <Input 
                                                type="time" 
                                                value={range.startTime}
                                                onChange={(e) => updateTimeRange(idx, 'startTime', e.target.value)}
                                                className="pl-9 h-9" 
                                                step="1800"
                                            />
                                        </div>
                                        <span className="text-gray-400 font-medium text-sm">to</span>
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Clock size={14} className="text-gray-400" />
                                            </div>
                                            <Input 
                                                type="time" 
                                                value={range.endTime}
                                                onChange={(e) => updateTimeRange(idx, 'endTime', e.target.value)}
                                                className="pl-9 h-9" 
                                                step="1800"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeTimeRange(idx)}
                                        disabled={timeRanges.length === 1}
                                        className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-900 block">③ Repeat Schedule</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setRepeat('none')}
                                className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${
                                    repeat === 'none' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                This week only
                            </button>
                            <button
                                type="button"
                                onClick={() => setRepeat('weekly')}
                                className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${
                                    repeat === 'weekly' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Weekly (Indefinite)
                            </button>
                            <button
                                type="button"
                                onClick={() => setRepeat('custom')}
                                className={`px-3 py-2 text-sm rounded-lg border text-center transition-colors ${
                                    repeat === 'custom' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Custom Range
                            </button>
                        </div>
                        
                        {repeat === 'custom' && (
                            <div className="mt-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">End Date:</span>
                                <Input 
                                    type="date" 
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="h-9 bg-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || selectedDays.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                        {submitting ? 'Saving...' : 'Save Schedule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
