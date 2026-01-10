import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/services/api';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.verifyEmail(token);
                // Store token and user
                localStorage.setItem('token', response.data.token);
                // We could also set user in context if we had access to the setter, 
                // but simpler is to redirect to dashboard which will fetch profile or 
                // redirect to login with a success message.
                // Since api.verifyEmail returns token, we effectively logged them in.

                // However, AuthProvider initializes from localStorage on mount. 
                // It might need a refresh to pick it up if we are already mounted?
                // Actually, since we are navigating, a full reload or just navigating to dashboard 
                // where the AuthProvider checks token might trigger? 
                // AuthProvider enables 'isAuthenticated' if user is set. 
                // It fetches profile on mount if token exists. 
                // We should probably redirect to a page that forces a refresh or 
                // just rely on the user manually logging in if the context doesn't auto-update.
                // But for "Automatic", let's try to reload the page to dashboard.

                setStatus('success');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. Token might be invalid or expired.');
            }
        };

        verify();
    }, [token]);

    const handleContinue = () => {
        if (status === 'success') {
            // Force a reload to ensure AuthContext picks up the new token
            window.location.href = '/dashboard';
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
            <Card className="w-full max-w-md shadow-soft-lg border-0">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {status === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                        {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                        {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
                    </div>
                    <CardTitle className="text-2xl">
                        {status === 'verifying' && 'Verifying Email...'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'verifying' && 'Please wait while we verify your email address.'}
                        {status === 'success' && 'Your account has been successfully verified.'}
                        {status === 'error' && message}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    {status !== 'verifying' && (
                        <Button onClick={handleContinue} className="w-full max-w-xs">
                            {status === 'success' ? 'Continue to Dashboard' : 'Back to Login'}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
