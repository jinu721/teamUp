import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const SocialCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            // We need to force a reload or notify auth context.
            // A hard reload is simplest to guarantee state sync.
            window.location.href = '/dashboard';
        } else {
            navigate('/login');
        }
    }, [token, refreshToken, navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Authenticating...</p>
            </div>
        </div>
    );
};

export default SocialCallback;
