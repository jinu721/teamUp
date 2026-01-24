import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
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
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h1>
                    <p className="text-gray-500 text-lg mb-2">
                        We've sent a password reset link to
                    </p>
                    <p className="text-gray-900 font-semibold text-lg mb-8">{email}</p>
                    <p className="text-gray-500 mb-8">
                        Click the link in the email to reset your password. The link will expire in 1 hour.
                    </p>
                    <Link 
                        to="/login"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <Link
                        to="/login"
                        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-gray-400 outline-none transition-colors bg-white"
                                placeholder="Enter your email address"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending Reset Link...
                                </div>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500">
                            Remember your password?{' '}
                            <Link to="/login" className="text-black font-semibold hover:text-gray-600 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;