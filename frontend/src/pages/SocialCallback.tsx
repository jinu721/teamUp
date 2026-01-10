import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const SocialCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // We need to force a reload or notify auth context.
            // A hard reload is simplest to guarantee state sync.
            // Or navigate to dashboard and let it pick up? 
            // AuthContext reads localStorage on mount. 
            // If checking "if (storedToken)" inside effect is only once on mount...
            // A reload is safer.
            window.location.href = '/dashboard';
        } else {
            navigate('/login');
        }
    }, [token, navigate]);

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
