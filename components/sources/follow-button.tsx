'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';

interface FollowButtonProps {
  sourceId: string;
}

export function FollowButton({ sourceId }: FollowButtonProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkFollowStatus() {
      if (!isSignedIn || !isLoaded) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`/api/follows/check?sourceId=${sourceId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    }

    checkFollowStatus();
  }, [sourceId, isSignedIn, isLoaded]);

  const handleFollowToggle = async () => {
    setIsLoading(true);

    try {
      if (isFollowing) {
        const response = await fetch(`/api/follows?sourceId=${sourceId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to unfollow');
        }

        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId }),
        });

        if (!response.ok) {
          throw new Error('Failed to follow');
        }

        setIsFollowing(true);
        toast.success('Following successfully');
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <Button variant="outline" disabled>
        <Heart className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>
          <Heart className="mr-2 h-4 w-4" />
          Follow
        </Button>
      </SignInButton>
    );
  }

  if (isCheckingStatus) {
    return (
      <Button variant="outline" disabled>
        <Heart className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      <Heart
        className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`}
      />
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
