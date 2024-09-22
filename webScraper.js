const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const XLSX = require('xlsx');
const { generateCoverLetter, extractJobData } = require("./aiChat");

// Use the stealth plugin
puppeteer.use(StealthPlugin());

// ---- Configuration ---- //
const OUTPUT_FORMAT = 'excel';  // Output format ('csv' or 'excel')
const MAX_JOBS = 1;  // Maximum number of jobs to scrape
const JOB_SEARCH_URL = 'https://ca.indeed.com/jobs?q=javascript&l=Montr%C3%A9al%2C+QC&from=searchOnDesktopSerp&vjk=0728fa42cde7b8a7';  // URL to scrape
const HEADLESS = true;  // Puppeteer headless mode: true for background, false to see the browser in action
const applicantInfo = {
    personalInfo: `Name: Your Name
Address: Your Address
City, Province, Postal Code: Your City, Province, Postal Code
Email: Your Email
Phone: Your Phone Number
Date: Current Date
LinkedIn: Your LinkedIn Profile`,

    professionalExperience: `Job Title at Company Name (Job Duration), Job Title at Company Name (Job Duration), Job Title at Company Name (Job Duration)`,

    skills: `Skill 1, Skill 2, Skill 3`,

    languages: `Language 1 (Proficiency), Language 2 (Proficiency), Language 3 (Proficiency)`,

    education: `Degree Name from Institution (Graduation Year), Degree Name from Institution (Graduation Year)`,

    aboutMe: `A brief description about yourself.`
};
// ----------------------- //


// Combining the applicant info into one description
const applicantDescription = `${applicantInfo.personalInfo}

PROFESSIONAL EXPERIENCE
${applicantInfo.professionalExperience}

SKILLS
${applicantInfo.skills}

LANGUAGES
${applicantInfo.languages}

EDUCATION
${applicantInfo.education}

ABOUT ME
${applicantInfo.aboutMe}`;

const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/[-:]/g, '');

// Helper function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Async function to handle the scraping logic
async function scrapeJobs(page, max = MAX_JOBS) {
    const jobsData = [];
    let i = 0;

    console.log('Job Links Scraper with Descriptions to Excel started');

    await page.waitForSelector('a.jcs-JobTitle');

    const jobLinks = await page.$$eval('a.jcs-JobTitle', aTags => aTags.map(aTag => ({
        href: aTag.href,
        title: aTag.textContent.trim()
    })));

    if (jobLinks.length > 0) {
        for (const job of jobLinks) {
            if (i >= max) break;
            i++;

            console.log(`Processing job: ${job.title}`);

            const jobPage = await page.browser().newPage();
            await jobPage.goto(job.href, { waitUntil: 'networkidle2' });



            const jobTitle = job.title;
            const jobUrl = job.href;

            const jobDescription = await jobPage.$eval('.jobsearch-JobComponent-description', el => el.textContent.trim())
                .catch(() => 'No description available');

            // const coverLetter = await generateCoverLetter(jobDescription, applicantInfo);
            const jobData = await extractJobData(jobDescription)

            if (jobData && Object.keys(jobData).length > 0) {
                // Transform the nested jobRequirements into a flat string
                const flatJobRequirements = jobData.jobRequirements.map(req => `${req.technologyName} (${req.yearsOfExperienceRequired} years)`).join(', ');

                jobsData.push({
                    jobTitle,
                    jobUrl,
                    shortDescription: jobData.shortDescription,
                    jobRequirements: flatJobRequirements,
                    top5JobRequirements: jobData.top5JobRequirements
                });

                console.log(`Extracted data for: ${jobTitle}`);
            } else {
                console.warn(`No job data extracted for: ${jobTitle}`);
            }


            await jobPage.close();
        }

        console.log('All jobs processed.');
    } else {
        console.log('No job links found.');
    }

    return jobsData;
}

// Function to generate and save an Excel file
function generateExcel(jobsData) {
    const excelFilePath = `jobs_data_${timestamp}.xlsx`;

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(jobsData);
    const sheetName = "Jobs Data";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, excelFilePath);
    console.log(`Excel file created successfully at ${excelFilePath}!`);
}

// Main function
(async () => {
    const browser = await puppeteer.launch({ headless: HEADLESS, defaultViewport: null });
    const page = await browser.newPage();

    await page.goto(JOB_SEARCH_URL, { waitUntil: 'networkidle2' });

    const jobsData = await scrapeJobs(page, MAX_JOBS);

    if (OUTPUT_FORMAT === 'excel') {
        generateExcel(jobsData);
    } else {
        console.log('Invalid OUTPUT_FORMAT. Use "excel".');
    }

    await browser.close();
})();
