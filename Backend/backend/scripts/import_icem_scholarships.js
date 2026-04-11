const institutionEmail = "icem.pune@gmail.com";
const now = new Date();

const user = db.users.findOne({ email: institutionEmail, deleted: { $ne: true } });

if (!user) {
  throw new Error(`Institution user not found for ${institutionEmail}`);
}

const createdBy = user._id.toString();

const scholarships = [
  {
    name: "Central Sector Scheme of Scholarship for College and University Students",
    provider: "Ministry of Education, Government of India",
    description: "Merit-based central scholarship for Indian students from low-income families pursuing regular undergraduate or postgraduate study. This entry uses the Ministry of Education scheme page as the application source and a standard NSP-cycle deadline placeholder for the 2026 intake window.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 12000, max: 20000, currency: "INR" },
    deadline: new Date("2026-10-31T23:59:59Z"),
    eligibility: [
      "Indian national enrolled in a regular college or university programme",
      "Strong Class XII board performance and family income within scheme limits",
      "Suitable for merit-based applicants needing support for day-to-day study costs"
    ],
    requirements: [
      "Academic transcripts or board marksheet",
      "Income certificate",
      "Bank account and identity documents for portal verification"
    ],
    applicationUrl: "https://www.education.gov.in/central-sector-scheme-scholarship-college-and-university-students",
    featured: true,
    active: true,
    tags: ["india", "government", "merit-based", "nsp", "undergraduate"]
  },
  {
    name: "AICTE Pragati Scholarship Scheme",
    provider: "All India Council for Technical Education (AICTE)",
    description: "AICTE scholarship for meritorious girl students pursuing technical education. AICTE states the award is up to Rs 50,000 per annum. This record keeps a standard late-cycle deadline for the 2026 application season.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Engineering and Technical Education",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 50000, max: 50000, currency: "INR" },
    deadline: new Date("2026-11-15T23:59:59Z"),
    eligibility: [
      "Girl student enrolled in an AICTE-approved technical programme",
      "Merit-based selection with support for technical higher education",
      "Useful for diploma or degree-level technical study"
    ],
    requirements: [
      "Admission proof in AICTE-approved institution",
      "Academic records",
      "Identity, bank and category documents as applicable"
    ],
    applicationUrl: "https://www.aicte.gov.in/schemes/students-development-schemes",
    featured: true,
    active: true,
    tags: ["india", "aicte", "girls", "technical", "engineering"]
  },
  {
    name: "AICTE Saksham Scholarship Scheme",
    provider: "All India Council for Technical Education (AICTE)",
    description: "AICTE scholarship for differently-abled students pursuing technical education. AICTE materials state support of Rs 50,000 per annum for eligible students.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Engineering and Technical Education",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 50000, max: 50000, currency: "INR" },
    deadline: new Date("2026-11-15T23:59:59Z"),
    eligibility: [
      "Differently-abled student admitted to technical education programme",
      "Applicant should meet AICTE scholarship norms",
      "Relevant for diploma and degree-level technical study"
    ],
    requirements: [
      "Admission proof",
      "Disability certificate",
      "Academic, identity and bank documents"
    ],
    applicationUrl: "https://www.aicte.gov.in/schemes/students-development-schemes",
    featured: true,
    active: true,
    tags: ["india", "aicte", "divyang", "technical", "engineering"]
  },
  {
    name: "Prime Minister's Special Scholarship Scheme (PMSSS)",
    provider: "All India Council for Technical Education (AICTE)",
    description: "PMSSS supports students from Jammu & Kashmir and Ladakh pursuing undergraduate education across India. AICTE documents show academic-fee support up to Rs 3 lakh for medical, Rs 1.25 lakh for professional courses, Rs 30,000 for general degree courses, plus maintenance support up to Rs 1 lakh per annum.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "FULL_FUNDING",
    fundingAmount: { min: 130000, max: 400000, currency: "INR" },
    deadline: new Date("2026-08-31T23:59:59Z"),
    eligibility: [
      "Student from Jammu & Kashmir or Ladakh under PMSSS norms",
      "Undergraduate admission through the scheme process",
      "Applicable to general, professional, engineering and medical streams within scheme caps"
    ],
    requirements: [
      "PMSSS registration and counselling records",
      "Admission and domicile documents",
      "Identity and bank details"
    ],
    applicationUrl: "https://sihqa.aicte-india.org/",
    featured: true,
    active: true,
    tags: ["india", "aicte", "pmsss", "government", "undergraduate"]
  },
  {
    name: "INSPIRE Scholarship for Higher Education (SHE)",
    provider: "Department of Science and Technology, Government of India",
    description: "INSPIRE SHE is a flagship DST scholarship for students pursuing basic and natural sciences at bachelor's and master's level. The official FAQ states 12,000 scholarships are announced annually, each valued at Rs 80,000.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Basic and Natural Sciences",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 80000, max: 80000, currency: "INR" },
    deadline: new Date("2026-09-30T23:59:59Z"),
    eligibility: [
      "Strong academic performance in Class XII or equivalent",
      "Enrolled in eligible basic or natural science programme",
      "Best fit for students considering research-oriented science careers"
    ],
    requirements: [
      "Academic transcript and rank/merit evidence",
      "Admission proof in eligible science course",
      "Identity and bank details"
    ],
    applicationUrl: "https://www.online-inspire.gov.in/Account/FAQ",
    featured: false,
    active: true,
    tags: ["india", "dst", "science", "research", "undergraduate"]
  },
  {
    name: "Ishan Uday Special Scholarship Scheme",
    provider: "University Grants Commission (UGC)",
    description: "UGC scholarship for students from the North Eastern Region pursuing general degree, technical or professional courses. Standard scholarship values are Rs 5,400 per month for general degree courses and Rs 7,800 per month for technical and professional courses.",
    country: "India",
    degreeLevel: "UNDERGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 64800, max: 93600, currency: "INR" },
    deadline: new Date("2026-10-31T23:59:59Z"),
    eligibility: [
      "Permanent resident of the North Eastern Region",
      "Admitted to eligible undergraduate degree, technical or professional course",
      "Designed to expand higher-education access in the NER"
    ],
    requirements: [
      "NER domicile proof",
      "Admission proof",
      "Academic, identity and bank documents"
    ],
    applicationUrl: "https://scholarships.gov.in/",
    featured: false,
    active: true,
    tags: ["india", "ugc", "north-east", "nsp", "undergraduate"]
  },
  {
    name: "Commonwealth Master's Scholarship",
    provider: "Commonwealth Scholarship Commission in the UK",
    description: "Fully funded master's scholarship for students from Commonwealth countries who could not otherwise afford to study in the UK. British Council guidance notes that applications for the 2026-27 academic year close at 16:00 on Tuesday 14 October.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "FULL_FUNDING",
    fundingAmount: { min: 25000, max: 50000, currency: "GBP" },
    deadline: new Date("2026-10-14T16:00:00Z"),
    eligibility: [
      "Citizen or permanent resident of a Commonwealth country",
      "Strong academic record and inability to self-fund UK study",
      "Best aligned with development-focused postgraduate applicants"
    ],
    requirements: [
      "Passport",
      "Degree certificate and academic transcript",
      "References and supporting statements"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/commonwealth-scholarships",
    featured: true,
    active: true,
    tags: ["international", "uk", "masters", "fully-funded", "commonwealth"]
  },
  {
    name: "GREAT Scholarship at University of Reading",
    provider: "University of Reading / British Council",
    description: "GREAT Scholarship for Indian students applying to full-time taught postgraduate programmes at the University of Reading. The British Council lists the scholarship value at GBP 10,000 and the 2026 deadline at 1 May.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-05-01T23:59:59Z"),
    eligibility: [
      "Indian student applying for a full-time taught master's programme",
      "Meets University of Reading admission criteria",
      "Strong fit for broad postgraduate disciplines"
    ],
    requirements: [
      "University application",
      "Academic transcript",
      "Statement or scholarship application materials required by the university"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/university-reading",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "india", "masters"]
  },
  {
    name: "GREAT Scholarship at Norwich University of the Arts",
    provider: "Norwich University of the Arts / British Council",
    description: "GREAT Scholarship for Indian students joining full-time taught postgraduate programmes at Norwich University of the Arts. The British Council lists the award value at GBP 10,000 and the application deadline at 3 May 2026.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Art, Design and Creative Computing",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-05-03T23:59:59Z"),
    eligibility: [
      "Indian student applying for a full-time taught master's programme",
      "Strong fit for creative arts, design and related subjects",
      "Must satisfy university admission standards"
    ],
    requirements: [
      "University application",
      "Portfolio where required",
      "Academic and identity documents"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/norwich-university-arts",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "arts", "design"]
  },
  {
    name: "GREAT Scholarship at Royal College of Art",
    provider: "Royal College of Art / British Council",
    description: "GREAT Scholarship for Indian students entering full-time postgraduate taught master's programmes at the Royal College of Art. The British Council lists the award at GBP 10,000 and the application deadline at 24 April 2026.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Art and Design",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-04-24T23:59:59Z"),
    eligibility: [
      "Indian student applying to a full-time taught master's programme",
      "Relevant for art, design and communication disciplines",
      "Admission offer or eligible application required by RCA"
    ],
    requirements: [
      "RCA programme application",
      "Portfolio where required",
      "Academic and identity documents"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/royal-college-art",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "art", "design"]
  },
  {
    name: "GREAT Scholarship at Queen's University Belfast",
    provider: "Queen's University Belfast / British Council",
    description: "GREAT Scholarship for Indian students applying to eligible taught master's programmes at Queen's University Belfast. The British Council lists a GBP 10,000 award and a 31 May 2026 deadline.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Law and International Business",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-05-31T23:59:59Z"),
    eligibility: [
      "Indian student applying to an eligible taught master's course",
      "Particularly relevant to law and selected business programmes",
      "Must meet Queen's admission conditions"
    ],
    requirements: [
      "University application",
      "Academic documents",
      "Scholarship-specific statement or supporting materials"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/queens-university-belfast",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "law", "business"]
  },
  {
    name: "GREAT Scholarship at Royal Northern College of Music",
    provider: "Royal Northern College of Music / British Council",
    description: "GREAT Scholarship for Indian students joining full-time postgraduate taught master's programmes at the Royal Northern College of Music. The British Council lists the award value at GBP 10,000 and the deadline at 1 August 2026.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Music and Performing Arts",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-08-01T23:59:59Z"),
    eligibility: [
      "Indian student applying to a full-time taught master's programme",
      "Strong fit for music and performance disciplines",
      "Must satisfy RNCM admission and audition requirements"
    ],
    requirements: [
      "RNCM application and audition materials",
      "Academic records",
      "Identity and supporting documents"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/royal-northern-college-music",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "music", "performing-arts"]
  },
  {
    name: "GREAT Scholarship at University of Dundee",
    provider: "University of Dundee / British Council",
    description: "GREAT Scholarship for Indian students applying to full-time taught postgraduate programmes at the University of Dundee. The British Council lists a GBP 10,000 award and a 15 May 2026 deadline.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-05-15T23:59:59Z"),
    eligibility: [
      "Indian student applying for a full-time taught master's programme",
      "Suitable across multiple postgraduate disciplines",
      "Must satisfy Dundee admissions requirements"
    ],
    requirements: [
      "University application",
      "Academic transcript",
      "Supporting documents required by the scholarship process"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/university-dundee",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "india", "masters"]
  },
  {
    name: "GREAT Scholarship at University of Surrey",
    provider: "University of Surrey / British Council",
    description: "GREAT Scholarship for Indian students entering full-time taught postgraduate programmes at the University of Surrey. The British Council lists the scholarship value at GBP 10,000 and the deadline at 29 May 2026.",
    country: "UK",
    degreeLevel: "POSTGRADUATE",
    fieldOfStudy: "Any",
    fundingType: "PARTIAL_FUNDING",
    fundingAmount: { min: 10000, max: 10000, currency: "GBP" },
    deadline: new Date("2026-05-29T23:59:59Z"),
    eligibility: [
      "Indian student applying for a full-time taught master's programme",
      "Relevant across business, engineering, health and science programmes",
      "Must meet Surrey admissions criteria"
    ],
    requirements: [
      "University application",
      "Academic transcript",
      "Scholarship application materials required by the university"
    ],
    applicationUrl: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/university-surrey",
    featured: false,
    active: true,
    tags: ["international", "uk", "great-scholarship", "india", "masters"]
  }
];

let inserted = 0;
let updated = 0;

scholarships.forEach((item) => {
  const filter = {
    name: item.name,
    provider: item.provider,
    createdBy,
    deleted: false
  };

  const existing = db.scholarships.findOne(filter, { _id: 1 });

  const result = db.scholarships.updateOne(
    filter,
    {
      $set: {
        ...item,
        createdBy,
        deleted: false,
        viewCount: 0,
        applicationCount: 0,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  if (existing) {
    updated += result.modifiedCount;
  } else {
    inserted += result.upsertedCount;
  }
});

printjson({
  institutionEmail,
  createdBy,
  totalInput: scholarships.length,
  inserted,
  updated,
  totalInCollection: db.scholarships.countDocuments({ createdBy, deleted: false })
});
