'use client';

import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    selectedDate: Date;
}

export function AddScheduleModal({ open, onOpenChange, onSuccess, selectedDate }: AddScheduleModalProps) {
    const [scheduleDate, setScheduleDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
    const [timeRanges, setTimeRanges] = useState([{ startTime: '09:00', endTime: '17:00' }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setScheduleDate(format(selectedDate, 'yyyy-MM-dd'));
    }, [open, selectedDate]);

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
        if (!scheduleDate) {
            toast.error('Please select a date.');
            return;
        }
        if (timeRanges.some(r => !r.startTime || !r.endTime || r.startTime >= r.endTime)) {
            toast.error('Please ensure all time ranges have valid start and end times (Start < End).');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/schedules/custom', {
                timeRanges: timeRanges.map(range => ({
                    ...range,
                    startDateTime: new Date(`${scheduleDate}T${range.startTime}:00`).toISOString(),
                    endDateTime: new Date(`${scheduleDate}T${range.endTime}:00`).toISOString(),
                })),
            });
            onSuccess();
            onOpenChange(false);
            setTimeRanges([{ startTime: '09:00', endTime: '17:00' }]);
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
                        Define exact availability slots for the selected calendar date.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-900 block">Select Date</label>
                        <Input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-900">Select Time Range(s)</label>
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
                                                step="900"
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
                                                step="900"
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
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || !scheduleDate} className="bg-emerald-600 hover:bg-emerald-700">
                        {submitting ? 'Saving...' : 'Save Schedule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
