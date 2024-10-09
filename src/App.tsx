// src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.scss";
import { toast } from "react-toastify";
import { Job } from "./types";
import Message from "./components/Message";
import MinSpentInput from "./components/MinSpentInput";
import ControlPanel from "./components/ControlPanel";
import Header from "./components/Header";
import {
  clickPerPage,
  clickNextPage,
  clickPreviousPage,
  highlightJobs,
  scrapeJobs,
  fetchJobDetails,
  loopViewMore,
  processComments,
  clickBackButton,
} from "./services/chromeActions";
import { submitDetailedJob } from "./services/api";

function App() {
  const [minSpent, setMinSpent] = useState<number>(50);
  const [scrapingMessage, setScrapingMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const messageListener = async (message: any, sender: any, sendResponse: any) => {
      try {
        if (message.type === "JOB_DETAILS_FETCHED") {
          await handleJobDetailsFetched(message.jobData);
        }
        if (message.type === "FETCH_JOB_DETAILS") {
          await handleFetchJobDetails();
        }
        if (message.type === "CLOSE_POPUP") {
          await clickBackButton();
        }
        sendResponse({ success: true }); // Respond after all async tasks finish
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        sendResponse({ success: false, error: errorMessage });
      }
    };

    chrome?.runtime?.onMessage?.addListener(messageListener);

    return () => {
      chrome?.runtime?.onMessage?.removeListener(messageListener);
    };
  }, []);

  const handleJobDetailsFetched = async (jobData: any) => {
    try {
      const response = await submitDetailedJob(jobData);
      if (response?.success) {
        toast.success(response?.message);
        await processComments(setMessage, setNote);
      } else {
        toast.error(response?.message);
      }
    } catch (error: any) {
      console.error("Error occurred while sending the request:", error);
      toast.error(error?.message || "An error occurred. Please try again.");
    }
  };

  const handleHighlightJobs = async () => {
    await highlightJobs(minSpent);
  };

  const handleScrapeJobs = async () => {
    setScrapingMessage("Scraping in progress...");
    const jobs = await scrapeJobs(minSpent);
    setScrapingMessage(null);
  };

  const handleFetchJobDetails = async () => {
    await fetchJobDetails();
  };

  return (
    <>
      <Header />
      <div className="card bg-white shadow-md p-2 rounded">
        {scrapingMessage && <Message message={scrapingMessage} />}
        {message && <Message message={message} />}
        {note && <Message message={note} />}
        <MinSpentInput minSpent={minSpent} setMinSpent={setMinSpent} />
        <ControlPanel
          onHighlightJobs={handleHighlightJobs}
          onScrapeJobs={handleScrapeJobs}
          onFetchJobDetails={handleFetchJobDetails}
          onClickPerPage={clickPerPage}
          onLoopViewMore={loopViewMore}
          onClickNextPage={clickNextPage}
          onClickPreviousPage={clickPreviousPage}
        />
      </div>
    </>
  );
}

export default App;
