const badWords = [
  "putangina",
  "puta",
  "tangina",
  "gago",
  "bobo",
  "ulol",
  "inutil",
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "motherfucker",
  "damn",
  "nigga",
  "nigger",
  "cunt",
  "whore",
  "slut",
  "dick",
  "pussy",
  "bastard",
  "tanginamo",
  "putangina mo",
  "putang ina mo",
  "bitch",
  "ass",
  "whore",
];

function censorProfanity(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let censoredText = text;

  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    
    censoredText = censoredText.replace(regex, (match) => {
      return '*'.repeat(match.length);
    });
  });

  return censoredText;
}

function hasProfanity(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return badWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
}

function getDetectedWords(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const detected = [];
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      detected.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return [...new Set(detected)];
}

module.exports = {
  censorProfanity,
  hasProfanity,
  getDetectedWords,
  badWords
};
