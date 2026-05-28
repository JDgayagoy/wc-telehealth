'use client';

import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    birthday: z.coerce.date(),
    specialization: z.string().min(1, "Specialization is required"),
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    yearsOfExperience: z.coerce.number().min(0, "Years of experience must be positive"),
    licenseNumber: z.string().min(1, "License number is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function DoctorRegisterPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            // Append the DOCTOR role to the data before sending
            const payload = { ...data, role: 'DOCTOR' };
            await axios.post('http://localhost:3001/auth/register', payload);

            alert('Doctor account created successfully');
            router.push('/login');
        } catch (error: any) {
            console.error('Account creation failed', error);
            alert(error.response?.data?.message || 'Account creation failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 py-10">
            <Card className="w-full max-w-2xl">
                <CardContent className="p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold">Doctor Registration</h1>
                        <p className="text-muted-foreground mt-2">
                            Join Telehealth as a medical professional
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold border-b pb-2">Personal Details</h2>
                                
                                <div>
                                    <Input placeholder="First name" {...register('firstName')} />
                                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>}
                                </div>

                                <div>
                                    <Input placeholder="Last name" {...register('lastName')} />
                                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>}
                                </div>

                                <div>
                                    <Input placeholder="Contact Number" {...register('contactNumber')} />
                                    {errors.contactNumber && <p className="text-sm text-red-500 mt-1">{errors.contactNumber.message}</p>}
                                </div>

                                <div>
                                    <Input type="date" placeholder="Birthday" {...register('birthday')} />
                                    {errors.birthday && <p className="text-sm text-red-500 mt-1">{errors.birthday.message}</p>}
                                </div>
                            </div>

                            {/* Account & Professional Details */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold border-b pb-2">Professional Details</h2>
                                
                                <div>
                                    <Input type="email" placeholder="Email Address" {...register('email')} />
                                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <Input type="password" placeholder="Password" {...register('password')} />
                                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                                </div>

                                <div>
                                    <Input placeholder="Specialization (e.g. Cardiologist)" {...register('specialization')} />
                                    {errors.specialization && <p className="text-sm text-red-500 mt-1">{errors.specialization.message}</p>}
                                </div>

                                <div>
                                    <Input type="number" placeholder="Years of Experience" {...register('yearsOfExperience')} />
                                    {errors.yearsOfExperience && <p className="text-sm text-red-500 mt-1">{errors.yearsOfExperience.message}</p>}
                                </div>

                                <div>
                                    <Input placeholder="Medical License Number" {...register('licenseNumber')} />
                                    {errors.licenseNumber && <p className="text-sm text-red-500 mt-1">{errors.licenseNumber.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Textarea placeholder="Professional Bio (describe your experience and background...)" {...register('bio')} rows={4} />
                            {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>}
                        </div>

                        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                            {isSubmitting ? 'Registering Account...' : 'Register as Doctor'}
                        </Button>
                        
                        <div className="text-center text-sm text-muted-foreground mt-4">
                            Are you a patient? <Link href="/register" className="text-blue-600 hover:underline">Register here</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
