import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteDetails {
  type?: 'project' | 'workshop';
  project: {
    _id: string;
    title: string;
    description: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  email: string;
  expiresAt: string;
}

const InviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const response = await api.getInvitationDetails(token);
        setInvite(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'This invitation is invalid or has expired');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await api.acceptInvitation(token);
      setSuccess(true);
      toast({
        title: 'Welcome to the team!',
        description: response.message || 'You have successfully joined the project',
      });

      setTimeout(() => {
        const path = invite?.type === 'workshop' ? 'workshops' : 'projects';
        navigate(`/${path}/${invite?.project._id}`);
      }, 2000);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined "{invite?.project.title}"
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the project...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user needs to login/register
  const emailMismatch = isAuthenticated && user?.email?.toLowerCase() !== invite?.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a project on TeamUp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">{invite?.project.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {invite?.project.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Invited by <span className="font-medium">{invite?.invitedBy.name}</span>
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Please login or create an account with <span className="font-medium">{invite?.email}</span> to accept this invitation.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate(`/login?redirect=/invite/${token}`)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
                <Button variant="outline" onClick={() => navigate(`/register?redirect=/invite/${token}&email=${invite?.email}`)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
              </div>
            </div>
          ) : emailMismatch ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  This invitation was sent to <span className="font-medium">{invite?.email}</span>,
                  but you're logged in as <span className="font-medium">{user?.email}</span>.
                </p>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Please login with the correct email to accept this invitation.
              </p>
              <Button variant="outline" onClick={() => navigate(`/login?redirect=/invite/${token}`)} className="w-full">
                Login with Different Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Click below to join the project and start collaborating!
              </p>
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting ? 'Joining...' : 'Accept Invitation'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="w-full">
                Decline
              </Button>
            </div>
          )}

          {/* Expiry notice */}
          <p className="text-xs text-center text-muted-foreground">
            This invitation expires on {new Date(invite?.expiresAt || '').toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;