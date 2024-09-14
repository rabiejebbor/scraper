const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const XLSX = require('xlsx');
const { generateCoverLetter } = require("./aiChat");

// Use the stealth plugin
puppeteer.use(StealthPlugin());

// ---- Configuration ---- //
const OUTPUT_FORMAT = 'excel';  // Output format ('csv' or 'excel')
const MAX_JOBS = 1;  // Maximum number of jobs to scrape
const JOB_SEARCH_URL = 'https://ca.indeed.com/jobs?q=javascript&l=Montr%C3%A9al%2C+QC&from=searchOnDesktopSerp&vjk=0728fa42cde7b8a7';  // URL to scrape
const HEADLESS = true;  // Puppeteer headless mode: true for background, false to see the browser in action
const applicantInfo = `Applicant Name: Rabie Jebbor\n
My Address: dar ta7ouna 23
City, Province, Postal Code: 1234 fuck you street
Email Address: rabue@mok.com
Phone Number: 012345697
Date: 21 june 2024
Your LinkedIn Profile: linkedinRabie.com

PROFESSIONAL EXPERIENCE
Javascript Developer
At FACTUREE – The Online Manufacturer
Dec 2022 - Present (Berlin, Germany)
• Utilized React, Angular, Parse Server, and MongoDB
to implement new features and optimize existing
functions in an internal ERP system.
• Developed a portal and platform for manufacturers,
enhancing business operations and streamlining
processes.
• Significantly enhanced performance and user
experience.
Frontend Web Developer
At KnameIt
June 2021 to July 2022
• Contributed to building and improving a cutting-edge
web app for designers, enhancing its functionality and
user interface.
• Leveraged JavaScript, MeteorJS, BlazeJS, Sass,
MongoDB, and ReactJS to develop and optimize
various components.
React Developer
Online Booking Web App for Beauty Salons
February 2021 to June 2021
• Developed an online booking web app for beauty
salons using ReactJS, MongoDB, Express, NodeJS, and
AWS S3.
• Ensured seamless booking experiences, resulting in
increased bookings and reduced booking errors.
• Enhanced the user interface and experience, leading to
positive feedback from clients and increased operational
efficiency.
SKILLS & PROFICIENCIES
React
Angular
JavaScript
TypeScript
HTML5 / CSS / Sass
MongoDB
React Native
Meteor JS
BlazeJS
Node.js
AWS
ParseServer
Serverless/AMPT
Ionic
Git
LANGUAGES
English: Fluent
French: Fluent
Russian: Proficient
German: A1 (Beginner)
Arabic: Fluent
Berber: Native

EDUCATION
Bachelor’s Degree in Computer Engineering
Dnipro University of Technology
Graduated 2023
Completed 2 Years in Medical Studies
Dnipro State Medical University
2017 – 2019

ABOUT ME
Passionate and dedicated web developer
with a proven ability to quickly learn and
adapt to new technologies. Committed to
contributing to impactful projects that
provide exceptional user experiences and
drive business success.
`;
// ----------------------- //

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

            await delay(5000);

            const jobTitle = job.title;
            const jobUrl = job.href;

            const jobDescription = await jobPage.$eval('.jobsearch-JobComponent-description', el => el.textContent.trim())
                .catch(() => 'No description available');

            const coverLetter = await generateCoverLetter(jobDescription, applicantInfo);

            jobsData.push({
                jobTitle,
                coverLetter,
                jobUrl
            });

            console.log(`Extracted data for: ${jobTitle}`);

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
