'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    firstName: z.string(),
    lastName: z.string(),
    contactNumber: z.string(),
    birthday: z.coerce.date(),
    role: z.enum(['PATIENT', 'DOCTOR']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
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
            await axios.post('http://localhost:3001/auth/register', data);

            alert('Account created successfully');

            router.push('/login');
        } catch (error) {
            console.error('Account creation failed', error);
            alert('Account creation failed');
        }
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Register</h1>
                        <p className="text-muted-foreground">
                            Create your telehealth account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Input
                                placeholder="Email"
                                type="email"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="First name"
                                type="text"
                                {...register('firstName')}
                            />

                            {errors.firstName && (
                                <p className="text-sm text-red-500">
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Last name"
                                type="text"
                                {...register('lastName')}
                            />

                            {errors.lastName && (
                                <p className="text-sm text-red-500">
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Contact Number"
                                type="text"
                                {...register('contactNumber')}
                            />

                            {errors.contactNumber && (
                                <p className="text-sm text-red-500">
                                    {errors.contactNumber.message}
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
                                <p className="text-sm text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Birthday"
                                type="date"
                                {...register('birthday')}
                            />
                            {errors.birthday && (
                                <p className="text-sm text-red-500">
                                    {errors.birthday.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <select
                                className="w-full border rounded-md p-2"
                                {...register('role')}
                            >
                                <option value="PATIENT">Patient</option>
                                <option value="DOCTOR">Doctor</option>
                            </select>

                            {errors.role && (
                                <p className="text-sm text-red-500">
                                    {errors.role.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating account...' : 'Register'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Are you a doctor? <Link href="/register/doctor" className="text-blue-600 hover:underline">Register here</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}