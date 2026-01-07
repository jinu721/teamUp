import React, { useState, useEffect } from 'react';
import { JoinRequest, CommunityPost } from '@/types';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Clock, UserPlus, Inbox, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JoinRequestsPanelProps {
  post: CommunityPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestHandled?: () => void;
}

export const JoinRequestsPanel: React.FC<JoinRequestsPanelProps> = ({
  post,
  open,
  onOpenChange,
  onRequestHandled
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRequests();
    }
  }, [open, post._id]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await api.getJoinRequests(post._id);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load join requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(requestId);
    try {
      await api.respondToJoinRequest(post._id, requestId, status);
      setRequests(prev => prev.map(r =>
        r._id === requestId ? { ...r, status } : r
      ));
      toast({
        title: status === 'approved' ? 'Request Approved' : 'Request Rejected',
        description: status === 'approved'
          ? 'The user has been notified and added to your project'
          : 'The user has been notified',
      });
      onRequestHandled?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const handledRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </DialogTitle>
          <DialogDescription>
            Manage requests to join "{post.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No join requests yet</p>
            </div>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Pending ({pendingRequests.length})
                  </h4>
                  {pendingRequests.map((request) => (
                    <Card key={request._id} className="shadow-soft">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.user.profilePhoto} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {request.user.name ? request.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm">{request.user.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {request.message && (
                              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-xs text-muted-foreground flex items-start gap-1">
                                  <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  {request.message}
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => handleResponse(request._id, 'approved')}
                                disabled={processing === request._id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handleResponse(request._id, 'rejected')}
                                disabled={processing === request._id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Handled Requests */}
              {handledRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Previous ({handledRequests.length})
                  </h4>
                  {handledRequests.map((request) => (
                    <div key={request._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.user.profilePhoto} />
                        <AvatarFallback className="text-xs bg-muted">
                          {request.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{request.user.name}</p>
                      </div>
                      <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
