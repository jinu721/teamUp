import { useState, useEffect, useCallback, useRef } from 'react';
import { CommunityPost, PostFilters, SortOrder } from '@/types';
import api from '@/services/api';
import { useSocketEvent, useCommunityRoom } from './useSocket';

interface UseCommunityPostsOptions {
  filters?: PostFilters;
  sort?: SortOrder;
  limit?: number;
}

interface UseCommunityPostsReturn {
  posts: CommunityPost[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refetch: () => void;
  updatePost: (post: CommunityPost) => void;
  removePost: (postId: string) => void;
}

export function useCommunityPosts(options: UseCommunityPostsOptions = {}): UseCommunityPostsReturn {
  const { filters = {}, sort = SortOrder.NEW, limit = 20 } = options;
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  const filtersRef = useRef(filters);
  const sortRef = useRef(sort);

  // Join community room for real-time updates
  useCommunityRoom();

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await api.getCommunityPosts(
        filtersRef.current,
        sortRef.current,
        pageNum,
        limit
      );

      if (reset) {
        setPosts(response.data);
      } else {
        setPosts(prev => {
          // Deduplicate posts
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = response.data.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(response.pagination.hasMore);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit]);

  // Initial load and when filters/sort change
  useEffect(() => {
    filtersRef.current = filters;
    sortRef.current = sort;
    setPage(1);
    fetchPosts(1, true);
  }, [JSON.stringify(filters), sort, fetchPosts]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, false);
    }
  }, [loadingMore, hasMore, page, fetchPosts]);

  // Refetch
  const refetch = useCallback(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Update a single post
  const updatePost = useCallback((updatedPost: CommunityPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  }, []);

  // Remove a post
  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  }, []);

  // Socket event handlers
  useSocketEvent('community:post:created', (post: CommunityPost) => {
    // Add new post at the beginning if sorting by new
    if (sortRef.current === SortOrder.NEW) {
      setPosts(prev => [post, ...prev]);
      setTotal(prev => prev + 1);
    }
  });

  useSocketEvent('community:post:updated', (post: CommunityPost) => {
    updatePost(post);
  });

  useSocketEvent('community:post:deleted', (data: { postId: string }) => {
    removePost(data.postId);
    setTotal(prev => Math.max(0, prev - 1));
  });

  useSocketEvent('community:post:voted', (data: { 
    postId: string; 
    upvoteCount: number; 
    downvoteCount: number; 
    voteScore: number 
  }) => {
    setPosts(prev => prev.map(p => 
      p._id === data.postId 
        ? { ...p, upvoteCount: data.upvoteCount, downvoteCount: data.downvoteCount, voteScore: data.voteScore }
        : p
    ));
  });

  useSocketEvent('community:post:commented', (data: { postId: string; comment: any }) => {
    setPosts(prev => prev.map(p => 
      p._id === data.postId 
        ? { ...p, comments: [...p.comments, data.comment] }
        : p
    ));
  });

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refetch,
    updatePost,
    removePost
  };
}
