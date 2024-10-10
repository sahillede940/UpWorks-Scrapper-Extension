// src/services/chromeActions.ts
import { toast } from "react-toastify";
import { Job, CommentData } from "../types";
import { submitDetailedJob, submitComments } from "./api";

// Utility function to execute a script in the current active tab
export const executeChromeScript = async (func: (...args: any[]) => void, args: any[] = []): Promise<any> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id! },
        func,
        args,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(results[0]?.result);
        }
      }
    );
  });
};

// Function to click '50 jobs per page'
export const clickPerPage = async () => {
  await executeChromeScript(() => {
    document.querySelector("div[data-test='jobs_per_page UpCDropdown'] > div")?.dispatchEvent(new Event("click"));
    setTimeout(() => {
      document.querySelector(".air3-dropdown-menu > div > ul > li:last-child")?.dispatchEvent(new Event("click"));
    }, 1000);
  });
};

// Function to click 'Next Page' button
export const clickNextPage = async () => {
  await executeChromeScript(() => {
    document.querySelector('button[data-ev-label="pagination_next_page"]')?.dispatchEvent(new Event("click"));
  });
};

// Function to click 'Previous Page' button
export const clickPreviousPage = async () => {
  await executeChromeScript(() => {
    document.querySelector('button[data-ev-label="pagination_prev_page"]')?.dispatchEvent(new Event("click"));
  });
};

export const clickBackButton = async () => {
  console.log("Clicking back button");

  await executeChromeScript(() => {
    document.querySelector('button[data-ev-label="slider_close"]')?.dispatchEvent(new Event("click"));
  });
};

// Function to highlight jobs based on minSpent
export const highlightJobs = async (minSpent: number) => {
  await executeChromeScript(
    (minSpent: number) => {
      const jobArticles = document.querySelectorAll("article.job-tile");

      const convertStringToInt = (value: string): number => {
        let sanitizedValue = value.replace("$", "").replace("+", "");
        if (sanitizedValue.includes("K")) {
          sanitizedValue = sanitizedValue.replace("K", "");
          return parseFloat(sanitizedValue) * 1000;
        }
        return parseFloat(sanitizedValue);
      };

      jobArticles.forEach((jobArticle) => {
        const totalSpentElement = jobArticle.querySelector('li[data-test="total-spent"] > div > strong');
        let total_spent_text = totalSpentElement?.textContent?.trim() || "";
        const total_spent = convertStringToInt(total_spent_text);
        const jobArticleElement = jobArticle as HTMLElement;

        if (total_spent >= minSpent) {
          jobArticleElement.style.backgroundColor = "rgb(220 255 224)"; // Light green
        } else {
          jobArticleElement.style.backgroundColor = "rgb(255 218 218)"; // Light red
        }
      });
    },
    [minSpent]
  );
};

// Function to scrape jobs
export const scrapeJobs = async (minSpent: number): Promise<Job[]> => {
  const jobs: Job[] = [];

  await executeChromeScript(
    async (minSpent: number) => {
      const jobArticles = document.querySelectorAll("article.job-tile");

      const convertStringToInt = (value: string): number => {
        let sanitizedValue = value.replace("$", "").replace("+", "");
        if (sanitizedValue.includes("K")) {
          sanitizedValue = sanitizedValue.replace("K", "");
          return parseFloat(sanitizedValue) * 1000;
        } else if (sanitizedValue.includes("M")) {
          sanitizedValue = sanitizedValue.replace("M", "");
          return parseFloat(sanitizedValue) * 1000000;
        } else if (sanitizedValue.includes("B")) {
          sanitizedValue = sanitizedValue.replace("B", "");
          return parseFloat(sanitizedValue) * 1000000000;
        }
        return parseFloat(sanitizedValue);
      };

      const sendMessagePromise = (message: object): Promise<any> => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      };

      for (const jobArticle of jobArticles) {
        const title = jobArticle.querySelector("div.job-tile-header > div > div > div > h2 > a")?.textContent || "";
        const totalSpentElement = jobArticle.querySelector('li[data-test="total-spent"] > div > strong');
        let total_spent_text = totalSpentElement?.textContent?.trim() || "";
        const total_spent = convertStringToInt(total_spent_text);
        const jobArticleElement = jobArticle as HTMLElement;

        if (total_spent >= minSpent) {
          jobArticleElement.style.backgroundColor = "rgb(220 255 224)"; // Light green
        } else {
          jobArticleElement.style.backgroundColor = "rgb(255 218 218)"; // Light red
        }

        if (total_spent < minSpent) {
          continue; // Skip jobs that don't meet the minSpent criteria
        }

        // Click on the job to open details
        jobArticle.dispatchEvent(new Event("click"));

        // Wait for the details to load
        await new Promise((resolve) => setTimeout(resolve, 4000));

        // Fetch job details using the new promise-wrapped sendMessage
        await sendMessagePromise({ type: "FETCH_JOB_DETAILS" });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // await sendMessagePromise({ type: "CLOSE_POPUP" });
      }
    },
    [minSpent]
  );

  // Collect stored jobs from background script or other storage
  // Assuming jobs are stored in a global variable or via chrome.storage
  return jobs;
};

// Function to fetch job details
export const fetchJobDetails = async () => {
  await loopViewMore();

  await executeChromeScript(async () => {
    const popupElement = document.querySelector("div.air3-slider-content");
    const jobTitle = popupElement?.querySelector("h4")?.textContent?.trim() || "";
    const jobDescription = popupElement?.querySelector('div[data-test="Description"]')?.textContent?.trim() || "";

    // Determine job type and pricing details
    const isHourlyJob = Array.from(popupElement?.querySelectorAll("ul.features") || []).some((feature) =>
      feature?.querySelector("div.description")?.textContent?.includes("Hourly")
    );

    const budgetElements = Array.from(document.querySelectorAll('div[data-test="BudgetAmount"]'));
    const priceRange = isHourlyJob ? budgetElements.map((el) => el?.textContent?.trim()).join(" - ") || "" : "";
    const fixedPrice = isHourlyJob
      ? ""
      : popupElement?.querySelector('div[data-test="BudgetAmount"]')?.textContent?.trim() || "";

    const pricingDetails = {
      type: isHourlyJob ? "Hourly" : "Fixed",
      fixedPrice: fixedPrice,
      priceRange: priceRange,
    };

    // Fetch skills
    const skillElements = popupElement?.querySelectorAll('div.skills-list > span[data-test="Skill"]') || [];
    const jobSkills = Array.from(skillElements).map((skill) => skill.textContent?.trim() || "");

    // Check if payment is verified
    const isPaymentVerified =
      (popupElement
        ?.querySelector(
          'div[data-test="about-client-container AboutClientUserShared AboutClientUser"] > div > div > .text-caption'
        )
        ?.textContent?.trim() || "") === "Payment method verified";

    // Fetch location and job ID
    const clientLocation =
      (popupElement?.querySelector('li[data-qa="client-location"] > div > span:first-child')?.textContent?.trim() ||
        "") +
      ", " +
      (popupElement?.querySelector('li[data-qa="client-location"] > strong')?.textContent?.trim() || "");

    const url = popupElement?.querySelector('a[data-test="slider-open-in-new-window UpLink"]') as HTMLAnchorElement;

    function getJobIdFromUrl(url: string): string | null {
      // Use a regular expression to match the pattern and extract the ID
      const match = url.match(/\/jobs\/~(\d+)\?/);
      return match ? match[1] : null;
    }

    const jobUrl = url?.href || "";
    const jobId = getJobIdFromUrl(jobUrl) || "";

    const rating = popupElement
      ?.querySelector('div[data-testid="buyer-rating"] .air3-rating-value-text')
      ?.textContent?.trim();

    const sendMessagePromise = (message: object): Promise<any> => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    };

    // Send job data back to background or content script
    await sendMessagePromise({
      type: "JOB_DETAILS_FETCHED",
      jobData: {
        title: jobTitle,
        description: jobDescription,
        skills: jobSkills,
        pricing_details: pricingDetails,
        client_location: clientLocation,
        is_payment_verified: isPaymentVerified,
        job_url: jobUrl,
        job_id: jobId,
        rating: rating,
      },
    });
  });
};

// Function to loop and click 'View More' buttons
export const loopViewMore = async () => {
  await executeChromeScript(async () => {
    let btn = document
      .querySelector(`div.air3-slider-content`)
      ?.querySelector('section[data-cy="jobs"] > footer > span > a');

    while (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
      btn.dispatchEvent(new Event("click"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      btn = document
        .querySelector(`div.air3-slider-content`)
        ?.querySelector('section[data-cy="jobs"] > footer > span > a');
    }
  });
};

// Function to get comments and related data
export const getComments = async (): Promise<{ job_id: string; comments: CommentData[] }> => {
  const result = await executeChromeScript(async () => {
    let extraJobs_temp = document
      .querySelector("div.extra-jobs-cards")
      ?.querySelectorAll('section[data-cy="jobs"] > div[data-cy="job"]');

    Array.from(extraJobs_temp || []).map((job) => {
      const commentContainers = job.querySelectorAll("div.main > .text-body-sm") as NodeListOf<HTMLElement>;
      commentContainers?.forEach((container) => {
        let containerElement = container as HTMLElement;
        containerElement
          ?.querySelector('span[data-test="UpCTruncation"] > span > button[aria-expanded="false"]')
          ?.dispatchEvent(new Event("click"));
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const extraJobs = document
      .querySelector("div.extra-jobs-cards")
      ?.querySelectorAll('section[data-cy="jobs"] > div[data-cy="job"]');

    const url = document.querySelector('a[data-test="slider-open-in-new-window UpLink"]') as HTMLAnchorElement;

    function getJobIdFromUrl(url: string): string | null {
      const match = url.match(/\/jobs\/~([a-zA-Z0-9]+)\b/);
      return match ? match[1] : null;
    }

    const job_id = getJobIdFromUrl(url.href) || "";

    const data = Array.from(extraJobs || []).map((job) => {
      const jobTitle = job.querySelector('span[data-test="JobLink"]')?.textContent?.trim() || "";
      const jobAnchor = job.querySelector('span[data-test="JobLink"] > a') as HTMLAnchorElement;
      const url = jobAnchor?.href || "";
      const commentContainers = job.querySelectorAll("div.main > .text-body-sm") as NodeListOf<HTMLElement>;

      let clientComment = "";
      let freelancerComment = "";

      commentContainers?.forEach((container) => {
        let containerElement = container as HTMLElement;

        if (containerElement?.innerText?.includes("To freelancer:")) {
          clientComment = containerElement.querySelector('span[data-test="UpCTruncation"] span')?.textContent || "";
        } else {
          freelancerComment = containerElement.querySelector('span[data-test="UpCTruncation"] span')?.textContent || "";
        }
      });

      const billedAmount = job.querySelector('div[data-cy="stats"] > span > span')?.textContent?.trim() || "";
      // const rating = job.querySelector('div[data-cy="stats"] > span > strong > span')?.textContent?.trim() || "";
      const rating = job.querySelector("div.air3-rating-value-text")?.textContent?.trim();

      return {
        jobTitle,
        clientComment,
        freelancerComment,
        url,
        billedAmount,
        rating: parseFloat(rating || "0"),
        job_id: getJobIdFromUrl(url) || "",
      };
    });

    return {
      comments: data,
      job_id: job_id,
    };
  });

  return result;
};

// Function to scrape description from a URL

interface CommentJobData {
  description: string;
  postedOn: string;
}

export const scrapeDescriptionFromUrl = async (url: string): Promise<CommentJobData> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      const tabId = tab.id;

      if (tabId === undefined) {
        return reject(new Error("Failed to create tab"));
      }

      const onTabUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(onTabUpdated);

          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: () => {
                const descriptionElement = document.querySelector('div[data-test="Description"]') as HTMLElement;
                const postedOn = document.querySelector('div[data-test="PostedOn"]') as HTMLElement;
                return {
                  description: descriptionElement?.textContent?.trim() || "",
                  postedOn: postedOn?.textContent?.trim()?.replace("\n", " ") || "",
                };
              },
            },
            (results) => {
              if (chrome.runtime.lastError) {
                console.error("Script injection failed: ", chrome.runtime.lastError.message);
                chrome.tabs.remove(tabId!);
                return reject(new Error(chrome.runtime.lastError.message));
              }

              const { description, postedOn } = results[0]?.result || {};

              chrome.tabs.remove(tabId!);
              resolve({ description, postedOn } as CommentJobData);
            }
          );
        }
      };

      chrome.tabs.onUpdated.addListener(onTabUpdated);
    });
  });
};

export const processComments = async (
  setMessage: (msg: string | null) => void,
  setNote: (msg: string | null) => void
) => {
  const { comments, job_id } = await getComments();

  const totalComments = comments.length;
  let currentCommentIndex = 0;

  for (const comment of comments) {
    currentCommentIndex++;
    setMessage(`Scraping Comment: ${currentCommentIndex} / ${totalComments}`);
    if (comment.url) {
      try {
        const commentJobData = (await scrapeDescriptionFromUrl(comment.url)) as CommentJobData;
        comment.description = commentJobData.description;
        comment.postedOn = commentJobData.postedOn;
      } catch (error) {
        console.error(`Error scraping description for URL ${comment.url}:`, error);
        comment.description = "";
      }
    }
  }
  console.log("Comments:", comments);

  const commentsData = comments.map((comment) => ({
    job: job_id,
    client_feedback: comment.clientComment,
    freelancer_feedback: comment.freelancerComment,
    url: comment.url,
    rating: comment.rating,
    billed_amount: comment.billedAmount,
    job_title: comment.jobTitle,
    description: comment.description,
    posted_on: comment.postedOn,
  }));

  try {
    setMessage("Submitting Comments...");
    const res = await submitComments(job_id, commentsData);
    toast.success(res?.message);
    setMessage(null);
    setNote("Comments Scraped Successfully");
    setTimeout(() => {
      setNote(null);
    }, 5000);
  } catch (error: any) {
    console.error("Error submitting comments:", error);
  }
};
