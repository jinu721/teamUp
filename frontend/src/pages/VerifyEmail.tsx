import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';
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
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-card/50 backdrop-blur-xl animate-in zoom-in duration-500">
                    <CardHeader className="text-center pb-6 pt-10">
                        <div className="flex justify-center mb-6">
                            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Verified!</CardTitle>
                        <CardDescription className="text-lg mt-2 font-medium text-muted-foreground">
                            Welcome to the team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center px-8 pb-10">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                            <p className="text-sm text-primary/80">Redirecting you to your dashboard...</p>
                        </div>
                        <Button onClick={() => window.location.href = '/dashboard'} className="w-full h-12 text-base group rounded-xl shadow-lg shadow-primary/20">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/register')}
                        className="mb-4 hover:bg-background/50 rounded-full text-muted-foreground group"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Change email
                    </Button>
                    <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                        <KeyRound className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight pt-4">Enter Passcode</h1>
                    <p className="text-muted-foreground">
                        We've sent a 6-digit code to <br />
                        <span className="font-semibold text-foreground underline decoration-primary/30 decoration-2 underline-offset-4">{email}</span>
                    </p>
                </div>

                <Card className="shadow-2xl border-0 bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-white/10">
                    <CardContent className="pt-10 px-6 sm:px-10">
                        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-8">
                            <div className="flex justify-between gap-2 sm:gap-4">
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
                                            "w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none",
                                            digit
                                                ? "border-primary bg-primary/5 shadow-inner"
                                                : "border-muted-foreground/20 bg-background/50 focus:border-primary/50"
                                        )}
                                        disabled={status === 'verifying'}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {status === 'error' && (
                                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center animate-in shake-2 duration-300">
                                    <div className="flex items-center justify-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        <span>{message}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 text-base font-bold rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                disabled={status === 'verifying' || otp.some(d => !d)}
                            >
                                {status === 'verifying' ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Verifying Security Code...
                                    </>
                                ) : (
                                    'Secure Login'
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-6 pb-10 pt-4 border-t border-white/5 bg-muted/5 mt-6 px-6 sm:px-10">
                        <div className="w-full flex flex-col items-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Haven't received the code?
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResend}
                                disabled={resending || countdown > 0}
                                className="w-full h-12 bg-background/50 border-white/10 hover:border-primary/50 rounded-xl transition-all"
                            >
                                {resending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className={cn("h-4 w-4 mr-2", countdown > 0 && "animate-spin-slow")} />
                                )}
                                {countdown > 0 ? `Resend available in ${countdown}s` : 'Resend Code'}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-muted-foreground px-10 leading-relaxed">
                    By verifying your email, you help us keep your account and your team's project data secure.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;