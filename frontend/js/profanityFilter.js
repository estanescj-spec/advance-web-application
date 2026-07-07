/**
 * Frontend Profanity Filter
 * Pure JavaScript - Client-side validation and warning system
 * No external libraries required
 */

// Banned words list (same as backend for consistency)
const FRONTEND_BANNED_WORDS = [
    // Profanity
    'damn', 'crap', 'shit', 'fuck', 'fck', 'bitch', 'asshole', 'bastard',
    'dickhead', 'douchebag', 'motherfucker', 'mf', 'wtf', 'bullshit',
    'piss', 'arse', 'cock', 'pussy', 'twat', 'wanker', 'prick',
    
    // Slurs and offensive terms
    'retard', 'faggot', 'fag', 'dyke', 'whore', 'slut', 'tranny',
    'nigga', 'nigger', 'chink', 'gook', 'spic', 'wetback', 'kike',
    
    // Spam/Scam
    'click here', 'buy now', 'limited offer', 'act fast', 'urgent',
    'free money', 'make money fast', 'get rich', 'work from home',
    'viagra', 'cialis', 'casino', 'lottery', 'porn', 'xxx',
    
    // Hateful content
    'kill yourself', 'kys', 'hate', 'terrorist', 'bomb', 'violence',
    'genocide', 'rape', 'pedophile', 'pedo',
    
    // Drug references
    'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'lsd', 'ecstasy',
    'mdma', 'molly', 'xanax', 'oxycodone',
    
    // Mild profanity/slang
    'ass', 'crap', 'sucks', 'pissed', 'damn', 'hell', 'dammit',
    'bs', 'sux'
];

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text contains banned words
 * Returns { hasBanned: boolean, violations: [] }
 */
function checkTextForProfanity(text) {
    if (!text || typeof text !== 'string') {
        return { hasBanned: false, violations: [] };
    }

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const violations = [];
    const seen = new Set();

    words.forEach(word => {
        if (FRONTEND_BANNED_WORDS.includes(word) && !seen.has(word)) {
            violations.push(word);
            seen.add(word);
        }
    });

    return {
        hasBanned: violations.length > 0,
        violations: violations
    };
}

/**
 * Show warning badge on input field
 * jQuery required
 */
function showProfanityWarning($inputField, violations) {
    $inputField.addClass('border-yellow-400 border-2');
    
    if (!$inputField.next('.profanity-warning').length) {
        const warningDiv = $(`
            <div class="profanity-warning text-xs text-yellow-600 mt-1 px-3 py-1.5 bg-yellow-50 rounded-md border border-yellow-200">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Contains inappropriate language: ${violations.join(', ')}
            </div>
        `);
        $inputField.after(warningDiv);
    }
}

/**
 * Remove profanity warning
 */
function removeProfanityWarning($inputField) {
    $inputField.removeClass('border-yellow-400 border-2').addClass('border-gray-200');
    $inputField.next('.profanity-warning').remove();
}

/**
 * Real-time validation for input fields
 * jQuery required
 */
function setupProfanityRealTimeCheck(selector) {
    $(selector).on('input', function() {
        const text = $(this).val();
        const check = checkTextForProfanity(text);
        
        if (check.hasBanned) {
            showProfanityWarning($(this), check.violations);
        } else {
            removeProfanityWarning($(this));
        }
    });
}

/**
 * Form submission validation
 * Returns boolean - true if clean, false if has profanity
 */
function validateFormForProfanity(formSelector, strictMode = false) {
    let isValid = true;
    const violations = [];

    $(formSelector).find('textarea, input[type="text"], input[type="email"]').each(function() {
        const text = $(this).val();
        const check = checkTextForProfanity(text);
        
        if (check.hasBanned) {
            isValid = false;
            const fieldName = $(this).attr('name') || $(this).attr('placeholder') || 'Content';
            violations.push({
                field: fieldName,
                violations: check.violations
            });
            
            // Highlight the field
            $(this).addClass('border-red-400 border-2');
        }
    });

    if (!isValid && violations.length > 0) {
        if (strictMode) {
            const violationMessages = violations
                .map(v => `${v.field}: ${v.violations.join(', ')}`)
                .join('\n');
            alert(`Inappropriate language detected:\n\n${violationMessages}\n\nPlease revise your input.`);
        }
    }

    return isValid;
}

/**
 * Setup form with profanity validation
 * Options:
 *   - fields: selector for fields to monitor
 *   - strictMode: boolean - reject form if profanity found
 *   - warnings: boolean - show real-time warnings
 */
function setupProfanityFormValidation(formSelector, options = {}) {
    const {
        fields = 'textarea, input[type="text"]',
        strictMode = false,
        warnings = true
    } = options;

    // Setup real-time checks
    if (warnings) {
        $(formSelector).find(fields).each(function() {
            setupProfanityRealTimeCheck(this);
        });
    }

    // Setup form submission validation
    $(formSelector).on('submit', function(e) {
        if (!validateFormForProfanity(formSelector, strictMode)) {
            if (strictMode) {
                e.preventDefault();
            }
        }
    });
}

/**
 * Display notification about profanity
 */
function showProfanityNotification(message, type = 'warning') {
    const bgClass = type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700';
    const iconClass = type === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
    
    const notification = $(`
        <div class="fixed top-20 right-6 z-50 p-4 rounded-lg border ${bgClass} shadow-lg flex items-center gap-3 max-w-md">
            <i class="fa-solid ${iconClass}"></i>
            <span>${message}</span>
            <button class="ml-auto font-bold cursor-pointer" onclick="this.parentElement.remove()">×</button>
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => notification.fadeOut(300, function() { $(this).remove(); }), 5000);
}

/**
 * Batch check multiple texts
 * Returns array with results for each text
 */
function checkMultipleTexts(textsArray) {
    return textsArray.map(text => checkTextForProfanity(text));
}

/**
 * Censor banned words in text by replacing them with asterisks.
 */
function censorTextForProfanity(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    let censoredText = text;
    FRONTEND_BANNED_WORDS.forEach(term => {
        const regex = new RegExp(escapeRegExp(term), 'gi');
        censoredText = censoredText.replace(regex, '*'.repeat(term.length));
    });

    return censoredText;
}

/**
 * Get profanity statistics for text
 */
function getProfanityStats(text) {
    const check = checkTextForProfanity(text);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    return {
        totalWords: words.length,
        bannedWordsFound: check.violations.length,
        bannedWordsList: check.violations,
        profanityPercentage: words.length > 0 ? ((check.violations.length / words.length) * 100).toFixed(2) : 0,
        hasProfanity: check.hasBanned
    };
}

// Auto-initialize on document ready (if jQuery available)
if (typeof $ !== 'undefined') {
    $(document).ready(function() {
        // Example: Auto-setup all textareas and text inputs for warnings
        // Uncomment to enable globally:
        // $('textarea, input[type="text"]').each(function() {
        //     setupProfanityRealTimeCheck(this);
        // });
    });
}

// Export for use (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkTextForProfanity,
        showProfanityWarning,
        removeProfanityWarning,
        setupProfanityRealTimeCheck,
        validateFormForProfanity,
        setupProfanityFormValidation,
        showProfanityNotification,
        checkMultipleTexts,
        censorTextForProfanity,
        getProfanityStats,
        FRONTEND_BANNED_WORDS
    };
}
