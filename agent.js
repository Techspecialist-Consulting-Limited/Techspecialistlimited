/**
 * CV Parser Agent
 * 
 * This script runs every 30 minutes to:
 * 1. Find all unparsed applications in Firebase
 * 2. Send CVs to Affinda for parsing
 * 3. Calculate scores based on job requirements
 * 4. Write results back to Firebase
 * 
 * Usage: node agent.js
 * 
 * Environment variables needed:
 * - AFFINDA_API_KEY: Your Affinda API key
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to Firebase service account JSON (optional, will use Application Default Credentials)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');
const axios = require('axios');

// Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD1151-t0RDGn1bz0GwMr4Uv0uA4E6bnoo",
  authDomain: "techspecialist-careers.firebaseapp.com",
  projectId: "techspecialist-careers",
  storageBucket: "techspecialist-careers.firebasestorage.app",
  messagingSenderId: "68286942864",
  appId: "1:68286942864:web:06748d637d7422f0ccd215"
};

const AFFINDA_API_KEY = process.env.AFFINDA_API_KEY || '';
const AFFINDA_BASE_URL = 'https://api.affinda.com/v1';
const AFFINDA_WORKSPACE = process.env.AFFINDA_WORKSPACE || ''; // Optional workspace ID

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`);
}

// Default job requirements (fallback if not set in Firestore)
const defaultRequirements = {
  'default': {
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'HTML', 'CSS'],
    bonusSkills: ['AWS', 'Docker', 'TypeScript', 'SQL', 'MongoDB'],
    minExperience: 1,
    requiredEducation: null,
    locationPreference: null
  }
};

/**
 * Parse CV using Affinda API
 */
async function parseCVWithAffinda(resumeUrl) {
  if (!AFFINDA_API_KEY) {
    throw new Error('AFFINDA_API_KEY environment variable not set');
  }

  if (!resumeUrl) {
    throw new Error('No resume URL provided');
  }

  try {
    log('info', 'Calling Affinda API', { resumeUrl });

    const response = await axios.post(
      `${AFFINDA_BASE_URL}/parser/resume`,
      {
        url: resumeUrl,
        ...(AFFINDA_WORKSPACE && { workspace: AFFINDA_WORKSPACE })
      },
      {
        headers: {
          'Authorization': `Bearer ${AFFINDA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('No data returned from Affinda');
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    log('error', 'Affinda API error', { error: errorMessage });
    throw new Error(`Affinda parsing failed: ${errorMessage}`);
  }
}

/**
 * Parse skills from various Affinda response formats
 */
function parseSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills
      .map(s => typeof s === 'string' ? s.trim() : (s.name || s.skill || s.title || ''))
      .filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Extract total experience years from work history
 */
function extractExperienceYears(experience) {
  if (!experience || !Array.isArray(experience)) return 0;

  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  experience.forEach(exp => {
    const startDate = exp.start_date || exp.startDate || '';
    const endDate = exp.end_date || exp.endDate || '';

    // Try to extract year from various date formats
    const startMatch = startDate.match(/(\d{4})/);
    const endMatch = endDate.match(/(\d{4})/);

    if (startMatch) {
      const startYear = parseInt(startMatch[1]);
      if (endDate.toLowerCase().includes('present') || !endMatch) {
        totalYears += currentYear - startYear;
      } else {
        const endYear = parseInt(endMatch[1]);
        totalYears += Math.max(0, endYear - startYear);
      }
    }
  });

  return Math.round(totalYears * 10) / 10;
}

/**
 * Match candidate skills against job requirements
 */
function matchSkills(candidateSkills, requiredSkills, bonusSkills) {
  const normalized = candidateSkills.map(s => s.toLowerCase().trim());
  const matched = [];
  const bonus = [];

  requiredSkills.forEach(req => {
    if (normalized.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
      matched.push(req);
    }
  });

  bonusSkills.forEach(bs => {
    if (normalized.some(s => s.includes(bs.toLowerCase()) || bs.toLowerCase().includes(s))) {
      bonus.push(bs);
    }
  });

  return { matched, bonus };
}

/**
 * Calculate score based on parsed CV and job requirements
 */
function calculateScore(parsedData, requirements) {
  const {
    requiredSkills = [],
    bonusSkills = [],
    minExperience = 0,
    requiredEducation = null,
    locationPreference = null
  } = requirements;

  // Parse skills
  const candidateSkills = parseSkills(parsedData.skills);

  // Match skills
  const { matched, bonus } = matchSkills(candidateSkills, requiredSkills, bonusSkills);

  // Calculate skill score (max 40 points: 30 required + 10 bonus)
  const requiredSkillScore = matched.length * 10;
  const bonusSkillScore = Math.min(10, bonus.length * 5);
  const skillsScore = Math.min(40, requiredSkillScore + bonusSkillScore);

  // Calculate experience score (max 30 points)
  const expYears = parsedData.experience_years || extractExperienceYears(parsedData.experience);
  const expScore = Math.min(30, Math.round(expYears * 10));

  // Calculate education score (max 20 points)
  let eduScore = 0;
  if (requiredEducation && parsedData.education) {
    const eduArray = Array.isArray(parsedData.education) ? parsedData.education : [parsedData.education];
    const eduText = eduArray
      .map(e => `${e.degree || ''} ${e.field || ''} ${e.institution || ''}`)
      .join(' ')
      .toLowerCase();
    if (eduText.includes(requiredEducation.toLowerCase())) {
      eduScore = 20;
    }
  } else if (!requiredEducation) {
    eduScore = 20; // No education requirement = full points
  }

  // Calculate location score (max 10 points)
  let locScore = 0;
  if (locationPreference && parsedData.location) {
    const loc = parsedData.location.toLowerCase();
    const pref = locationPreference.toLowerCase();
    if (loc.includes(pref) || (pref.includes('remote') && loc.includes('remote'))) {
      locScore = 10;
    }
  } else if (!locationPreference) {
    locScore = 10; // No location requirement = full points
  }

  // Total score (max 100)
  const totalScore = Math.min(100, skillsScore + expScore + eduScore + locScore);

  // Determine suggestion
  let suggestion = 'Review';
  let suggestionIcon = '📋';
  if (totalScore >= 80) {
    suggestion = 'Strong Match';
    suggestionIcon = '✅';
  } else if (totalScore < 60) {
    suggestion = 'Pass';
    suggestionIcon = '❌';
  }

  // Generate summary
  const summary = [];
  if (matched.length > 0) {
    summary.push(`✅ Required: ${matched.join(', ')}`);
  }
  if (bonus.length > 0) {
    summary.push(`+ Bonus: ${bonus.join(', ')}`);
  }
  summary.push(`⏱️ Experience: ${expYears} years (${expYears >= minExperience ? 'meets' : 'below'} ${minExperience} min)`);
  if (eduScore === 20) summary.push('🎓 Education: matches');
  if (locScore === 10) summary.push('📍 Location: matches');

  return {
    score: totalScore,
    suggestion,
    suggestionIcon,
    matchedSkills: matched,
    bonusSkills: bonus,
    experienceYears: expYears,
    scoreBreakdown: {
      skills: { score: skillsScore, max: 40, matched: matched.length, bonus: bonus.length },
      experience: { score: expScore, max: 30, years: expYears },
      education: { score: eduScore, max: 20, match: eduScore > 0 },
      location: { score: locScore, max: 10, match: locScore > 0 }
    },
    summary: summary.join('\n'),
    parsedData: {
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      location: parsedData.location,
      skills: candidateSkills,
      experience: parsedData.experience,
      education: parsedData.education,
      summary: parsedData.summary,
      languages: parsedData.languages,
      certifications: parsedData.certifications,
      experience_years: expYears
    }
  };
}

/**
 * Process a single application
 */
async function processApplication(appDoc) {
  const appData = appDoc.data();
  const appId = appDoc.id;

  log('info', `Processing application: ${appId}`, { name: appData.applicantName, job: appData.jobTitle });

  // Skip if no resume URL
  if (!appData.resumeUrl) {
    log('warn', `No resume URL, skipping`, { appId });
    return { status: 'skipped', reason: 'no_resume' };
  }

  // Skip if already parsed successfully
  if (appData.parsed === true && !appData.parseError) {
    log('info', `Already parsed, skipping`, { appId });
    return { status: 'skipped', reason: 'already_parsed' };
  }

  try {
    // Parse CV
    const parsedData = await parseCVWithAffinda(appData.resumeUrl);

    // Get job requirements for this job title
    let requirements = defaultRequirements['default'];
    
    if (appData.jobTitle) {
      // Try to fetch from Firestore jobs collection
      const jobsRef = collection(db, 'jobs');
      const jobQuery = query(jobsRef, where('title', '==', appData.jobTitle));
      const jobSnap = await getDocs(jobQuery);
      
      if (!jobSnap.empty) {
        requirements = jobSnap.docs[0].data().requirements || requirements;
      }
    }

    // Calculate score
    const result = calculateScore(parsedData, requirements);

    // Update Firebase
    const docRef = doc(db, 'applications', appId);
    await updateDoc(docRef, {
      parsed: true,
      parsedAt: new Date(),
      parsedData: result.parsedData,
      agentScore: result.score,
      agentSuggestion: result.suggestion,
      agentSuggestionIcon: result.suggestionIcon,
      agentSummary: result.scoreBreakdown,
      matchedSkills: result.matchedSkills,
      bonusSkills: result.bonusSkills,
      experienceYears: result.experienceYears,
      parseError: null
    });

    log('info', `CV parsed successfully`, {
      appId,
      score: result.score,
      suggestion: result.suggestion
    });

    return { status: 'success', ...result };

  } catch (error) {
    const errorMessage = error.message || 'Unknown error';

    log('error', `CV parsing failed`, { appId, error: errorMessage });

    // Update with error status
    const docRef = doc(db, 'applications', appId);
    await updateDoc(docRef, {
      parsed: false,
      parseError: errorMessage,
      parseAttempts: (appData.parseAttempts || 0) + 1,
      agentScore: 50,
      agentSuggestion: 'Review',
      agentSuggestionIcon: '📋'
    });

    return { status: 'error', error: errorMessage };
  }
}

/**
 * Main agent function
 */
async function runAgent() {
  log('info', '========================================');
  log('info', 'CV Parser Agent started');
  log('info', '========================================');

  const startTime = Date.now();

  // Validate API key
  if (!AFFINDA_API_KEY) {
    log('error', 'AFFINDA_API_KEY not set. Please set the environment variable.');
    process.exit(1);
  }

  try {
    // Find all unparsed applications
    const applicationsRef = collection(db, 'applications');
    const unparsedQuery = query(
      applicationsRef,
      where('resumeUrl', '!=', null)
    );

    log('info', 'Fetching unparsed applications...');
    const snapshot = await getDocs(unparsedQuery);

    log('info', `Found ${snapshot.size} applications with resumes`);

    if (snapshot.empty) {
      log('info', 'No applications to process. Exiting.');
      return { processed: 0, success: 0, error: 0 };
    }

    const results = {
      processed: 0,
      success: 0,
      error: 0,
      skipped: 0,
      details: []
    };

    // Process each application
    for (const appDoc of snapshot.docs) {
      const appData = appDoc.data();

      // Skip if already parsed and not failed
      if (appData.parsed === true && !appData.parseError) {
        results.skipped++;
        continue;
      }

      results.processed++;

      const result = await processApplication(appDoc);

      if (result.status === 'success') {
        results.success++;
      } else if (result.status === 'error') {
        results.error++;
      } else {
        results.skipped++;
      }

      results.details.push({
        appId: appDoc.id,
        name: appData.applicantName,
        ...result
      });

      // Rate limiting - wait 2 seconds between requests to Affinda
      if (result.status !== 'skipped') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('info', '========================================');
    log('info', 'CV Parser Agent completed');
    log('info', `Duration: ${duration}s`);
    log('info', `Total: ${snapshot.size}`);
    log('info', `Processed: ${results.processed}`);
    log('info', `Success: ${results.success}`);
    log('info', `Errors: ${results.error}`);
    log('info', `Skipped: ${results.skipped}`);
    log('info', '========================================');

    return results;

  } catch (error) {
    log('error', 'Agent failed', { error: error.message });
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runAgent()
    .then(results => {
      console.log('\n📊 Summary:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Agent failed:', error);
      process.exit(1);
    });
}

module.exports = { runAgent, parseCVWithAffinda, calculateScore };