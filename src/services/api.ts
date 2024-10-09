// src/services/api.ts
import axios from "axios";
import { API_URL } from "../constants";
import { Job, CommentData } from "../types";

// Function to submit jobs


// Function to submit detailed job data
export const submitDetailedJob = async (jobData: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/detailed_jobs/`, {
      job: jobData,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "An error occurred while submitting detailed job");
  }
};

// Function to submit comments
export const submitComments = async (job_id: string, commentsData: any[]) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/comments/`, {
      job_id: job_id,
      comments: commentsData,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "An error occurred while submitting comments");
  }
};
