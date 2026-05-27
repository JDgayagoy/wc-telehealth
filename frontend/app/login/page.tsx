'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
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
            console.log('Login attempt with:', data);
            const response = await axios.post('http://localhost:3001/auth/login', data);

            localStorage.setItem('access_token', response.data.access_token);

            console.log('API Response:', response.data);
            alert('Login Successfully');

            if (response.data.user.role === 'DOCTOR') {
                router.push('/dashboard/doctor')
            } else {
                router.push('/dashboard/patient')
            }
        } catch (error: any) {
            console.log(error.response?.data);
        }
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">
                            Login
                        </h1>

                        <p className="text-muted-foreground">
                            Welcome back to Telehealth
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <Input
                                placeholder="Email"
                                type="email"
                                {...register('email')}
                            />

                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Password"
                                type="password"
                                {...register('password')}
                            />

                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}