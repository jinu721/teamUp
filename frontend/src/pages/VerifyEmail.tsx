import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowRight, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();
    const { toast } = useToast();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            toast({
                title: "Error",
                description: "No email address provided for verification.",
                variant: "destructive"
            });
            navigate('/register');
        }
    }, [email, navigate, toast]);

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter the 6-digit verification code.",
                variant: "destructive"
            });
            return;
        }

        setStatus('verifying');
        try {
            const response = await api.verifyOTP(email, otpString);
            localStorage.setItem('token', response.data.token);
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            setStatus('success');
            toast({
                title: "Email Verified",
                description: "Your account has been successfully verified!",
            });

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (error: any) {
            setStatus('error');
            const errMsg = error.response?.data?.message || 'Verification failed. Please check the code and try again.';
            setMessage(errMsg);
            toast({
                title: "Verification Failed",
                description: errMsg,
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        if (otp.every(digit => digit !== '') && status === 'idle') {
            handleVerify();
        }
    }, [otp]);

    const handleResend = async () => {
        setResending(true);
        try {
            await api.resendOTP(email);
            toast({
                title: "Code Sent",
                description: "A new verification code has been sent to your email.",
            });
            setCountdown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setStatus('idle');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to resend code.",
                variant: "destructive"
            });
        } finally {
            setResending(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified</h1>
                    <p className="text-gray-500 text-lg mb-8">Your account has been successfully verified</p>
                    <button 
                        onClick={() => window.location.href = '/dashboard'} 
                        className="w-full h-14 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
                    >
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <button
                        onClick={() => navigate('/register')}
                        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Verify your email
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Enter the 6-digit code sent to
                    </p>
                    <p className="text-gray-900 font-semibold text-lg mt-1">
                        {email}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-8">
                        <div className="flex justify-between gap-4">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={cn(
                                        "w-14 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none bg-white",
                                        digit
                                            ? "border-black"
                                            : "border-gray-200 focus:border-gray-400"
                                    )}
                                    disabled={status === 'verifying'}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-50 rounded-xl p-4">
                                <div className="flex items-center gap-3 text-red-600">
                                    <XCircle className="w-5 h-5" />
                                    <p className="font-medium">{message}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-14 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={status === 'verifying' || otp.some(d => !d)}
                        >
                            {status === 'verifying' ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </div>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-gray-500 mb-4">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resending || countdown > 0}
                            className="text-black font-semibold hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resending ? (
                                'Sending...'
                            ) : countdown > 0 ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend code'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;