// import { useState, useEffect } from "react";
// import "./App.scss";
// import axios from "axios";
// import { URL } from "./constants.ts";
// import { toast } from "react-toastify";

// type JobDetails =
//   | {
//       job_type: "Fixed price";
//       experience_level: string;
//       fixed_price: string;
//       duration: null;
//     }
//   | {
//       job_type: "Hourly";
//       experience_level: string;
//       pricing: string;
//       duration: string;
//     };

// interface Job {
//   total_spent: number;
//   title: string;
//   // job_id: string;
//   // posted_time: string;
//   // payment_verified: boolean;
//   // location: string;
//   // rating?: number | null;
//   // job_type?: JobDetails;
//   // description?: string | null;
//   // skills: string[];
//   // proposals: {
//   //   total: number;
//   //   active: number;
//   // };
// }

// interface CommentData {
//   jobTitle: string;
//   clientComment: string;
//   freelancerComment: string;
//   url: string;
//   billedAmount: string;
//   rate: string;
//   job_id: string;
//   description?: string;
// }

// const Message = ({ message }: { message: string }) => {
//   return (
//     <div className="bg-white">
//       {/* <h2 className="text-lg text-gray-800">Total Scraped Jobs: {jobs.length}</h2> */}
//       {message && (
//         <h4 className="text-gray-800 bg-gray-100 border-blue-500 px-2 rounded shadow-md flex items-center space-x-2 mb-2">
//           <svg
//             className="animate-spin h-4 w-4 me-2 text-blue-600"
//             xmlns="http://www.w3.org/2000/svg"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
//           </svg>
//           {message}
//         </h4>
//       )}
//     </div>
//   );
// };

// function App() {
//   const [minSpent, setMinSpent] = useState<number>(50);
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [curJob, setCurJob] = useState<number>(0);
//   const [scrapingMessage, setScrapingMessage] = useState<string | null>(null);
//   const [message, setMessage] = useState<string | null>(null);
//   const [note, setNote] = useState<string | null>(null);
//   const [scrapOnlyMinSpent, setScrapOnlyMinSpent] = useState<boolean>(true);
//   const [noOfJobs, setNoOfJobs] = useState<number>(10);
//   const [count, setCount] = useState<number>(0);

//   const clickPerPage = async () => {
//     // document.querySelector('.air3-dropdown-menu > div > ul > li:last-child').click();
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id! },
//         func: async () => {
//           document.querySelector("div[data-test='jobs_per_page UpCDropdown'] > div")?.dispatchEvent(new Event("click"));
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//           document.querySelector(".air3-dropdown-menu > div > ul > li:last-child")?.dispatchEvent(new Event("click"));
//         },
//       },
//       () => {
//         console.log("Clicked");
//       }
//     );
//   };

//   const clickNextPage = async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id! },
//         func: async () => {
//           document.querySelector('button[data-ev-label="pagination_next_page"]')?.dispatchEvent(new Event("click"));
//         },
//       },
//       () => {
//         console.log("Clicked");
//       }
//     );
//   };

//   const clickPreviousPage = async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id! },
//         func: async () => {
//           document.querySelector('button[data-ev-label="pagination_prev_page"]')?.dispatchEvent(new Event("click"));
//         },
//       },
//       () => {
//         console.log("Clicked");
//       }
//     );
//   };

//   const clickJob = async (selector: string) => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     chrome.scripting.executeScript<string[], void>(
//       {
//         target: { tabId: tab.id! },
//         args: [selector],
//         func: (selector: string): void => {
//           console.log("Selector:", selector);

//           const jobElement = document.querySelector(`article[data-ev-job-uid='${selector}']`);
//           if (jobElement) {
//             jobElement.dispatchEvent(new Event("click"));
//             console.log("Clicked the job element successfully.");
//           } else {
//             console.error("Job element not found with selector:", selector);
//           }
//         },
//       },
//       () => {
//         console.log("Clicked the job element successfully.");
//       }
//     );
//   };

//   const onclickJob = async (scrapData: boolean = false) => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id! },
//         args: [minSpent, scrapData],
//         func: async (minSpent: number, scrapData: boolean) => {
//           let jobArticles = document.querySelectorAll("article.job-tile");
//           let jobs = [] as Job[];

//           const fetchJobDetailsFromBackground = async () => {
//             return new Promise((resolve) => {
//               chrome.runtime.sendMessage({ type: "FETCH_JOB_DETAILS" }, (response) => {
//                 resolve(response);
//               });
//             });
//           };

//           function convertStringToInt(value: string): number {
//             let sanitizedValue = value.replace("$", "").replace("+", "");
//             if (sanitizedValue.includes("K")) {
//               sanitizedValue = sanitizedValue.replace("K", "");
//               return parseFloat(sanitizedValue) * 1000;
//             }
//             return parseFloat(sanitizedValue);
//           }
//           let i = 0;
//           for (const jobArticle of jobArticles) {
//             const title = jobArticle.querySelector("div.job-tile-header > div > div > div > h2 > a")?.textContent || "";
//             let total_spent =
//               jobArticle.querySelector('li[data-test="total-spent"] > div > strong')?.textContent?.trim() || "";
//             let JobArticle = jobArticle as HTMLElement;

//             if (convertStringToInt(total_spent) >= minSpent) {
//               JobArticle.style.backgroundColor = "rgb(220 255 224)";
//             } else {
//               JobArticle.style.backgroundColor = "rgb(255 218 218)";
//             }

//             if (!scrapData) {
//               continue;
//             }

//             if (convertStringToInt(total_spent) < minSpent) {
//               continue;
//             }
//             i++;
//             chrome.runtime.sendMessage({
//               type: "CURRENT_JOB",
//               count: i,
//             });

//             jobArticle.dispatchEvent(new Event("click"));
//             await new Promise((resolve) => setTimeout(resolve, 4000));

//             await fetchJobDetailsFromBackground();

//             jobs.push({
//               title,
//               total_spent: convertStringToInt(total_spent),
//             });
//           }
//           return jobs;
//         },
//       },
//       () => {}
//     );
//   };

//   const loopedClickOnViewMore = async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     return new Promise((resolve) => {
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: tab.id! },
//           func: async () => {
//             let btn = document
//               .querySelector(`div.air3-slider-content`)
//               ?.querySelector('section[data-cy="jobs"] > footer > span > a');

//             while (btn) {
//               btn.scrollIntoView({ behavior: "smooth", block: "center" });
//               btn.dispatchEvent(new Event("click"));
//               await new Promise((resolve) => setTimeout(resolve, 1000));
//               btn = document
//                 .querySelector(`div.air3-slider-content`)
//                 ?.querySelector('section[data-cy="jobs"] > footer > span > a');
//             }
//           },
//         },
//         resolve
//       );
//     });
//   };

//   const fetchJobDetails = async () => {
//     const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     setScrapingMessage("Scraping in progress " + curJob);

//     await loopedClickOnViewMore();

//     chrome.scripting.executeScript(
//       {
//         target: { tabId: activeTab.id! },
//         func: () => {
//           const popupElement = document.querySelector("div.air3-slider-content");
//           const jobTitle = popupElement?.querySelector("h4")?.textContent?.trim() || "";
//           const jobDescription = popupElement?.querySelector('div[data-test="Description"]')?.textContent?.trim() || "";

//           // Determine job type and pricing details
//           const isHourlyJob = Array.from(popupElement?.querySelectorAll("ul.features") || []).some((feature) =>
//             feature?.querySelector("div.description")?.textContent?.includes("Hourly")
//           );

//           const budgetElements = Array.from(document.querySelectorAll('div[data-test="BudgetAmount"]'));
//           const priceRange = isHourlyJob ? budgetElements.map((el) => el?.textContent?.trim()).join(" - ") || "" : "";
//           const fixedPrice = isHourlyJob
//             ? ""
//             : popupElement?.querySelector('div[data-test="BudgetAmount"]')?.textContent?.trim() || "";

//           const pricingDetails = {
//             type: isHourlyJob ? "Hourly" : "Fixed",
//             fixedPrice: fixedPrice,
//             priceRange: priceRange,
//           };

//           // Fetch skills
//           const skillElements = popupElement?.querySelectorAll('div.skills-list > span[data-test="Skill"]') || [];
//           const jobSkills = Array.from(skillElements).map((skill) => skill.textContent?.trim() || "");

//           // Check if payment is verified
//           const isPaymentVerified =
//             (popupElement
//               ?.querySelector(
//                 'div[data-test="about-client-container AboutClientUserShared AboutClientUser"] > div > div > .text-caption'
//               )
//               ?.textContent?.trim() || "") === "Payment method verified";

//           // Fetch location and job ID
//           const clientLocation =
//             popupElement?.querySelector('li[data-qa="client-location"] > strong')?.textContent?.trim() || "";
//           function getJobIdFromUrl(url: string): string | null {
//             // Use a regular expression to match the pattern and extract the ID
//             const match = url.match(/\/jobs\/~(\d+)\?/);
//             return match ? match[1] : null;
//           }

//           const url = popupElement?.querySelector(
//             'a[data-test="slider-open-in-new-window UpLink"]'
//           ) as HTMLAnchorElement;
//           const jobUrl = url?.href || "";
//           const jobId = getJobIdFromUrl(jobUrl) || "";

//           const rating = popupElement
//             ?.querySelector('div[data-testid="buyer-rating"] .air3-rating-value-text')
//             ?.textContent?.trim();

//           return {
//             title: jobTitle,
//             description: jobDescription,
//             skills: jobSkills,
//             isPaymentVerified,
//             clientLocation,
//             jobUrl,
//             jobId,
//             pricingDetails,
//             rating,
//           };
//         },
//       },
//       async (result) => {
//         if (result && result[0]) {
//           const jobData = result[0].result;
//           try {
//             const response = await axios.post(`${URL}/api/v1/detailed_jobs/`, {
//               job: {
//                 title: jobData?.title,
//                 description: jobData?.description,
//                 skills: jobData?.skills,
//                 is_payment_verified: jobData?.isPaymentVerified,
//                 client_location: jobData?.clientLocation,
//                 job_url: jobData?.jobUrl,
//                 job_id: jobData?.jobId,
//                 pricing_details: jobData?.pricingDetails,
//                 rating: jobData?.rating,
//               },
//             });
//             if (response.data?.success) {
//               toast.success(response.data?.message);
//               await getComment();
//             } else {
//               toast.error(response.data?.message);
//             }
//           } catch (error: any) {
//             console.error("Error occurred while sending the request:", error);
//             toast.error(error?.response?.data?.message || "An error occurred. Please try again.");
//           }
//         }
//       }
//     );
//     setScrapingMessage("");
//   };

//   const SubmitJobs = async () => {
//     const response = await axios.post(`${URL}/api/v1/jobs/`, {
//       jobs: jobs,
//     });
//     toast.success(response.data?.message);
//   };

//   function scrapeDescriptionFromUrl(url: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       chrome.tabs.create({ url: url, active: false }, (tab) => {
//         const tabId = tab.id;

//         if (tabId === undefined) {
//           return reject(new Error("Failed to create tab"));
//         }

//         const onTabUpdated = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
//           if (updatedTabId === tabId && changeInfo.status === "complete") {
//             // Remove the listener to prevent it from firing multiple times
//             chrome.tabs.onUpdated.removeListener(onTabUpdated);

//             // Execute script in the newly opened tab to scrape the description
//             chrome.scripting.executeScript(
//               {
//                 target: { tabId: tabId },
//                 func: () => {
//                   const descriptionElement = document.querySelector('div[data-test="Description"]') as HTMLElement;
//                   return descriptionElement ? descriptionElement.innerText.trim() : "";
//                 },
//               },
//               (results) => {
//                 if (chrome.runtime.lastError) {
//                   console.error("Script injection failed: ", chrome.runtime.lastError.message);
//                   chrome.tabs.remove(tabId);
//                   return reject(new Error(chrome.runtime.lastError.message));
//                 }

//                 const description = results && results[0]?.result;
//                 chrome.tabs.remove(tabId, () => resolve(description || ""));
//               }
//             );
//           }
//         };

//         // Add the listener to detect when the tab has finished loading
//         chrome.tabs.onUpdated.addListener(onTabUpdated);
//       });
//     });
//   }

//   const getComment = async (): Promise<void> => {
//     const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     // await loopedClickOnViewMore();

//     chrome.scripting.executeScript(
//       {
//         target: { tabId: activeTab.id as number },
//         func: () => {
//           const extraJobs = document
//             .querySelector("div.extra-jobs-cards")
//             ?.querySelectorAll('section[data-cy="jobs"] > div[data-cy="job"]');
//           const url = document.querySelector('a[data-test="slider-open-in-new-window UpLink"]') as HTMLAnchorElement;
//           function getJobIdFromUrl(url: string): string | null {
//             // Use a regular expression to match the pattern and extract the ID
//             const match = url.match(/\/jobs\/~(\d+)\?/);
//             return match ? match[1] : null;
//           }

//           const job_id = getJobIdFromUrl(url.href) || "";

//           const data = Array.from(extraJobs || []).map((job) => {
//             const jobTitle = job.querySelector('span[data-test="JobLink"]')?.textContent?.trim() || "";
//             const jobAnchor = job.querySelector('span[data-test="JobLink"] > a') as HTMLAnchorElement;
//             const url = jobAnchor?.href || "";
//             const commentContainers = job.querySelectorAll("div.main > .text-body-sm");

//             let clientComment = "";
//             let freelancerComment = "";

//             commentContainers?.forEach((container) => {
//               const containerElement = container as HTMLElement;
//               if (containerElement?.innerText?.includes("To freelancer:")) {
//                 clientComment =
//                   containerElement.querySelector('span[data-test="UpCTruncation"] span')?.textContent || "";
//               } else {
//                 freelancerComment =
//                   containerElement.querySelector('span[data-test="UpCTruncation"] span')?.textContent || "";
//               }
//             });

//             const billedAmount = job.querySelector('div[data-cy="stats"] > span > span')?.textContent?.trim() || "";
//             const rate = job.querySelector('div[data-cy="stats"] > span > strong > span')?.textContent?.trim() || "";
//             const job_id = url.split("/~")[1]?.split("/")[0] || "";

//             return {
//               jobTitle,
//               clientComment,
//               freelancerComment,
//               url,
//               billedAmount,
//               rate,
//               job_id,
//             } as CommentData;
//           });

//           return {
//             comments: data,
//             job_id: job_id,
//           };
//         },
//       },
//       async (injectionResults) => {
//         const { comments, job_id } = injectionResults[0].result as { comments: CommentData[]; job_id: string };
//         const totalComments = comments.length;
//         let currentCommentIndex = 0;
//         for (const comment of comments) {
//           currentCommentIndex++;
//           setMessage(`Scraping Comment: ${currentCommentIndex} / ${totalComments}`);
//           if (comment?.url) {
//             try {
//               const description = await scrapeDescriptionFromUrl(comment.url);
//               comment.description = description;
//             } catch (error) {
//               console.error(`Error scraping description for URL ${comment.url}:`, error);
//               comment.description = "";
//             }
//           }
//         }

//         console.log("Comments after adding descriptions:", comments);
//         console.log("Job ID:", job_id);

//         const commentsData = comments.map((comment) => {
//           return {
//             job: job_id,
//             client_feedback: comment.clientComment,
//             freelancer_feedback: comment.freelancerComment,
//             url: comment.url,
//             rating: parseFloat(comment.rate),
//             billed_amount: comment.billedAmount,
//             job_title: comment.jobTitle,
//             description: comment.description,
//           };
//         });

//         const response = await axios.post(`${URL}/api/v1/comments/`, {
//           job_id: job_id,
//           comments: commentsData,
//         });
//         toast.success(response.data?.message);
//         setMessage(null);
//         setNote("Comments Scraped Successfully");
//         setTimeout(() => {
//           setNote(null);
//         }, 5000);
//       }
//     );
//   };

//   useEffect(() => {
//     chrome?.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
//       if (message.type === "CURRENT_JOB") {
//         setCurJob(message.count);
//       }

//       if (message.type === "FETCH_JOB_DETAILS") {
//         fetchJobDetails();
//       }
//     });

//     return () => {
//       chrome?.runtime?.onMessage?.removeListener(() => {});
//     };
//   }, []);

//   return (
//     <>
//       <div className="flex items-center justify-between bg-gray-200 p-2 rounded">
//         <button onClick={() => window.close()} className="text-red-600 hover:text-red-800">
//           Close
//         </button>
//         <h2 className="text-lg font-semibold text-gray-800">UpWork Scraper</h2>
//       </div>

//       <div className="card bg-white shadow-md p-2 rounded ">
//         {scrapingMessage && <Message message="Scraping in progress..." />}
//         {message && <Message message={message || ""} />}
//         {note && <Message message={note || ""} />}
//         <div className="mb-4 flex items-center">
//           <label htmlFor="min-spent" className="text-gray-700 font-medium w-28">
//             Min Spent:
//           </label>
//           <div className="relative flex-1">
//             <input
//               type="text"
//               id="min-spent"
//               value={minSpent}
//               onChange={(e) => {
//                 const value = parseInt(e.target.value);
//                 setMinSpent(isNaN(value) ? 0 : value); // Handle NaN explicitly
//               }}
//               className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 pl-8"
//               placeholder="Enter minimum amount"
//             />
//             <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
//           </div>
//         </div>
//         <button
//           onClick={() => onclickJob(false)}
//           className="w-full bg-sky-500 text-white py-2 rounded hover:bg-sky-500 mb-2"
//         >
//           Highlight Jobs
//         </button>
//         <button
//           onClick={loopedClickOnViewMore}
//           className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 mb-2"
//         >
//           looped View More
//         </button>
//         <button
//           onClick={fetchJobDetails}
//           className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600 mb-2"
//         >
//           Get Detailed Job
//         </button>{" "}
//         <button
//           onClick={() => onclickJob(true)}
//           className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-2"
//         >
//           Scrap Jobs
//         </button>
//         <button
//           onClick={clickPerPage}
//           className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 mb-2"
//         >
//           Apply 50 Jobs Per Page
//         </button>
//         <div className="flex space-x-2">
//           <button
//             onClick={clickPreviousPage}
//             className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mb-2"
//           >
//             Prev
//           </button>
//           <button
//             onClick={clickNextPage}
//             className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-2"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }

// export default App;

// // let posted_time =
// //   jobArticle.querySelector("div.job-tile-header > div > small > span:nth-child(2)")?.textContent || "";
// // let payment_verified =
// //   jobArticle.querySelector('li[data-test="payment-verified"]')?.textContent?.trim() || "";

// // let location = jobArticle.querySelector('li[data-test="location"] > div')?.textContent?.trim() || "";
// // let rating =
// //   jobArticle
// //     .querySelector('li[data-test="total-feedback"] > span > span > div > div.air3-rating-value-text')
// //     ?.textContent?.trim() || "";

// // let job_type: JobDetails;
// // let job_type_name =
// //   jobArticle.querySelector('li[data-test="job-type-label"]')?.textContent?.trim() || ("" as string);
// // if (job_type_name === "Fixed price") {
// //   let experience_level = jobArticle.querySelector('li[data-test="experience-level"]')?.textContent || "";
// //   let fixed_price = jobArticle.querySelector('li[data-test="is-fixed-price"]')?.textContent || "";
// //   job_type = {
// //     job_type: job_type_name,
// //     experience_level: experience_level,
// //     fixed_price: fixed_price,
// //     duration: null,
// //   };
// // } else {
// //   let duration = jobArticle.querySelector('li[data-test="duration-label"]')?.textContent || "";
// //   let experience_level = jobArticle.querySelector('li[data-test="experience-level"]')?.textContent || "";
// //   let pricing = job_type_name.replace("Hourly: ", "") || "";
// //   job_type = {
// //     job_type: "Hourly",
// //     experience_level: experience_level,
// //     pricing: pricing,
// //     duration: duration,
// //   };
// // }

// // let description =
// //   jobArticle.querySelector('div[data-test="UpCLineClamp JobDescription"] > div > p')?.textContent || "";

// // let skills: string[] = [];
// // jobArticle.querySelectorAll("div.air3-token-container > div.air3-token-wrap > button").forEach((skill) => {
// //   const skillText = skill.textContent?.trim() || ""; // Use trim() to remove any extra whitespace
// //   if (skillText) {
// //     skills.push(skillText); // Push non-empty strings into the array
// //   }
// // });

// // let proposals: { total: number; active: number } = { total: 0, active: 0 };

// // const proposalText = jobArticle
// //   .querySelector('li[data-test="proposals-tier"] > strong')
// //   ?.textContent?.split("to")
// //   .map((value) => parseInt(value.trim())); // Make sure to trim whitespace and convert to integer

// // if (proposalText && proposalText.length === 2) {
// //   proposals = proposalText.reduce(
// //     (acc, value, index) => {
// //       if (index === 0) {
// //         acc.total = value;
// //       } else {
// //         acc.active = value;
// //       }
// //       return acc;
// //     },
// //     { total: 0, active: 0 } // Initial value for reduce
// //   );
// // }

// // let job: Job = {
// //   job_id: jobArticle.getAttribute("data-ev-job-uid") || "",
// //   title: title,
// //   posted_time: posted_time,
// //   payment_verified: payment_verified === "Payment verified",
// //   total_spent: convertStringToInt(total_spent) || 0,
// //   location: location,
// //   rating: parseFloat(rating) || 0,
// //   job_type: job_type,
// //   description: description,
// //   skills: skills,
// //   proposals: proposals,
// // };

// // jobs.push(job);
