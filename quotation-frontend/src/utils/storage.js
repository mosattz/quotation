const STORAGE_KEY = "quotation.jobs";

export function loadJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load jobs", error);
    return [];
  }
}

export function saveJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function addJob(job) {
  const jobs = loadJobs();
  jobs.unshift(job);
  saveJobs(jobs);
  return jobs;
}
