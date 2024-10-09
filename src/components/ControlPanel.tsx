// src/components/ControlPanel.tsx
import React from "react";

interface ControlPanelProps {
  onHighlightJobs: () => void;
  onScrapeJobs: () => void;
  onFetchJobDetails: () => void;
  onClickPerPage: () => void;
  onLoopViewMore: () => void;
  onClickNextPage: () => void;
  onClickPreviousPage: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onHighlightJobs,
  onScrapeJobs,
  onFetchJobDetails,
  onClickPerPage,
  onLoopViewMore,
  onClickNextPage,
  onClickPreviousPage,
}) => (
  <div>
    <button onClick={onHighlightJobs} className="btn btn-primary mb-2">
      Highlight Jobs
    </button>
    <button onClick={onLoopViewMore} className="btn btn-secondary mb-2">
      Loop View More
    </button>
    <button onClick={onFetchJobDetails} className="btn btn-success mb-2">
      Get Detailed Job
    </button>
    <button onClick={onScrapeJobs} className="btn btn-info mb-2">
      A-Z Scrape Jobs
    </button>
    <button onClick={onClickPerPage} className="btn btn-warning mb-2">
      Apply 50 Jobs Per Page
    </button>
    <div className="flex space-x-2">
      <button onClick={onClickPreviousPage} className="btn btn-danger mb-2">
        Prev
      </button>
      <button onClick={onClickNextPage} className="btn btn-dark mb-2">
        Next
      </button>
    </div>
  </div>
);

export default ControlPanel;
