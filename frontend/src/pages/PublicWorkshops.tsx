import React, { useEffect, useState, useCallback } from 'react';
import {
    SortOrder,
    ProjectCategory,
    PROJECT_CATEGORY_LABELS
} from '@/types';
import { Workshop, WorkshopVisibility, MembershipState } from '@/types/workshop';
import api from '@/services/api';
// import socketService from '@/services/socket'; // Socket service needs update for workshops
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowUp,
    ArrowDown,
    UserPlus,
    Sparkles,
    Search,
    Filter,
    TrendingUp,
    Clock,
    Flame,
    Globe,
    Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const PublicWorkshops: React.FC = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEW);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | undefined>();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    const loadWorkshops = useCallback(async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setPage(1);
            } else {
                setLoadingMore(true);
            }

            const currentPage = reset ? 1 : page;
            const response = await api.getPublicWorkshops(
                {
                    search: searchQuery || undefined,
                    category: categoryFilter,
                    sort: sortOrder
                },
                currentPage,
                20
            );

            if (reset) {
                setWorkshops(response.data);
            } else {
                setWorkshops(prev => [...prev, ...response.data]);
            }
            setHasMore(response.data.length === 20); // Simple pagination check
        } catch (error) {
            console.error('Failed to load workshops:', error);
            toast({
                title: 'Error',
                description: 'Failed to load public workshops',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchQuery, categoryFilter, sortOrder, page, toast]);

    useEffect(() => {
        loadWorkshops(true);
    }, [sortOrder, categoryFilter]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadWorkshops(true); };
    const loadMore = () => { if (!loadingMore && hasMore) { setPage(prev => prev + 1); loadWorkshops(false); } };

    const handleCreateWorkshop = () => {
        // Navigate to create workshop page or open modal
        // For now, assume a route exists
        navigate('/workshops?create=true');
    };

    const handleVote = async (workshopId: string, type: 'up' | 'down') => {
        // Optimistic update
        const workshop = workshops.find(w => w._id === workshopId);
        if (!workshop) return;

        // Logic for optimistic update is complex without full user vote state in frontend types
        // So we'll just call API and reload for now, or implement simple state toggle
        try {
            if (type === 'up') await api.upvoteWorkshop(workshopId);
            else await api.downvoteWorkshop(workshopId);

            // Refresh just this item ideally, but for now strict reload or we accept a slight delay
            // To keep it simple and correct:
            const updated = await api.getWorkshopById(workshopId);
            if (updated.success && updated.data) {
                setWorkshops(prev => prev.map(w => w._id === workshopId ? updated.data : w));
            }
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to vote', variant: 'destructive' });
        }
    };

    const handleJoinRequest = async (workshopId: string) => {
        try {
            const response = await api.requestToJoinWorkshop(workshopId);
            toast({ title: 'Request sent', description: response.data.state === MembershipState.ACTIVE ? 'You have joined the workshop' : 'Your join request has been sent' });

            // Update local state to reflect requested status
            if (response.success && response.data) {
                setWorkshops(prev => prev.map(w =>
                    w._id === workshopId
                        ? {
                            ...w,
                            currentUserMembership: {
                                state: response.data.state,
                                source: response.data.source,
                                joinedAt: response.data.joinedAt
                            }
                        }
                        : w
                ));
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to join', variant: 'destructive' });
        }
    };

    const getSortIcon = (sort: SortOrder) => {
        switch (sort) {
            case SortOrder.NEW: return <Clock className="h-4 w-4" />;
            case SortOrder.TOP: return <TrendingUp className="h-4 w-4" />;
            case SortOrder.TRENDING: return <Flame className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    if (loading && page === 1) {
        return (
            <AppLayout>
                <div className="page-container">
                    <Skeleton className="h-12 w-full max-w-md" />
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (<Skeleton key={i} className="h-72" />))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="page-container">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div className="section-header mb-0">
                        <h1 className="section-title flex items-center gap-2">
                            <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                            Public Workshops
                        </h1>
                        <p className="section-description">Discover and join open workshops</p>
                    </div>
                    <Button onClick={handleCreateWorkshop}><Sparkles className="mr-2 h-4 w-4" />Create Workshop</Button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search workshops..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
                        </div>
                        <Button type="submit" variant="secondary" className="h-11">Search</Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <Select value={sortOrder} onValueChange={(v: string) => setSortOrder(v as SortOrder)}>
                            <SelectTrigger className="w-full sm:w-[140px] h-10">{getSortIcon(sortOrder)}<SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SortOrder.NEW}>New</SelectItem>
                                <SelectItem value={SortOrder.TOP}>Top</SelectItem>
                                <SelectItem value={SortOrder.TRENDING}>Trending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter || 'all'} onValueChange={(v: string) => setCategoryFilter(v === 'all' ? undefined : v as ProjectCategory)}>
                            <SelectTrigger className="w-full sm:w-[160px] h-10"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grid */}
                {workshops.length === 0 ? (
                    <Card className="shadow-soft">
                        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4"><Globe className="h-8 w-8 text-muted-foreground" /></div>
                            <h3 className="text-lg font-semibold mb-2">No workshops found</h3>
                            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">Try adjusting your filters or search query</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {workshops.map(workshop => (
                                <Card key={workshop._id} className="flex flex-col shadow-soft hover:shadow-soft-lg transition-shadow duration-200">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start gap-3 mb-2">
                                            <Avatar className="h-10 w-10 ring-2 ring-background">
                                                {/* Assuming populate owner works, if not we handle it safely */}
                                                <AvatarImage src={(workshop as any).owner?.profilePhoto} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                                    {(workshop as any).owner?.name?.substr(0, 2).toUpperCase() || 'OW'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{(workshop as any).owner?.name || 'Unknown Owner'}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(workshop.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <CardTitle className="text-base sm:text-lg line-clamp-2">{workshop.name}</CardTitle>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {workshop.category ? PROJECT_CATEGORY_LABELS[workshop.category] : 'Uncategorized'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs capitalize">{workshop.visibility}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3 pt-0">
                                        <CardDescription className="line-clamp-3 text-sm">{workshop.description}</CardDescription>
                                        {workshop.requiredSkills && workshop.requiredSkills.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium mb-2 text-muted-foreground">Skills needed:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {workshop.requiredSkills.slice(0, 4).map((skill: string, idx: number) => (
                                                        <Badge key={idx} variant="outline" className="text-xs bg-muted/50">{skill}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between border-t pt-4">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleVote(workshop._id, 'up')} className={cn("h-8 w-8 p-0 hover:bg-success/10", (workshop.voteScore || 0) > 0 && "text-success")} aria-label="Upvote">
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <span className={cn('text-sm font-semibold min-w-[2rem] text-center tabular-nums', (workshop.voteScore || 0) > 0 && 'text-success', (workshop.voteScore || 0) < 0 && 'text-destructive')}>
                                                {workshop.voteScore || 0}
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => handleVote(workshop._id, 'down')} className={cn("h-8 w-8 p-0 hover:bg-destructive/10", (workshop.voteScore || 0) < 0 && "text-destructive")} aria-label="Downvote">
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {(workshop as any).owner?._id !== user?._id && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleJoinRequest(workshop._id)}
                                                className="h-8"
                                                variant={workshop.currentUserMembership?.state === MembershipState.ACTIVE ? "outline" : "default"}
                                                disabled={workshop.currentUserMembership?.state === MembershipState.PENDING || workshop.currentUserMembership?.state === MembershipState.ACTIVE}
                                            >
                                                {workshop.currentUserMembership?.state === MembershipState.PENDING ? (
                                                    'Requested'
                                                ) : workshop.currentUserMembership?.state === MembershipState.ACTIVE ? (
                                                    'Joined'
                                                ) : (
                                                    <>
                                                        <UserPlus className="mr-1 h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Join</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="min-w-[120px]">{loadingMore ? 'Loading...' : 'Load More'}</Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout >
    );
};

export default PublicWorkshops;
