export interface Review {
    id: string;
    authorName: string;
    authorPhotoUrl: string;
    rating: number;
    text: string;
    relativeTimeDescription: string;
    time: number;
    source: 'google' | 'facebook' | 'other';
    sentiment: 'positive' | 'neutral' | 'negative';
    isReplied: boolean;
    platformUrl?: string; // Link to the actual review on Google/FB
    reply?: {
        text: string;
        time: number;
        isAiGenerated?: boolean;
    };
}

export interface ReputationStats {
    averageRating: number;
    totalReviews: number;
    newReviewsThisMonth: number;
    ratingDistribution: Record<number, number>;
    averageResponseTime: string; // e.g. "2 hours"
    responseRate: number; // 0-100
}

export interface ReputationTrend {
    date: string;
    rating: number;
    count: number;
}

export interface ReviewInsight {
    label: string;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    type: 'strength' | 'opportunity';
}

export interface ReviewFilter {
    rating?: number | null;
    search?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    source?: 'google' | 'facebook' | null;
}
