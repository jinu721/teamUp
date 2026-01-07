import React, { useState } from 'react';
import { 
  CommunityPost, 
  PROJECT_CATEGORY_LABELS, 
  COMMITMENT_TYPE_LABELS 
} from '@/types';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageCircle, 
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onEdit?: (post: CommunityPost) => void;
  onDelete?: (postId: string) => void;
  onClick?: (post: CommunityPost) => void;
  onVoteUpdate?: (postId: string, updates: { upvoteCount: number; downvoteCount: number; voteScore: number; userVote?: 'upvote' | 'downvote' | null }) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onEdit,
  onDelete,
  onClick,
  onVoteUpdate
}) => {
  const [voting, setVoting] = useState(false);
  const [joining, setJoining] = useState(false);
  // Local optimistic state for votes
  const [optimisticVote, setOptimisticVote] = useState<{
    upvoteCount: number;
    downvoteCount: number;
    voteScore: number;
    userVote: 'upvote' | 'downvote' | null;
  } | null>(null);
  const { toast } = useToast();

  const isOwner = currentUserId === post.owner._id;
  
  // Use optimistic state if available, otherwise use post data
  const displayUpvoteCount = optimisticVote?.upvoteCount ?? post.upvoteCount;
  const displayDownvoteCount = optimisticVote?.downvoteCount ?? post.downvoteCount;
  const displayVoteScore = optimisticVote?.voteScore ?? post.voteScore;
  const userVote = optimisticVote?.userVote !== undefined 
    ? optimisticVote.userVote 
    : post.votes.find(v => v.userId === currentUserId)?.voteType || null;

  const handleVote = async (type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (voting) return;

    // Calculate optimistic update
    const currentUserVote = userVote;
    const voteType = type === 'up' ? 'upvote' : 'downvote';
    
    let newUpvoteCount = displayUpvoteCount;
    let newDownvoteCount = displayDownvoteCount;
    let newUserVote: 'upvote' | 'downvote' | null = voteType;

    if (currentUserVote === voteType) {
      // Toggle off - remove vote
      if (voteType === 'upvote') {
        newUpvoteCount--;
      } else {
        newDownvoteCount--;
      }
      newUserVote = null;
    } else if (currentUserVote === null) {
      // New vote
      if (voteType === 'upvote') {
        newUpvoteCount++;
      } else {
        newDownvoteCount++;
      }
    } else {
      // Change vote
      if (voteType === 'upvote') {
        newUpvoteCount++;
        newDownvoteCount--;
      } else {
        newDownvoteCount++;
        newUpvoteCount--;
      }
    }

    const newVoteScore = newUpvoteCount - newDownvoteCount;

    // Apply optimistic update immediately
    const optimisticState = {
      upvoteCount: newUpvoteCount,
      downvoteCount: newDownvoteCount,
      voteScore: newVoteScore,
      userVote: newUserVote
    };
    setOptimisticVote(optimisticState);
    
    // Notify parent of optimistic update
    onVoteUpdate?.(post._id, optimisticState);

    setVoting(true);
    try {
      if (type === 'up') {
        await api.upvotePost(post._id);
      } else {
        await api.downvotePost(post._id);
      }
      // Success - clear optimistic state (server will send real update via WebSocket)
      setOptimisticVote(null);
    } catch (error: any) {
      // Rollback optimistic update on error
      setOptimisticVote(null);
      onVoteUpdate?.(post._id, {
        upvoteCount: post.upvoteCount,
        downvoteCount: post.downvoteCount,
        voteScore: post.voteScore,
        userVote: post.votes.find(v => v.userId === currentUserId)?.voteType || null
      });
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to vote',
        variant: 'destructive',
      });
    } finally {
      setVoting(false);
    }
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joining || isOwner) return;

    setJoining(true);
    try {
      await api.requestToJoin(post._id);
      toast({
        title: 'Request sent',
        description: 'Your join request has been sent to the project owner',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send request',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(post);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.deleteCommunityPost(post._id);
      onDelete?.(post._id);
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card 
      className={cn("flex flex-col transition-shadow hover:shadow-md", onClick && "cursor-pointer")}
      onClick={() => onClick?.(post)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.owner.profilePhoto} />
              <AvatarFallback>
                {post.owner.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{post.owner.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2 mt-2">{post.title}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{PROJECT_CATEGORY_LABELS[post.category]}</Badge>
          <Badge variant="outline">{COMMITMENT_TYPE_LABELS[post.commitmentType]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-0">
        <CardDescription className="line-clamp-3">{post.description}</CardDescription>
        {post.requiredSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">Skills needed:</p>
            <div className="flex flex-wrap gap-1">
              {post.requiredSkills.slice(0, 4).map((skill: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
              ))}
              {post.requiredSkills.length > 4 && (
                <Badge variant="outline" className="text-xs">+{post.requiredSkills.length - 4}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote('up', e)}
            disabled={voting}
            className={cn("h-8 w-8 p-0", userVote === 'upvote' && "text-green-500")}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span className={cn(
            'text-sm font-medium min-w-[2rem] text-center',
            displayVoteScore > 0 && 'text-green-500',
            displayVoteScore < 0 && 'text-red-500'
          )}>
            {displayVoteScore}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote('down', e)}
            disabled={voting}
            className={cn("h-8 w-8 p-0", userVote === 'downvote' && "text-red-500")}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 ml-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {post.comments.length}
          </div>
        </div>
        {!isOwner && (
          <Button size="sm" onClick={handleJoin} disabled={joining}>
            <UserPlus className="mr-1 h-4 w-4" />
            {joining ? 'Sending...' : 'Join'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
