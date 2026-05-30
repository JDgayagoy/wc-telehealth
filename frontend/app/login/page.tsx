'use client';

import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await axios.post('/auth/login', data);
            localStorage.setItem('access_token', response.data.access_token);
            if (response.data.user.role === 'DOCTOR') {
                router.push('/dashboard/doctor');
            } else {
                router.push('/dashboard/patient');
            }
        } catch (error: any) {
            const msg: string = error.response?.data?.message ?? '';
            if (msg === 'User not found') {
                toast.error('No account found with this email address.');
            } else if (msg === 'Invalid Password') {
                toast.error('Incorrect password. Please try again.');
            } else {
                toast.error('Sign in failed. Please check your credentials.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-sky-50 flex items-center justify-center p-4">
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
                        <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
                        <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email address
                            </label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                className="rounded-xl h-11"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="rounded-xl h-11"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        New to Telehealth?{' '}
                        <Link href="/register" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
