/**
 * Profanity & Banned Words Filter
 * Pure JavaScript implementation - No external libraries
 * Filters profanity, spam, and inappropriate content
 */

const BANNED_WORDS = [
    // Profanity
    'damn', 'crap', 'shit', 'fuck', 'fck', 'bitch', 'asshole', 'bastard',
    'dickhead', 'douchebag', 'motherfucker', 'mf', 'wtf', 'bullshit',
    'piss', 'arse', 'cock', 'pussy', 'twat', 'wanker', 'prick',
    
    // Slurs and offensive terms (common ones)
    'retard', 'faggot', 'fag', 'dyke', 'whore', 'slut', 'tranny',
    'nigga', 'nigger', 'chink', 'gook', 'spic', 'wetback', 'kike',
    
    // Spam/Scam related
    'click here', 'buy now', 'limited offer', 'act fast', 'urgent',
    'free money', 'make money fast', 'get rich', 'work from home',
    'viagra', 'cialis', 'casino', 'lottery', 'porn', 'xxx',
    
    // Hateful content
    'kill yourself', 'kys', 'hate', 'terrorist', 'bomb', 'violence',
    'genocide', 'rape', 'pedophile', 'pedo',
    
    // Drug/illegal references
    'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'lsd', 'ecstasy',
    'mdma', 'molly', 'xanax', 'oxycodone',
    
    // Mild profanity/slang
    'ass', 'crap', 'sucks', 'pissed', 'damn', 'hell', 'dammit',
    'bs', 'sux', 'lol', // lol is informal, but include for professional contexts
];

// Additional patterns (regex)
const BANNED_PATTERNS = [
    /\b(f\s*u\s*c\s*k|sh\s*i\s*t|d\s*a\s*m\s*n)\b/gi, // spaced out versions
    /\b\d{16,}\b/g, // potential credit card numbers
    /\b(http|https):\/\/[^\s]+\b/gi, // URLs (optional, if you want to block)
];

/**
 * Check if a word is in the banned list
 * Case-insensitive
 */
function isBannedWord(word) {
    return BANNED_WORDS.some(
        banned => word.toLowerCase() === banned.toLowerCase()
    );
}

/**
 * Extract all words from text
 */
function extractWords(text) {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
}

/**
 * Check if text contains any banned words
 * Returns { hasBanned: boolean, violations: string[] }
 */
function checkForBannedWords(text) {
    if (!text || typeof text !== 'string') {
        return { hasBanned: false, violations: [] };
    }

    const words = extractWords(text);
    const violations = [];
    const seen = new Set();

    words.forEach(word => {
        if (isBannedWord(word) && !seen.has(word.toLowerCase())) {
            violations.push(word.toLowerCase());
            seen.add(word.toLowerCase());
        }
    });

    // Check patterns
    BANNED_PATTERNS.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                if (!seen.has(match.toLowerCase())) {
                    violations.push(match.toLowerCase());
                    seen.add(match.toLowerCase());
                }
            });
        }
    });

    return {
        hasBanned: violations.length > 0,
        violations: Array.from(violations)
    };
}

/**
 * Censor banned words in text
 * Replaces each character with asterisks (maintains word length)
 */
function censorBannedWords(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    let result = text;

    // Replace word boundaries
    BANNED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const censored = '*'.repeat(word.length);
        result = result.replace(regex, censored);
    });

    // Replace pattern matches
    BANNED_PATTERNS.forEach(pattern => {
        result = result.replace(pattern, match => '*'.repeat(match.length));
    });

    return result;
}

/**
 * Sanitize user input - removes/replaces banned content
 * Returns sanitized text
 */
function sanitizeInput(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return censorBannedWords(text).trim();
}

/**
 * Validate field - check for profanity and return validation result
 * Returns { isValid: boolean, message: string, sanitized: string }
 */
function validateField(text, fieldName = 'Content', strict = false) {
    const check = checkForBannedWords(text);
    const sanitized = censorBannedWords(text);

    if (check.hasBanned) {
        if (strict) {
            // Strict mode: reject the input entirely
            return {
                isValid: false,
                message: `${fieldName} contains inappropriate language: ${check.violations.join(', ')}. Please revise.`,
                sanitized: sanitized,
                violations: check.violations
            };
        } else {
            // Non-strict mode: allow but censor
            return {
                isValid: true,
                message: `${fieldName} contained inappropriate language and has been censored.`,
                sanitized: sanitized,
                violations: check.violations
            };
        }
    }

    return {
        isValid: true,
        message: 'Content is clean',
        sanitized: text,
        violations: []
    };
}

/**
 * Get statistics about banned words in text
 */
function getStatistics(text) {
    const check = checkForBannedWords(text);
    const words = extractWords(text);

    return {
        totalWords: words.length,
        bannedWordsFound: check.violations.length,
        bannedWordsList: check.violations,
        profanityPercentage: words.length > 0 ? ((check.violations.length / words.length) * 100).toFixed(2) : 0
    };
}

/**
 * Add custom banned words (useful for domain-specific filtering)
 */
function addBannedWords(wordsArray) {
    if (Array.isArray(wordsArray)) {
        wordsArray.forEach(word => {
            if (word && typeof word === 'string' && !isBannedWord(word)) {
                BANNED_WORDS.push(word.toLowerCase());
            }
        });
    }
}

/**
 * Get all current banned words
 */
function getBannedWordsList() {
    return [...BANNED_WORDS];
}

/**
 * Remove a word from banned list (for admin management)
 */
function removeBannedWord(word) {
    const index = BANNED_WORDS.findIndex(
        w => w.toLowerCase() === word.toLowerCase()
    );
    if (index > -1) {
        BANNED_WORDS.splice(index, 1);
        return true;
    }
    return false;
}

module.exports = {
    checkForBannedWords,
    censorBannedWords,
    sanitizeInput,
    validateField,
    getStatistics,
    isBannedWord,
    addBannedWords,
    getBannedWordsList,
    removeBannedWord,
    BANNED_WORDS: Object.freeze([...BANNED_WORDS]) // Export as read-only
};
