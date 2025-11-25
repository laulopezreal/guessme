// ========================================
// Historic Figures Database
// ========================================
const historicFigures = [
    {
        name: "Albert Einstein",
        alternateNames: ["einstein"],
        clues: [
            "I was born in Germany in 1879.",
            "I won the Nobel Prize in Physics in 1921.",
            "I developed the theory of relativity.",
            "My famous equation is E=mc².",
            "I had distinctive wild white hair and often stuck out my tongue in photos."
        ]
    },
    {
        name: "Galileo Galilei",
        alternateNames: ["galileo"],
        clues: [
            "I was born in Pisa, Italy in 1564.",
            "I am known as the father of modern observational astronomy.",
            "I improved the telescope and made astronomical observations.",
            "I discovered four moons of Jupiter, now called the Galilean moons.",
            "I was tried by the Inquisition for supporting heliocentrism (the idea that Earth orbits the Sun)."
        ]
    },
    {
        name: "Leonardo da Vinci",
        alternateNames: ["leonardo", "da vinci"],
        clues: [
            "I was born in Italy in 1452.",
            "I was a polymath: artist, scientist, engineer, and inventor.",
            "I painted the Mona Lisa and The Last Supper.",
            "I designed flying machines and studied human anatomy.",
            "I wrote my notes in mirror writing (reversed text)."
        ]
    },
    {
        name: "William Shakespeare",
        alternateNames: ["shakespeare"],
        clues: [
            "I was born in Stratford-upon-Avon, England in 1564.",
            "I am considered the greatest writer in the English language.",
            "I wrote Romeo and Juliet, Hamlet, and Macbeth.",
            "I invented over 1,700 words still used in English today.",
            "I wrote 'To be or not to be, that is the question.'"
        ]
    },
    {
        name: "Marie Curie",
        alternateNames: ["curie", "marie sklodowska-curie"],
        clues: [
            "I was born in Poland in 1867.",
            "I was the first woman to win a Nobel Prize.",
            "I won Nobel Prizes in both Physics and Chemistry.",
            "I discovered the elements polonium and radium.",
            "My research on radioactivity revolutionized science and medicine."
        ]
    },
    {
        name: "Isaac Newton",
        alternateNames: ["newton"],
        clues: [
            "I was born in England in 1643.",
            "I formulated the laws of motion and universal gravitation.",
            "Legend says I discovered gravity when an apple fell on my head.",
            "I invented calculus (independently with Leibniz).",
            "I wrote 'Philosophiæ Naturalis Principia Mathematica', one of the most important scientific works ever."
        ]
    },
    {
        name: "Nikola Tesla",
        alternateNames: ["tesla"],
        clues: [
            "I was born in the Austrian Empire (modern-day Croatia) in 1856.",
            "I was a brilliant inventor and electrical engineer.",
            "I developed alternating current (AC) electrical systems.",
            "I worked briefly for Thomas Edison before becoming his rival.",
            "The Tesla coil and the unit of magnetic flux density (tesla) are named after me."
        ]
    },
    {
        name: "Napoleon Bonaparte",
        alternateNames: ["napoleon"],
        clues: [
            "I was born on the island of Corsica in 1769.",
            "I became Emperor of France in 1804.",
            "I conquered much of Europe in the early 19th century.",
            "I was exiled twice, first to Elba and then to Saint Helena.",
            "I was known for being relatively short and keeping my hand in my coat."
        ]
    },
    {
        name: "Joan of Arc",
        alternateNames: ["joan", "jeanne d'arc"],
        clues: [
            "I was a peasant girl born in France around 1412.",
            "I claimed to receive visions from God telling me to support France.",
            "I led French forces to victory at the Siege of Orléans during the Hundred Years' War.",
            "I was captured by the English and tried for heresy.",
            "I was burned at the stake at age 19 and later canonized as a saint."
        ]
    },
    {
        name: "Queen Elizabeth I",
        alternateNames: ["elizabeth i", "elizabeth", "queen elizabeth"],
        clues: [
            "I was born in England in 1533.",
            "I became Queen of England in 1558 and ruled for 45 years.",
            "My reign is known as the Elizabethan Era, a golden age of English culture.",
            "I never married and was known as the 'Virgin Queen'.",
            "During my rule, England defeated the Spanish Armada in 1588."
        ]
    }
];

// ========================================
// Game State
// ========================================
let currentFigureIndex = 0;
let currentClueIndex = 0;
let score = 0;
let round = 1;
let gameEnded = false;

// Shuffle the figures array for variety
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

let shuffledFigures = shuffleArray(historicFigures);

// ========================================
// DOM Elements
// ========================================
const scoreDisplay = document.getElementById('score');
const roundDisplay = document.getElementById('round');
const cluesContainer = document.getElementById('cluesContainer');
const feedbackMessage = document.getElementById('feedbackMessage');
const guessInput = document.getElementById('guessInput');
const submitBtn = document.getElementById('submitBtn');
const revealBtn = document.getElementById('revealBtn');
const nextBtn = document.getElementById('nextBtn');
const characterSilhouette = document.getElementById('characterSilhouette');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// ========================================
// Game Functions
// ========================================

function initializeGame() {
    currentFigureIndex = 0;
    currentClueIndex = 0;
    score = 0;
    round = 1;
    gameEnded = false;
    shuffledFigures = shuffleArray(historicFigures);

    updateDisplay();
    loadNewFigure();
    gameOverModal.classList.add('hidden');
}

function loadNewFigure() {
    if (currentFigureIndex >= shuffledFigures.length) {
        endGame();
        return;
    }

    currentClueIndex = 0;
    cluesContainer.innerHTML = '';
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'feedback-message';
    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    revealBtn.disabled = false;
    nextBtn.classList.add('hidden');
    characterSilhouette.classList.remove('revealed');

    // Reveal the first clue automatically
    revealNextClue();
}

function revealNextClue() {
    const currentFigure = shuffledFigures[currentFigureIndex];

    if (currentClueIndex < currentFigure.clues.length) {
        const clueElement = document.createElement('div');
        clueElement.className = 'clue-item';
        clueElement.innerHTML = `
            <span class="clue-number">${currentClueIndex + 1}</span>
            <span class="clue-text">${currentFigure.clues[currentClueIndex]}</span>
        `;
        cluesContainer.appendChild(clueElement);

        currentClueIndex++;

        if (currentClueIndex >= currentFigure.clues.length) {
            revealBtn.disabled = true;
            revealBtn.textContent = 'All clues revealed!';
        }
    }
}

function checkGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    const currentFigure = shuffledFigures[currentFigureIndex];

    if (!guess) {
        return;
    }

    const correctAnswers = [
        currentFigure.name.toLowerCase(),
        ...currentFigure.alternateNames.map(name => name.toLowerCase())
    ];

    const isCorrect = correctAnswers.some(answer => guess === answer);

    if (isCorrect) {
        handleCorrectGuess();
    } else {
        handleIncorrectGuess();
    }
}

function handleCorrectGuess() {
    const currentFigure = shuffledFigures[currentFigureIndex];

    // Calculate points based on how many clues were used
    const cluesUsed = currentClueIndex;
    const maxClues = currentFigure.clues.length;
    const points = Math.max(50, 100 - (cluesUsed - 1) * 10);

    score += points;

    feedbackMessage.textContent = `🎉 Correct! It's ${currentFigure.name}! You earned ${points} points!`;
    feedbackMessage.className = 'feedback-message success';

    characterSilhouette.classList.add('revealed');

    guessInput.disabled = true;
    submitBtn.disabled = true;
    revealBtn.disabled = true;
    nextBtn.classList.remove('hidden');

    updateDisplay();
}

function handleIncorrectGuess() {
    feedbackMessage.textContent = '❌ Not quite! Try again or reveal more clues.';
    feedbackMessage.className = 'feedback-message error';

    // Add a shake animation to the input
    guessInput.style.animation = 'none';
    setTimeout(() => {
        guessInput.style.animation = 'shake 0.5s';
    }, 10);
}

function nextFigure() {
    currentFigureIndex++;
    round++;
    loadNewFigure();
    updateDisplay();
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    roundDisplay.textContent = round;
}

function endGame() {
    gameEnded = true;
    finalScoreDisplay.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// ========================================
// Event Listeners
// ========================================

revealBtn.addEventListener('click', () => {
    revealNextClue();
});

submitBtn.addEventListener('click', () => {
    checkGuess();
});

guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkGuess();
    }
});

nextBtn.addEventListener('click', () => {
    nextFigure();
});

restartBtn.addEventListener('click', () => {
    initializeGame();
});

// ========================================
// Add shake animation via CSS
// ========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// ========================================
// Initialize Game on Load
// ========================================
initializeGame();
