// src/types/index.ts
export type JobDetails =
  | {
      job_type: "Fixed price";
      experience_level: string;
      fixed_price: string;
      duration: null;
    }
  | {
      job_type: "Hourly";
      experience_level: string;
      pricing: string;
      duration: string;
    };

export interface Job {
  total_spent: number;
  title: string;
  // ...other properties
}

export interface CommentData {
  jobTitle: string;
  clientComment: string;
  freelancerComment: string;
  url: string;
  billedAmount: string;
  rating: number;
  job_id: string;
  description?: string;
  postedOn: string;
}
