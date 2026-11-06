import type { HistoricFigure } from '../types';

export interface HistoricFigureConfig extends HistoricFigure {
  enabled: boolean;
}

/**
 * Figure Configuration
 *
 * This file is the single source of truth for the roster. It is imported by
 * the React app and by the Cloudflare Worker that proxies AI requests, so it
 * must stay free of browser-only or Node-only code.
 *
 * To add a new figure:
 * 1. Add a new object to the array below
 * 2. Set enabled: true when ready
 *
 * To edit a figure:
 * - Update the properties directly
 *
 * To remove a figure:
 * - Set enabled: false (soft delete, keeps data)
 * - Or remove the object entirely (hard delete)
 */

export const allFigures: HistoricFigureConfig[] = [
  {
    enabled: true,
    name: "Albert Einstein",
    alternateNames: ["einstein", "albert", "albert einstein"],
    eraTags: ["Modern Era", "Physics"],
    voiceLine: "Imagination will take you everywhere—ready for your next thought experiment?",
    clues: [
      { text: "I was born in Germany in 1879.", difficulty: 'hard' },
      { text: "I won the Nobel Prize in Physics in 1921.", difficulty: 'medium' },
      { text: "I developed the theory of relativity.", difficulty: 'medium' },
      { text: "My famous equation is E=mc².", difficulty: 'easy' },
      { text: "I had distinctive wild white hair and often stuck out my tongue in photos.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Marie Curie",
    alternateNames: ["curie", "marie", "marie curie", "madame curie", "marie sklodowska-curie", "sklodowska"],
    eraTags: ["Industrial Age", "Chemistry"],
    voiceLine: "Nothing in life is to be feared—it is only to be understood. Onward?",
    clues: [
      { text: "I was born in Poland in 1867.", difficulty: 'hard' },
      { text: "I was the first woman to win a Nobel Prize.", difficulty: 'medium' },
      { text: "I won Nobel Prizes in both Physics and Chemistry.", difficulty: 'medium' },
      { text: "I discovered the elements polonium and radium.", difficulty: 'easy' },
      { text: "My research on radioactivity revolutionized science and medicine.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Leonardo da Vinci",
    alternateNames: ["leonardo", "da vinci", "leonardo da vinci"],
    eraTags: ["Renaissance", "Art & Invention"],
    voiceLine: "Simplicity is the ultimate sophistication. Ready for another masterpiece?",
    clues: [
      { text: "I was born in Italy in 1452.", difficulty: 'hard' },
      { text: "I was a polymath: artist, scientist, engineer, and inventor.", difficulty: 'medium' },
      { text: "I painted the Mona Lisa and The Last Supper.", difficulty: 'medium' },
      { text: "I designed flying machines and studied human anatomy.", difficulty: 'easy' },
      { text: "I wrote my notes in mirror writing (reversed text).", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "William Shakespeare",
    alternateNames: ["shakespeare", "william", "william shakespeare"],
    eraTags: ["Elizabethan", "Literature"],
    voiceLine: "All the world's a stage—shall we play another round?",
    clues: [
      { text: "I was born in Stratford-upon-Avon, England in 1564.", difficulty: 'hard' },
      { text: "I am considered the greatest writer in the English language.", difficulty: 'medium' },
      { text: "I wrote Romeo and Juliet, Hamlet, and Macbeth.", difficulty: 'medium' },
      { text: "I invented over 1,700 words still used in English today.", difficulty: 'easy' },
      { text: "I wrote 'To be or not to be, that is the question.'", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Nikola Tesla",
    alternateNames: ["tesla", "nikola", "nikola tesla"],
    eraTags: ["Industrial Age", "Engineering"],
    voiceLine: "The present is theirs; the future is mine. Ready to spark another idea?",
    clues: [
      { text: "I was born in the Austrian Empire (modern-day Croatia) in 1856.", difficulty: 'hard' },
      { text: "I was a brilliant inventor and electrical engineer.", difficulty: 'medium' },
      { text: "I developed alternating current (AC) electrical systems.", difficulty: 'medium' },
      { text: "I worked briefly for Thomas Edison before becoming his rival.", difficulty: 'easy' },
      { text: "A coil that throws spectacular high-voltage sparks and the SI unit of magnetic flux density are both named after me.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Galileo Galilei",
    alternateNames: ["galileo", "galilei", "galileo galilei"],
    eraTags: ["Renaissance", "Astronomy"],
    voiceLine: "And yet it moves. Care to observe more?",
    clues: [
      { text: "I was born in Pisa, Italy in 1564.", difficulty: 'hard' },
      { text: "I am known as the father of modern observational astronomy.", difficulty: 'medium' },
      { text: "I improved the telescope and made astronomical observations.", difficulty: 'medium' },
      { text: "I discovered four moons of Jupiter, now called the Galilean moons.", difficulty: 'easy' },
      { text: "I was tried by the Inquisition for supporting heliocentrism (the idea that Earth orbits the Sun).", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Isaac Newton",
    alternateNames: ["newton", "isaac", "isaac newton"],
    eraTags: ["Scientific Revolution", "Mathematics"],
    voiceLine: "If I have seen further, it is by standing on shoulders—care to climb higher?",
    clues: [
      { text: "I was born in England in 1643.", difficulty: 'hard' },
      { text: "I formulated the laws of motion and universal gravitation.", difficulty: 'medium' },
      { text: "Legend says I discovered gravity when an apple fell on my head.", difficulty: 'medium' },
      { text: "I invented calculus (independently with Leibniz).", difficulty: 'easy' },
      { text: "I wrote 'Philosophiæ Naturalis Principia Mathematica', one of the most important scientific works ever.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Napoleon Bonaparte",
    alternateNames: ["napoleon", "bonaparte", "napoleon bonaparte"],
    eraTags: ["Napoleonic Era", "Military"],
    voiceLine: "Impossible is a word to be found only in the dictionary of fools. March to the next battle?",
    clues: [
      { text: "I was born on the island of Corsica in 1769.", difficulty: 'hard' },
      { text: "I became Emperor of France in 1804.", difficulty: 'medium' },
      { text: "I conquered much of Europe in the early 19th century.", difficulty: 'medium' },
      { text: "I was exiled twice, first to Elba and then to Saint Helena.", difficulty: 'easy' },
      { text: "I was known for being relatively short and keeping my hand in my coat.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Joan of Arc",
    alternateNames: ["joan", "joan of arc", "jeanne d'arc", "saint joan"],
    eraTags: ["Middle Ages", "Leadership"],
    voiceLine: "I am not afraid—I was born to do this. Shall we ride again?",
    clues: [
      { text: "I was a peasant girl born in France around 1412.", difficulty: 'hard' },
      { text: "I claimed to receive visions from God telling me to support France.", difficulty: 'medium' },
      { text: "I led French forces to victory at the Siege of Orléans during the Hundred Years' War.", difficulty: 'medium' },
      { text: "I was captured by the English and tried for heresy.", difficulty: 'easy' },
      { text: "I was burned at the stake at age 19 and later canonized as a saint.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Queen Elizabeth I",
    alternateNames: ["elizabeth i", "elizabeth", "queen elizabeth", "queen elizabeth i", "elizabeth tudor"],
    eraTags: ["Elizabethan", "Statesmanship"],
    voiceLine: "I know I have the body of a weak and feeble woman, but the heart of a king. Ready for another reign?",
    clues: [
      { text: "I was born in England in 1533.", difficulty: 'hard' },
      { text: "I became Queen of England in 1558 and ruled for 45 years.", difficulty: 'medium' },
      { text: "My reign is remembered as a golden age of English drama, poetry and seafaring exploration.", difficulty: 'medium' },
      { text: "I never married and was known as the 'Virgin Queen'.", difficulty: 'easy' },
      { text: "During my rule, England defeated the Spanish Armada in 1588.", difficulty: 'easy' }
    ]
  },
  // ─── Ancient world ───────────────────────────────────────────────────────
  {
    enabled: true,
    name: "Hatshepsut",
    alternateNames: ["hatshepsut", "queen hatshepsut", "pharaoh hatshepsut"],
    eraTags: ["Ancient Egypt", "Rulers"],
    voiceLine: "My monuments still stand; let them speak for me. Another reign?",
    clues: [
      { text: "I ruled in Egypt more than 3,400 years ago, during the New Kingdom.", difficulty: 'hard' },
      { text: "I came to power as regent for my young stepson, then took the full title of pharaoh for myself.", difficulty: 'medium' },
      { text: "My reign was peaceful and prosperous, remembered for a great trading expedition to the land of Punt.", difficulty: 'medium' },
      { text: "I was one of the very few women to rule Egypt as pharaoh, and my statues show me with a false beard and male royal regalia.", difficulty: 'easy' },
      { text: "My terraced mortuary temple at Deir el-Bahari near Luxor still stands, and after my death a successor tried to chisel my name out of history.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Tutankhamun",
    alternateNames: ["tutankhamun", "tutankhamen", "king tut", "tut"],
    eraTags: ["Ancient Egypt", "Rulers"],
    voiceLine: "A boy on the throne, a golden mask for eternity. Another round?",
    clues: [
      { text: "I ruled Egypt during the 18th Dynasty, more than 3,300 years ago.", difficulty: 'hard' },
      { text: "I became pharaoh as a child of about nine and died while still a teenager.", difficulty: 'medium' },
      { text: "During my reign Egypt restored the worship of its traditional gods after my predecessor's religious upheaval.", difficulty: 'medium' },
      { text: "My tomb in the Valley of the Kings was found almost intact in 1922 by the archaeologist Howard Carter.", difficulty: 'easy' },
      { text: "My solid gold funerary mask is one of the most famous objects ever unearthed, and people often call me the Boy King.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Cleopatra",
    alternateNames: ["cleopatra", "cleopatra vii", "queen cleopatra"],
    eraTags: ["Ancient Egypt", "Rulers"],
    voiceLine: "Rome wrote my story; now you write the next one. Another round?",
    clues: [
      { text: "I was born in 69 BC into the Ptolemaic dynasty, a Greek-speaking royal family that ruled Egypt for nearly three centuries.", difficulty: 'hard' },
      { text: "I was highly educated and politically shrewd, and reportedly the first ruler of my dynasty to learn the Egyptian language.", difficulty: 'medium' },
      { text: "I allied myself with two of Rome's most powerful men, Julius Caesar and Mark Antony.", difficulty: 'medium' },
      { text: "I was the last active ruler of Egypt's Ptolemaic Kingdom; after my death Egypt became a province of Rome.", difficulty: 'easy' },
      { text: "Legend says I died from the bite of an asp, and Elizabeth Taylor played me in a famous 1963 film.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Confucius",
    alternateNames: ["confucius", "kong qiu", "kongzi", "kong fuzi", "master kong"],
    eraTags: ["Ancient China", "Philosophy"],
    voiceLine: "The man who moves a mountain begins by carrying away small stones. Shall we begin again?",
    clues: [
      { text: "I was born in 551 BC in the state of Lu, in what is now Shandong Province, China.", difficulty: 'hard' },
      { text: "I worked as a minor official and then as a travelling teacher, seeking a ruler who would adopt my ideas on good government.", difficulty: 'medium' },
      { text: "I taught that a good society rests on virtue, respect for elders, proper ritual and the duties of family.", difficulty: 'medium' },
      { text: "My sayings were collected by my students in a book known as the Analects.", difficulty: 'easy' },
      { text: "My philosophy shaped Chinese civilisation for more than two thousand years, and the school of thought bearing my name is still followed today.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Socrates",
    alternateNames: ["socrates"],
    eraTags: ["Ancient Greece", "Philosophy"],
    voiceLine: "The unexamined life is not worth living. Shall we examine another?",
    clues: [
      { text: "I lived in Athens in the fifth century BC and served as a foot soldier in the Peloponnesian War.", difficulty: 'hard' },
      { text: "I wrote nothing down; what we know of me comes mainly from the dialogues of my student Plato.", difficulty: 'medium' },
      { text: "I taught by asking question after question in the marketplace, a method of inquiry still named after me.", difficulty: 'medium' },
      { text: "I was put on trial in 399 BC, accused of corrupting the young and of not believing in the city's gods.", difficulty: 'easy' },
      { text: "Sentenced to death, I drank a cup of poison hemlock surrounded by my friends.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Archimedes",
    alternateNames: ["archimedes", "archimedes of syracuse"],
    eraTags: ["Ancient Greece", "Mathematics"],
    voiceLine: "Give me a place to stand and I will move the Earth. Shall we lift another?",
    clues: [
      { text: "I was born around 287 BC in Syracuse, a Greek city on the island of Sicily.", difficulty: 'hard' },
      { text: "I was a mathematician, physicist and engineer, and I calculated a remarkably accurate value for pi.", difficulty: 'medium' },
      { text: "I explained the principle of the lever and designed war machines to defend my city against the Romans.", difficulty: 'medium' },
      { text: "A screw pump for raising water and a principle about buoyancy both bear my name.", difficulty: 'easy' },
      { text: "Legend says I shouted 'Eureka!' and leapt from my bath when I realised how to measure the volume of an irregular object.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Alexander the Great",
    alternateNames: ["alexander", "alexander the great", "alexander iii", "alexander iii of macedon", "alexander of macedon"],
    eraTags: ["Ancient Greece", "Military"],
    voiceLine: "There is nothing impossible to him who will try. Onward to the next conquest?",
    clues: [
      { text: "I was born in 356 BC in Pella, the capital of the kingdom of Macedon.", difficulty: 'hard' },
      { text: "As a boy I was tutored by the philosopher Aristotle, and I became king at twenty after my father was assassinated.", difficulty: 'medium' },
      { text: "In little more than a decade I conquered the Persian Empire and marched my army as far as India.", difficulty: 'medium' },
      { text: "I founded many cities named after myself, including the one in Egypt famous for its lighthouse and its library.", difficulty: 'easy' },
      { text: "I died in Babylon at 32, undefeated in battle, and my beloved horse was called Bucephalus.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Julius Caesar",
    alternateNames: ["caesar", "julius", "julius caesar", "gaius julius caesar"],
    eraTags: ["Ancient Rome", "Statesmanship"],
    voiceLine: "I came, I saw, I conquered. Shall we cross another Rubicon?",
    clues: [
      { text: "I was born in Rome in 100 BC into an old patrician family.", difficulty: 'hard' },
      { text: "I conquered Gaul in a series of campaigns and wrote my own account of the war.", difficulty: 'medium' },
      { text: "I crossed the Rubicon river with my army, starting a civil war that ended the old order of the Roman Republic.", difficulty: 'medium' },
      { text: "I was named dictator for life, I reformed the calendar, and the month of July is named after me.", difficulty: 'easy' },
      { text: "I was assassinated on the Ides of March, 44 BC, by a group of senators that included Brutus.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Boudica",
    alternateNames: ["boudica", "boudicca", "boadicea", "queen boudica", "queen boudicca"],
    eraTags: ["Roman Britain", "Leadership"],
    voiceLine: "On this field we conquer or we die with glory. Will you ride with me again?",
    clues: [
      { text: "I lived in eastern Britain in the first century AD, when the island was a new province of Rome.", difficulty: 'hard' },
      { text: "I was queen of the Iceni tribe; after my husband's death the Romans seized our lands and mistreated my family.", difficulty: 'medium' },
      { text: "I united several British tribes in a great revolt and burned the Roman settlements at Colchester, London and St Albans.", difficulty: 'medium' },
      { text: "A Roman historian described me as very tall and fierce, with a great mass of tawny hair falling to my hips.", difficulty: 'easy' },
      { text: "My rebellion was crushed, but today a bronze statue of me driving a chariot stands beside Westminster Bridge in London.", difficulty: 'easy' }
    ]
  },
  // ─── Medieval and early modern ───────────────────────────────────────────
  {
    enabled: true,
    name: "Wu Zetian",
    alternateNames: ["wu zetian", "empress wu", "wu zhao", "zetian", "wu"],
    eraTags: ["Imperial China", "Rulers"],
    voiceLine: "Heaven itself made room for me on the throne. Shall we rule another round?",
    clues: [
      { text: "I was born in China in 624, during the early years of the Tang dynasty.", difficulty: 'hard' },
      { text: "I entered the palace as a young concubine and rose to become empress consort, then ruled through my husband and my sons.", difficulty: 'medium' },
      { text: "I expanded the civil service examinations and supported Buddhism, commissioning enormous temple statues.", difficulty: 'medium' },
      { text: "In 690 I proclaimed my own dynasty, the Zhou, and took the throne in my own name.", difficulty: 'easy' },
      { text: "I am the only woman in more than two thousand years of Chinese history to rule as emperor in her own right.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Murasaki Shikibu",
    alternateNames: ["murasaki shikibu", "murasaki", "lady murasaki", "shikibu"],
    eraTags: ["Heian Japan", "Literature"],
    voiceLine: "I wrote of a shining prince; now let me see what you can guess. Another chapter?",
    clues: [
      { text: "I was born in Japan in the 970s, during the Heian period, into a family of scholars and poets.", difficulty: 'hard' },
      { text: "As a girl I secretly learned classical Chinese, a subject thought improper for women, by listening to my brother's lessons.", difficulty: 'medium' },
      { text: "I served as a lady-in-waiting to Empress Shōshi at the imperial court in Kyoto.", difficulty: 'medium' },
      { text: "I wrote The Tale of Genji, the story of a shining prince and his loves at court.", difficulty: 'easy' },
      { text: "My story, written more than a thousand years ago, is often called the world's first novel.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Avicenna",
    alternateNames: ["avicenna", "ibn sina", "ibn sīnā", "abu ali ibn sina"],
    eraTags: ["Islamic Golden Age", "Medicine"],
    voiceLine: "Medicine is the knowledge of health and of its loss. Shall we diagnose another?",
    clues: [
      { text: "I was born around 980 near Bukhara, in what is now Uzbekistan, and had memorised the Quran by the age of ten.", difficulty: 'hard' },
      { text: "I was a Persian polymath: physician, philosopher, astronomer and poet, writing mainly in Arabic.", difficulty: 'medium' },
      { text: "I wrote some 450 works, and my philosophy built on Aristotle and influenced thinkers in both the Islamic world and medieval Europe.", difficulty: 'medium' },
      { text: "My medical encyclopaedia, The Canon of Medicine, was a standard textbook in European universities for some six hundred years.", difficulty: 'easy' },
      { text: "I am known in the West by a Latinised form of my Arabic name and am often called the father of early modern medicine.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Mansa Musa",
    alternateNames: ["mansa musa", "musa", "musa i", "musa i of mali", "musa keita"],
    eraTags: ["Medieval Africa", "Rulers"],
    voiceLine: "Gold flowed wherever I walked. Shall we journey on?",
    clues: [
      { text: "I ruled a West African empire in the early 14th century, from about 1312 to 1337.", difficulty: 'hard' },
      { text: "My empire controlled the great trade routes across the Sahara, dealing in salt and above all in gold.", difficulty: 'medium' },
      { text: "I made a famous pilgrimage to Mecca with a caravan of thousands, giving away so much gold that prices in Cairo were disrupted for years.", difficulty: 'medium' },
      { text: "I built mosques and schools in Timbuktu, turning it into a centre of Islamic learning.", difficulty: 'easy' },
      { text: "As ruler of the Mali Empire, I am often described as the richest person who ever lived.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Marco Polo",
    alternateNames: ["marco polo", "polo", "marco"],
    eraTags: ["Middle Ages", "Exploration"],
    voiceLine: "I have not told half of what I saw. Shall we travel on?",
    clues: [
      { text: "I was born in Venice around 1254, into a family of merchants.", difficulty: 'hard' },
      { text: "At seventeen I set off with my father and uncle on a journey along the Silk Road that would last 24 years.", difficulty: 'medium' },
      { text: "I spent years in the service of Kublai Khan, the Mongol emperor of China.", difficulty: 'medium' },
      { text: "Back in Italy, I dictated an account of my travels while held prisoner after a war with Genoa.", difficulty: 'easy' },
      { text: "My book about the wonders of the East inspired later explorers, including Christopher Columbus, and a children's swimming-pool game bears my name.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Ibn Battuta",
    alternateNames: ["ibn battuta", "battuta", "ibn batuta", "ibn battutah"],
    eraTags: ["Middle Ages", "Exploration"],
    voiceLine: "I set out for Mecca and did not stop for thirty years. Where to next?",
    clues: [
      { text: "I was born in Tangier, Morocco, in 1304, and trained as an Islamic legal scholar.", difficulty: 'hard' },
      { text: "At 21 I left home on pilgrimage to Mecca and did not return for nearly thirty years.", difficulty: 'medium' },
      { text: "I travelled through North and West Africa, the Middle East, India, Central Asia and China, serving as a judge in Delhi along the way.", difficulty: 'medium' },
      { text: "I covered some 75,000 miles, far more than any other known traveller of the Middle Ages.", difficulty: 'easy' },
      { text: "My journeys were written down in a book called the Rihla, and I am often called the greatest traveller of the medieval Muslim world.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Zheng He",
    alternateNames: ["zheng he", "zheng", "cheng ho", "admiral zheng he", "ma he"],
    eraTags: ["Ming China", "Exploration"],
    voiceLine: "We have crossed a hundred thousand li of immense water. Shall we set sail again?",
    clues: [
      { text: "I was born in Yunnan, China, in 1371, into a Muslim family, and was taken into the imperial household as a boy.", difficulty: 'hard' },
      { text: "I became a trusted eunuch of the Yongle Emperor of the Ming dynasty, who put me in command of his fleets.", difficulty: 'medium' },
      { text: "Between 1405 and 1433 I led seven great expeditions across the Indian Ocean, reaching Arabia and the east coast of Africa.", difficulty: 'medium' },
      { text: "My fleets were enormous, with hundreds of ships and tens of thousands of men, including giant 'treasure ships' far larger than European vessels of the time.", difficulty: 'easy' },
      { text: "I am remembered as China's greatest admiral and explorer, and a giraffe I brought back from Africa amazed the imperial court.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Johannes Gutenberg",
    alternateNames: ["gutenberg", "johannes", "johannes gutenberg", "johann gutenberg"],
    eraTags: ["Renaissance", "Invention"],
    voiceLine: "Words were once copied by hand; I made them multiply. Another page?",
    clues: [
      { text: "I was born in Mainz, Germany, around 1400, and worked as a goldsmith and metalworker.", difficulty: 'hard' },
      { text: "I spent years and borrowed heavily to perfect a secret invention, then lost my workshop in a lawsuit brought by my financier.", difficulty: 'medium' },
      { text: "My invention combined movable metal type, oil-based ink and a modified screw press.", difficulty: 'medium' },
      { text: "Around 1455 I printed a Latin Bible with 42 lines per page, a landmark of the printing revolution.", difficulty: 'easy' },
      { text: "I introduced printing with movable type to Europe, making books cheap enough for knowledge to spread as never before.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Michelangelo",
    alternateNames: ["michelangelo", "michelangelo buonarroti", "buonarroti"],
    eraTags: ["Renaissance", "Art"],
    voiceLine: "I saw the angel in the marble and carved until I set him free. Shall we carve another?",
    clues: [
      { text: "I was born in 1475 in Tuscany and trained in Florence, where the Medici family became my patrons.", difficulty: 'hard' },
      { text: "I was a sculptor, painter, architect and poet, and I kept working almost until my death at 88.", difficulty: 'medium' },
      { text: "I carved the Pietà and a seventeen-foot marble statue of David while still in my twenties.", difficulty: 'medium' },
      { text: "I spent four years painting the ceiling of the Sistine Chapel, including the scene of God creating Adam.", difficulty: 'easy' },
      { text: "I designed the dome of St Peter's Basilica in Rome, and I was a rival of Leonardo da Vinci.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Suleiman the Magnificent",
    alternateNames: ["suleiman", "suleiman the magnificent", "suleiman i", "suleyman", "süleyman", "süleyman the magnificent", "suleiman the lawgiver", "sultan suleiman"],
    eraTags: ["Ottoman Empire", "Rulers"],
    voiceLine: "An empire at its zenith, a law for every subject. Another round?",
    clues: [
      { text: "I was born in 1494 in Trabzon, on the Black Sea coast of what is now Turkey, and became sultan in 1520.", difficulty: 'hard' },
      { text: "I ruled the Ottoman Empire for 46 years, longer than any other sultan, and led its armies into Hungary and to the gates of Vienna.", difficulty: 'medium' },
      { text: "My subjects called me the Lawgiver for the way I reformed the empire's legal system; I was also a poet and a trained goldsmith.", difficulty: 'medium' },
      { text: "My reign was the golden age of Ottoman art and architecture; my chief architect, Mimar Sinan, built the great mosque in Istanbul that bears my name.", difficulty: 'easy' },
      { text: "I married my favourite concubine, Roxelana, breaking royal custom, and in the West I am remembered by an epithet praising my splendour.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Montezuma II",
    alternateNames: ["montezuma", "moctezuma", "montezuma ii", "moctezuma ii", "motecuhzoma"],
    eraTags: ["Aztec Empire", "Rulers"],
    voiceLine: "My city floated on a lake and shone like a jewel. Shall we meet again?",
    clues: [
      { text: "I was born around 1466 and from 1502 ruled a great empire in central Mexico.", difficulty: 'hard' },
      { text: "My capital, Tenochtitlan, was built on an island in a lake and was one of the largest cities in the world at the time.", difficulty: 'medium' },
      { text: "Under my rule the empire reached its greatest size, demanding tribute from many conquered peoples.", difficulty: 'medium' },
      { text: "In 1519 I received the Spanish conquistador Hernán Cortés in my palace, and was soon taken captive by him.", difficulty: 'easy' },
      { text: "I was the ninth emperor of the Aztecs, ruling when the Spanish arrived, and I died in 1520 during the conquest.", difficulty: 'easy' }
    ]
  },
  // ─── 18th and 19th century ───────────────────────────────────────────────
  {
    enabled: true,
    name: "Wolfgang Amadeus Mozart",
    alternateNames: ["mozart", "wolfgang", "amadeus", "wolfgang amadeus mozart", "wolfgang mozart"],
    eraTags: ["Classical Era", "Music"],
    voiceLine: "I composed before I could write my letters. Shall we play on?",
    clues: [
      { text: "I was born in Salzburg, Austria, in 1756, the son of a court musician.", difficulty: 'hard' },
      { text: "A child prodigy, I performed for European royalty from the age of six and composed my first symphony at eight.", difficulty: 'medium' },
      { text: "I wrote more than 600 works in my short life, including symphonies, concertos, chamber music and operas.", difficulty: 'medium' },
      { text: "My operas include The Marriage of Figaro, Don Giovanni and The Magic Flute.", difficulty: 'easy' },
      { text: "I died in Vienna in 1791 at just 35, leaving my Requiem unfinished; a famous film about my life is titled with my middle name.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Ludwig van Beethoven",
    alternateNames: ["beethoven", "ludwig", "ludwig van beethoven", "van beethoven"],
    eraTags: ["Classical Era", "Music"],
    voiceLine: "Music is a higher revelation than all wisdom and philosophy. Shall we play on?",
    clues: [
      { text: "I was born in Bonn, Germany, in 1770, and moved to Vienna in my early twenties.", difficulty: 'hard' },
      { text: "I studied briefly with Haydn, and my music bridges the Classical and Romantic eras.", difficulty: 'medium' },
      { text: "I began losing my hearing in my late twenties and was almost completely deaf for the last decade of my life, yet I kept composing.", difficulty: 'medium' },
      { text: "My Fifth Symphony opens with four of the most famous notes in music: da-da-da-DUM.", difficulty: 'easy' },
      { text: "My Ninth Symphony ends with the choral 'Ode to Joy', and I wrote the piano pieces known as 'Für Elise' and the 'Moonlight Sonata'.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Catherine the Great",
    alternateNames: ["catherine", "catherine the great", "catherine ii", "catherine ii of russia", "empress catherine"],
    eraTags: ["Age of Enlightenment", "Rulers"],
    voiceLine: "I praise loudly; I blame softly. Shall we reign again?",
    clues: [
      { text: "I was born in 1729 in Stettin, Prussia, a minor German princess, and moved to Russia at fourteen to marry the heir to the throne.", difficulty: 'hard' },
      { text: "I came to power in 1762 in a coup that overthrew my own husband, and I ruled for 34 years.", difficulty: 'medium' },
      { text: "I corresponded with Voltaire, founded schools, and amassed a vast art collection that became the Hermitage Museum.", difficulty: 'medium' },
      { text: "Under my rule Russia expanded greatly, taking Crimea and much of Poland and reaching the Black Sea.", difficulty: 'easy' },
      { text: "I was Russia's longest-reigning female ruler and am remembered as its most famous empress.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "George Washington",
    alternateNames: ["washington", "george", "george washington", "president washington"],
    eraTags: ["American Revolution", "Statesmanship"],
    voiceLine: "It is better to offer no excuse than a bad one. Shall we take another turn?",
    clues: [
      { text: "I was born in Virginia in 1732 and worked as a land surveyor and planter before becoming a soldier.", difficulty: 'hard' },
      { text: "I commanded the Continental Army during the American War of Independence.", difficulty: 'medium' },
      { text: "I famously crossed the icy Delaware River on Christmas night 1776 to surprise the enemy at Trenton.", difficulty: 'medium' },
      { text: "I presided over the convention that wrote the United States Constitution and was unanimously chosen as the nation's first president.", difficulty: 'easy' },
      { text: "My face is on the one-dollar bill, the US capital is named after me, and legend says I could not tell a lie about a cherry tree.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Simón Bolívar",
    alternateNames: ["bolivar", "bolívar", "simon bolivar", "simón bolívar", "simon", "simón", "el libertador", "the liberator"],
    eraTags: ["Age of Revolution", "Leadership"],
    voiceLine: "A people that loves freedom will in the end be free. Shall we march on?",
    clues: [
      { text: "I was born in Caracas in 1783 into a wealthy Creole family, and was orphaned as a boy.", difficulty: 'hard' },
      { text: "Educated in Europe, I swore an oath to free my homeland from Spanish rule.", difficulty: 'medium' },
      { text: "I led the independence struggle that freed Venezuela, Colombia, Ecuador, Peru and Bolivia from Spain.", difficulty: 'medium' },
      { text: "One of those countries is named after me, and I dreamed of uniting South America into one great republic.", difficulty: 'easy' },
      { text: "Statues of me on horseback stand in capitals across Latin America, where I am honoured as the man who freed a continent.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Jane Austen",
    alternateNames: ["austen", "jane", "jane austen"],
    eraTags: ["Regency England", "Literature"],
    voiceLine: "It is a truth universally acknowledged that you want another round.",
    clues: [
      { text: "I was born in Hampshire, England, in 1775, the daughter of a country clergyman.", difficulty: 'hard' },
      { text: "I wrote six novels about the manners, marriages and money troubles of the English gentry.", difficulty: 'medium' },
      { text: "My books were published anonymously during my lifetime; the first was credited simply to 'A Lady'.", difficulty: 'medium' },
      { text: "My novels include Sense and Sensibility, Emma and Persuasion.", difficulty: 'easy' },
      { text: "My best-known book opens with 'It is a truth universally acknowledged' and follows Elizabeth Bennet and Mr Darcy.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Charles Darwin",
    alternateNames: ["darwin", "charles", "charles darwin"],
    eraTags: ["Victorian Era", "Biology"],
    voiceLine: "There is grandeur in this view of life. Shall we look closer?",
    clues: [
      { text: "I was born in Shrewsbury, England, in 1809, and studied medicine and then theology before turning to natural history.", difficulty: 'hard' },
      { text: "I spent five years sailing around the world as the naturalist aboard HMS Beagle.", difficulty: 'medium' },
      { text: "The finches and giant tortoises I studied on the Galápagos Islands helped shape my ideas.", difficulty: 'medium' },
      { text: "In 1859 I published On the Origin of Species, proposing evolution by natural selection.", difficulty: 'easy' },
      { text: "My theory that all life shares common ancestry transformed biology; I am buried in Westminster Abbey, near Isaac Newton.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Abraham Lincoln",
    alternateNames: ["lincoln", "abraham", "abraham lincoln", "abe lincoln", "honest abe", "president lincoln"],
    eraTags: ["American Civil War", "Statesmanship"],
    voiceLine: "Government of the people, by the people, for the people. Shall we go another round?",
    clues: [
      { text: "I was born in a log cabin in Kentucky in 1809 and had barely a year of formal schooling.", difficulty: 'hard' },
      { text: "A self-taught lawyer, I served in the Illinois legislature and one term in Congress before running for president.", difficulty: 'medium' },
      { text: "I led the United States through its Civil War and issued the Emancipation Proclamation in 1863.", difficulty: 'medium' },
      { text: "My Gettysburg Address, only a few minutes long, is among the most famous speeches in American history.", difficulty: 'easy' },
      { text: "I was the 16th US president, known for my tall frame and stovepipe hat, and I was assassinated at Ford's Theatre in 1865.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Harriet Tubman",
    alternateNames: ["tubman", "harriet", "harriet tubman", "araminta ross"],
    eraTags: ["American Civil War", "Activism"],
    voiceLine: "I never ran my train off the track, and I never lost a passenger. Ready for the next journey?",
    clues: [
      { text: "I was born into slavery in Maryland around 1822.", difficulty: 'hard' },
      { text: "As a girl I suffered a severe head injury when an overseer threw a heavy weight at me, leaving me with lifelong seizures and vivid dreams.", difficulty: 'medium' },
      { text: "I escaped to freedom in 1849, then returned to the South again and again to guide others north.", difficulty: 'medium' },
      { text: "I was the most famous 'conductor' on the Underground Railroad, leading some seventy people to freedom without losing one.", difficulty: 'easy' },
      { text: "During the Civil War I served the Union Army as a scout and nurse, and I became the first woman to lead an armed raid in the war.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Florence Nightingale",
    alternateNames: ["nightingale", "florence", "florence nightingale", "the lady with the lamp"],
    eraTags: ["Victorian Era", "Medicine"],
    voiceLine: "I attribute my success to this: I never gave or took any excuse. Shall we continue our rounds?",
    clues: [
      { text: "I was born in 1820 to a wealthy English family while they were travelling in Italy.", difficulty: 'hard' },
      { text: "Against my family's wishes I trained as a nurse, a job then considered unsuitable for a lady of my class.", difficulty: 'medium' },
      { text: "I led a team of nurses caring for British soldiers in the Crimean War and fought to improve hospital sanitation.", difficulty: 'medium' },
      { text: "I used statistics and pioneering charts, including the 'rose diagram', to argue for hospital reform.", difficulty: 'easy' },
      { text: "I am considered the founder of modern nursing, and soldiers remembered me making my night rounds carrying a lamp.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Ada Lovelace",
    alternateNames: ["lovelace", "ada", "ada lovelace", "ada byron", "augusta ada king", "countess of lovelace"],
    eraTags: ["Victorian Era", "Computing"],
    voiceLine: "The Analytical Engine weaves algebraic patterns just as the loom weaves flowers. Shall we compute another?",
    clues: [
      { text: "I was born in London in 1815, the only legitimate child of a famous Romantic poet whom I never knew.", difficulty: 'hard' },
      { text: "My mother made sure I was schooled in mathematics and science, unusual for a girl of my time.", difficulty: 'medium' },
      { text: "I worked with Charles Babbage on his design for a mechanical general-purpose computer, the Analytical Engine.", difficulty: 'medium' },
      { text: "My notes on that machine included what is often called the first computer program, a century before electronic computers existed.", difficulty: 'easy' },
      { text: "I am celebrated as the first computer programmer, and a programming language is named after me.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Vincent van Gogh",
    alternateNames: ["van gogh", "vincent", "vincent van gogh", "gogh"],
    eraTags: ["Post-Impressionism", "Art"],
    voiceLine: "I am seeking, I am striving, I am in it with all my heart. Shall we paint another?",
    clues: [
      { text: "I was born in the Netherlands in 1853, the son of a pastor, and worked as an art dealer and a preacher before I began to paint at 27.", difficulty: 'hard' },
      { text: "I produced some 2,100 artworks in about a decade, yet sold very few paintings during my lifetime.", difficulty: 'medium' },
      { text: "I moved to the south of France and painted sunflowers, wheat fields and café terraces in thick, swirling brushstrokes.", difficulty: 'medium' },
      { text: "After a quarrel with my friend Paul Gauguin, I cut off part of my own ear.", difficulty: 'easy' },
      { text: "I painted The Starry Night while living in an asylum, and I died in 1890 at 37 from a gunshot wound.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Louis Pasteur",
    alternateNames: ["pasteur", "louis", "louis pasteur"],
    eraTags: ["Industrial Age", "Microbiology"],
    voiceLine: "Chance favours the prepared mind. Ready for another experiment?",
    clues: [
      { text: "I was born in Dole, France, in 1822, the son of a tanner, and trained as a chemist.", difficulty: 'hard' },
      { text: "I showed that microorganisms cause fermentation and disease, helping to establish the germ theory.", difficulty: 'medium' },
      { text: "I saved the French silk industry by identifying the diseases that were killing silkworms.", difficulty: 'medium' },
      { text: "I developed vaccines against anthrax and rabies, and in 1885 my rabies vaccine saved a boy bitten by a rabid dog.", difficulty: 'easy' },
      { text: "The process of gently heating milk, wine and other liquids to kill germs is named after me.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Hokusai",
    alternateNames: ["hokusai", "katsushika hokusai", "katsushika"],
    eraTags: ["Edo Japan", "Art"],
    voiceLine: "If heaven had granted me five more years, I could have become a real painter. Shall we try another print?",
    clues: [
      { text: "I was born in Edo, now Tokyo, in 1760, and I changed my artist's name more than thirty times during my career.", difficulty: 'hard' },
      { text: "I was a master of ukiyo-e, the Japanese art of woodblock prints, and I kept working into my late eighties.", difficulty: 'medium' },
      { text: "I published sketchbooks called manga, which helped give that word to the world.", difficulty: 'medium' },
      { text: "My most famous series of prints is Thirty-six Views of Mount Fuji.", difficulty: 'easy' },
      { text: "My print of a huge wave curling over fishing boats, The Great Wave off Kanagawa, is one of the most recognisable images in art.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Queen Victoria",
    alternateNames: ["victoria", "queen victoria", "alexandrina victoria"],
    eraTags: ["British Empire", "Rulers"],
    voiceLine: "We are not interested in the possibilities of defeat; they do not exist. Shall we reign on?",
    clues: [
      { text: "I was born in London in 1819 and came to the throne at eighteen, when my uncle died without a legitimate heir.", difficulty: 'hard' },
      { text: "I married my German cousin Albert, had nine children, and wore black for the rest of my life after his death in 1861.", difficulty: 'medium' },
      { text: "I was the first monarch to live in Buckingham Palace, and my children married into royal houses across Europe, earning me the nickname 'the grandmother of Europe'.", difficulty: 'medium' },
      { text: "I reigned for 63 years over an empire that covered a quarter of the world, and I was also proclaimed Empress of India.", difficulty: 'easy' },
      { text: "An entire era of British history, with its railways, factories and strict morals, is named after me.", difficulty: 'easy' }
    ]
  },
  // ─── 20th century ────────────────────────────────────────────────────────
  {
    enabled: true,
    name: "Mahatma Gandhi",
    alternateNames: ["gandhi", "mahatma", "mahatma gandhi", "mohandas gandhi", "mohandas karamchand gandhi", "bapu", "gandhiji"],
    eraTags: ["20th Century", "Activism"],
    voiceLine: "My life is my message. Shall we walk on together?",
    clues: [
      { text: "I was born in Porbandar, in western India, in 1869, and trained as a lawyer in London.", difficulty: 'hard' },
      { text: "I spent 21 years in South Africa, where I first developed my method of non-violent resistance.", difficulty: 'medium' },
      { text: "In 1930 I led a 240-mile march to the sea to make salt in defiance of a British tax.", difficulty: 'medium' },
      { text: "I wore simple homespun cloth, spun thread on a wheel, and fasted many times as a form of protest.", difficulty: 'easy' },
      { text: "I led India's non-violent struggle for independence from Britain and was assassinated in 1948.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Winston Churchill",
    alternateNames: ["churchill", "winston", "winston churchill", "sir winston churchill"],
    eraTags: ["World War II", "Statesmanship"],
    voiceLine: "We shall never surrender. Shall we go another round?",
    clues: [
      { text: "I was born at Blenheim Palace, England, in 1874, and served as a cavalry officer and war correspondent in my youth.", difficulty: 'hard' },
      { text: "I held government posts for half a century, including First Lord of the Admiralty during the First World War.", difficulty: 'medium' },
      { text: "I won the Nobel Prize in Literature in 1953 for my historical writing and speeches.", difficulty: 'medium' },
      { text: "As Prime Minister I led Britain through the Second World War with speeches promising 'blood, toil, tears and sweat'.", difficulty: 'easy' },
      { text: "I was known for my cigars, my 'V for victory' sign and my bulldog spirit.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Amelia Earhart",
    alternateNames: ["earhart", "amelia", "amelia earhart"],
    eraTags: ["Interwar Years", "Aviation"],
    voiceLine: "Adventure is worthwhile in itself. Shall we take off again?",
    clues: [
      { text: "I was born in Kansas in 1897, and a ten-minute flight in 1920 changed the course of my life.", difficulty: 'hard' },
      { text: "I worked as a nurse's aide and a social worker before I could afford an aeroplane of my own.", difficulty: 'medium' },
      { text: "In 1932 I became the first woman to fly solo across the Atlantic Ocean.", difficulty: 'medium' },
      { text: "I set many aviation records and helped found an organisation for women pilots called the Ninety-Nines.", difficulty: 'easy' },
      { text: "In 1937 my plane vanished over the Pacific during an attempt to fly around the world, and I was never found.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Frida Kahlo",
    alternateNames: ["kahlo", "frida", "frida kahlo"],
    eraTags: ["20th Century", "Art"],
    voiceLine: "Feet, what do I need you for when I have wings to fly? Shall we paint another?",
    clues: [
      { text: "I was born in 1907 in Coyoacán, Mexico City, in a blue house where I also died.", difficulty: 'hard' },
      { text: "Polio as a child and a terrible bus accident at eighteen left me in pain for life, and I began painting while bedridden.", difficulty: 'medium' },
      { text: "I married the muralist Diego Rivera, twice.", difficulty: 'medium' },
      { text: "Most of my paintings are self-portraits, often showing my unibrow, traditional Mexican dress and flowers in my hair.", difficulty: 'easy' },
      { text: "My self-portraits with monkeys, thorn necklaces and a broken column made me one of Mexico's most celebrated artists.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Alan Turing",
    alternateNames: ["turing", "alan", "alan turing"],
    eraTags: ["World War II", "Computing"],
    voiceLine: "We can only see a short distance ahead, but we can see plenty there that needs to be done. Shall we compute on?",
    clues: [
      { text: "I was born in London in 1912 and studied mathematics at Cambridge and Princeton.", difficulty: 'hard' },
      { text: "In 1936 I described an abstract machine that laid the theoretical foundations of computing.", difficulty: 'medium' },
      { text: "During the Second World War I worked at Bletchley Park, where I helped crack the German Enigma code.", difficulty: 'medium' },
      { text: "I proposed a test of whether a machine can think, in which a person tries to tell a computer from a human.", difficulty: 'easy' },
      { text: "I was prosecuted in 1952 because I was gay and died two years later; I received a posthumous royal pardon in 2013, and the top prize in computer science is named after me.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Anne Frank",
    alternateNames: ["frank", "anne", "anne frank", "annelies frank"],
    eraTags: ["World War II", "Writing"],
    voiceLine: "I want to go on living even after my death. Shall we turn another page?",
    clues: [
      { text: "I was born in Germany in 1929, and my Jewish family moved to the Netherlands when I was four to escape the Nazis.", difficulty: 'hard' },
      { text: "For my thirteenth birthday I received a red-and-white checked notebook that became my closest companion.", difficulty: 'medium' },
      { text: "From July 1942 my family hid for two years in secret rooms behind a bookcase in my father's office building in Amsterdam.", difficulty: 'medium' },
      { text: "We were discovered and arrested in August 1944; I died in the Bergen-Belsen concentration camp in early 1945, aged fifteen.", difficulty: 'easy' },
      { text: "My father, the only one of us to survive, published my diary, which has since been read by millions around the world.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Rosa Parks",
    alternateNames: ["parks", "rosa", "rosa parks", "rosa louise parks"],
    eraTags: ["Civil Rights Era", "Civil Rights"],
    voiceLine: "You must never be fearful about what you are doing when it is right. Shall we keep going?",
    clues: [
      { text: "I was born in Tuskegee, Alabama, in 1913, and worked as a seamstress.", difficulty: 'hard' },
      { text: "I was an active member of my local NAACP chapter, serving as its secretary, years before I became famous.", difficulty: 'medium' },
      { text: "On 1 December 1955 I refused to give up my seat to a white passenger on a city bus in Montgomery.", difficulty: 'medium' },
      { text: "My arrest sparked a boycott of the city's buses that lasted more than a year and brought a young local minister to national prominence.", difficulty: 'easy' },
      { text: "I am called 'the mother of the civil rights movement', and the US Congress honoured me as 'the first lady of civil rights'.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Martin Luther King Jr.",
    alternateNames: ["martin luther king", "martin luther king jr", "martin luther king jr.", "mlk", "dr king", "dr. king", "martin"],
    eraTags: ["Civil Rights Era", "Civil Rights"],
    voiceLine: "The arc of the moral universe is long, but it bends toward justice. Shall we continue?",
    clues: [
      { text: "I was born in Atlanta, Georgia, in 1929, the son of a Baptist pastor, and I became a minister myself.", difficulty: 'hard' },
      { text: "I led a year-long bus boycott in Montgomery, Alabama, that ended segregation on the city's buses.", difficulty: 'medium' },
      { text: "I championed non-violent protest, inspired by India's independence movement, and wrote a famous letter from a jail cell in Birmingham.", difficulty: 'medium' },
      { text: "In 1964 I became the youngest person at that time to win the Nobel Peace Prize.", difficulty: 'easy' },
      { text: "I delivered my 'I Have a Dream' speech in Washington in 1963 and was assassinated in Memphis in 1968.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Nelson Mandela",
    alternateNames: ["mandela", "nelson", "nelson mandela", "madiba", "rolihlahla mandela"],
    eraTags: ["20th Century", "Statesmanship"],
    voiceLine: "I have walked a long road to freedom; shall we walk a little further?",
    clues: [
      { text: "I was born in 1918 in a village in the Eastern Cape of South Africa, into the Thembu royal family.", difficulty: 'hard' },
      { text: "I trained as a lawyer and opened the country's first Black law practice with my friend Oliver Tambo.", difficulty: 'medium' },
      { text: "I spent 27 years in prison, much of it on Robben Island, for fighting the apartheid system.", difficulty: 'medium' },
      { text: "Released in 1990, I shared the Nobel Peace Prize in 1993 and led my country's transition to democracy.", difficulty: 'easy' },
      { text: "In 1994 I became South Africa's first Black president, and my people affectionately call me by my clan name.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Yuri Gagarin",
    alternateNames: ["gagarin", "yuri", "yuri gagarin", "yuri alekseyevich gagarin"],
    eraTags: ["Space Age", "Space Exploration"],
    voiceLine: "Poyekhali! Let's go! Shall we orbit again?",
    clues: [
      { text: "I was born in 1934 in a village west of Moscow, the son of a carpenter, and trained as a foundry worker before becoming a pilot.", difficulty: 'hard' },
      { text: "I was a Soviet Air Force fighter pilot, chosen partly because my small height of 1.57 metres suited a cramped capsule.", difficulty: 'medium' },
      { text: "On 12 April 1961 my spacecraft, Vostok 1, completed a single orbit of the Earth in 108 minutes.", difficulty: 'medium' },
      { text: "I was the first human to travel into space, and I became a worldwide celebrity overnight.", difficulty: 'easy' },
      { text: "I died in 1968 when the training jet I was flying crashed; the date of my flight is now celebrated as Cosmonautics Day in Russia.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Pablo Picasso",
    alternateNames: ["picasso", "pablo", "pablo picasso", "pablo ruiz picasso"],
    eraTags: ["20th Century", "Art"],
    voiceLine: "I painted objects as I thought them, not as I saw them. Another canvas?",
    clues: [
      { text: "I was born in Málaga, Spain, in 1881, the son of an art teacher, and showed extraordinary talent as a child.", difficulty: 'hard' },
      { text: "I spent most of my adult life in France and worked for nearly 80 years in painting, sculpture, ceramics and printmaking.", difficulty: 'medium' },
      { text: "With Georges Braque I invented Cubism, breaking objects into geometric shapes seen from several angles at once.", difficulty: 'medium' },
      { text: "My early work is divided into a melancholy Blue Period and a warmer Rose Period.", difficulty: 'easy' },
      { text: "My mural Guernica, painted in 1937, is a famous protest against the bombing of a Basque town during the Spanish Civil War.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Wangari Maathai",
    alternateNames: ["maathai", "wangari", "wangari maathai", "wangari muta maathai"],
    eraTags: ["20th Century", "Environmentalism"],
    voiceLine: "It's the little things citizens do that will make the difference. My little thing is planting trees. Shall we plant another?",
    clues: [
      { text: "I was born in 1940 in the central highlands of Kenya and studied biology in the United States.", difficulty: 'hard' },
      { text: "I became the first woman in East and Central Africa to earn a doctorate, and later a professor at the University of Nairobi.", difficulty: 'medium' },
      { text: "In 1977 I founded a movement that paid rural women to plant trees, fighting deforestation and poverty together.", difficulty: 'medium' },
      { text: "My Green Belt Movement has planted tens of millions of trees across Africa.", difficulty: 'easy' },
      { text: "In 2004 I became the first African woman to win the Nobel Peace Prize.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Helen Keller",
    alternateNames: ["keller", "helen", "helen keller", "helen adams keller"],
    eraTags: ["20th Century", "Activism"],
    voiceLine: "The best and most beautiful things in the world must be felt with the heart. Shall we continue?",
    clues: [
      { text: "I was born in Alabama in 1880, and an illness at nineteen months left me unable to see or hear.", difficulty: 'hard' },
      { text: "A young teacher named Anne Sullivan came to my home when I was six and taught me to communicate by spelling words into my hand.", difficulty: 'medium' },
      { text: "My breakthrough came at a water pump, when I understood that the letters spelled into my palm meant 'water'.", difficulty: 'medium' },
      { text: "I became the first deafblind person to earn a bachelor's degree, graduating from Radcliffe College in 1904.", difficulty: 'easy' },
      { text: "I wrote The Story of My Life, campaigned for disability rights and women's suffrage, and my childhood was dramatised in the play The Miracle Worker.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Neil Armstrong",
    alternateNames: ["armstrong", "neil", "neil armstrong", "neil alden armstrong"],
    eraTags: ["Space Age", "Space Exploration"],
    voiceLine: "That's one small step for a man, one giant leap for mankind. Shall we take another step?",
    clues: [
      { text: "I was born in Ohio in 1930 and earned my pilot's licence before I had a driver's licence.", difficulty: 'hard' },
      { text: "I flew combat missions as a navy pilot in the Korean War and later became a test pilot flying the X-15 rocket plane.", difficulty: 'medium' },
      { text: "On the Gemini 8 mission in 1966 I performed the first docking of two spacecraft in orbit.", difficulty: 'medium' },
      { text: "In July 1969 I commanded a mission that landed on the Moon, with Buzz Aldrin and Michael Collins as my crewmates.", difficulty: 'easy' },
      { text: "I was the first person to walk on the Moon, and my first words on the surface spoke of a small step and a giant leap.", difficulty: 'easy' }
    ]
  },
  {
    enabled: true,
    name: "Agatha Christie",
    alternateNames: ["christie", "agatha", "agatha christie", "dame agatha christie"],
    eraTags: ["20th Century", "Literature"],
    voiceLine: "The best time for planning a book is while you're doing the dishes. Shall we solve another?",
    clues: [
      { text: "I was born in Torquay, England, in 1890, and worked in a hospital dispensary during the First World War, where I learned about poisons.", difficulty: 'hard' },
      { text: "In 1926 I disappeared for eleven days, sparking a nationwide search, and I never fully explained why.", difficulty: 'medium' },
      { text: "I wrote 66 detective novels and 14 short-story collections, and my books have sold around two billion copies.", difficulty: 'medium' },
      { text: "My play The Mousetrap opened in London's West End in 1952 and is the longest-running play in the world.", difficulty: 'easy' },
      { text: "I created the detectives Hercule Poirot and Miss Marple and wrote Murder on the Orient Express.", difficulty: 'easy' }
    ]
  }
];

function toFigure(config: HistoricFigureConfig): HistoricFigure {
  const { name, alternateNames, clues, eraTags, voiceLine } = config;
  return { name, alternateNames, clues, eraTags, voiceLine };
}

/**
 * Stable, URL-safe identifier derived from a figure's name.
 * The client sends this to the AI API instead of the full figure data.
 */
export function figureId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all enabled figures for gameplay
 */
export function getEnabledFigures(): HistoricFigure[] {
  return allFigures.filter(figure => figure.enabled).map(toFigure);
}

/**
 * Look up an enabled figure by its id (see `figureId`).
 */
export function getFigureById(id: string): HistoricFigure | undefined {
  const match = allFigures.find(figure => figure.enabled && figureId(figure.name) === id);
  return match ? toFigure(match) : undefined;
}

/**
 * Get figure count
 */
export function getFigureCount(): { enabled: number; total: number } {
  return {
    enabled: allFigures.filter(f => f.enabled).length,
    total: allFigures.length
  };
}

/**
 * Export the raw figure data (without `enabled`) for tooling/tests that need the full list.
 */
export const historicFigures: HistoricFigure[] = allFigures.map(toFigure);
