'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios'; // your configured axios instance
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Calendar, User } from 'lucide-react';

interface Doctor {
  id: string;
  profile: { firstName: string; lastName: string; profilePictureUrl?: string };
  doctorProfile: { specialization: string; bio: string; yearsOfExperience: number };
  consultationSlots: { id: string; startTime: string; endTime: string }[];
}

export default function DoctorDiscoveryPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendedSpecs, setRecommendedSpecs] = useState<string[]>([]);

  const fetchDoctors = async (specialization?: string) => {
    setLoading(true);
    try {
      const res = await axios.get('/doctors', {
        params: specialization ? { specialization } : {},
      });
      setDoctors(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleSearch = () => fetchDoctors(search);

  const handleAiRecommend = async () => {
    if (!symptoms.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post('/ai/recommend', { symptoms });
      setRecommendedSpecs(res.data.recommendedSpecializations);
      setDoctors(res.data.doctors);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Find a Doctor</h1>
        <p className="text-muted-foreground">Browse available doctors or describe your symptoms</p>
      </div>

      {/* AI Symptom Recommender */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-blue-700">
            <Sparkles size={18} />
            AI Doctor Recommendation
          </div>
          <Textarea
            placeholder="Describe your symptoms... (e.g. I've been having chest pain and shortness of breath)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAiRecommend} disabled={aiLoading} className="bg-blue-600 hover:bg-blue-700">
            {aiLoading ? 'Analyzing...' : 'Get AI Recommendations'}
          </Button>
          {recommendedSpecs.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Recommended:</span>
              {recommendedSpecs.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search by Specialization */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by specialization (e.g. Cardiologist)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} variant="outline">
          <Search size={16} className="mr-2" /> Search
        </Button>
        <Button variant="ghost" onClick={() => { setSearch(''); fetchDoctors(); }}>
          Clear
        </Button>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <p className="text-center text-muted-foreground">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p className="text-center text-muted-foreground">No doctors found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {doc.profile?.profilePictureUrl ? (
                      <img src={doc.profile.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      Dr. {doc.profile?.firstName} {doc.profile?.lastName}
                    </h3>
                    <Badge className="mt-1 text-xs">{doc.doctorProfile?.specialization}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {doc.doctorProfile?.yearsOfExperience} yrs experience
                    </p>
                    <p className="text-sm mt-2 line-clamp-2">{doc.doctorProfile?.bio}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-green-600 font-medium">
                        {doc.consultationSlots?.length ?? 0} slots available
                      </span>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/patient/doctors/${doc.id}/book`)}
                        disabled={!doc.consultationSlots?.length}
                      >
                        <Calendar size={14} className="mr-1" />
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
