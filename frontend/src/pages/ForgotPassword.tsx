import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            await api.forgotPassword(email);
            setIsSuccess(true);
            toast({
                title: "Email Sent",
                description: "Password reset link has been sent to your email",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to send reset email",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
                <Card className="w-full max-w-md shadow-soft-lg border-0">
                    <CardHeader className="text-center pb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                        <CardDescription className="text-base">
                            We've sent a password reset link to <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">
                            Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild className="w-full">
                            <Link to="/login">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
            <div className="w-full max-w-md animate-fade-in">
                <Card className="shadow-soft-lg border-0">
                    <CardHeader className="space-y-1 pb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="absolute top-4 left-4 h-8 w-8 p-0"
                        >
                            <Link to="/login">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email address and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-11"
                                    autoComplete="email"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                Remember your password?{' '}
                                <Link to="/login" className="font-medium text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;