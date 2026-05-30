'use client';

import { toast } from 'sonner';
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
    email: z.email(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    birthday: z.string().min(1, 'Birthday is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function DoctorRegisterPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema) as any,
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            await axios.post('/auth/register', { ...data, role: 'DOCTOR' });
            toast.success('Doctor account created successfully');
            router.push('/login');
        } catch (error: any) {
            const msg = error.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Registration failed. Please try again.'));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-sky-50 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-600 rounded-2xl shadow-md mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </div>
                    <p className="text-xs font-semibold text-cyan-600 tracking-widest uppercase">WC Telehealth</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-slate-800">Doctor Registration</h1>
                        <p className="text-slate-500 text-sm mt-1">Join as a medical professional</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">First name</label>
                                <Input placeholder="John" className="rounded-xl h-11" {...register('firstName')} />
                                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
                                <Input placeholder="Doe" className="rounded-xl h-11" {...register('lastName')} />
                                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                            <Input type="email" placeholder="doctor@example.com" className="rounded-xl h-11" {...register('email')} />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <Input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="rounded-xl h-11" {...register('password')} />
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact number</label>
                                <Input placeholder="+63 9XX XXX XXXX" className="rounded-xl h-11" {...register('contactNumber')} />
                                {errors.contactNumber && <p className="mt-1 text-xs text-red-500">{errors.contactNumber.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Birthday</label>
                                <Input type="date" className="rounded-xl h-11" {...register('birthday')} />
                                {errors.birthday && <p className="mt-1 text-xs text-red-500">{errors.birthday.message}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                        >
                            {isSubmitting ? 'Creating account...' : 'Register as Doctor'}
                        </button>
                    </form>

                    <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
                        <p>
                            Already have an account?{' '}
                            <Link href="/login" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
                                Sign in
                            </Link>
                        </p>
                        <p>
                            Registering as a patient?{' '}
                            <Link href="/register" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
                                Patient registration
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


