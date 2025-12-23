/**
 * БИОЛОГИЧЕСКАЯ ИГРА "МИКРОМИР: ВИРУСЫ VS БАКТЕРИИ"
 * Космический стиль с 4D-эффектами
 * Версия 1.1 - Двухпользовательский режим
 */

// ==========================================================================
// КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================================================

const GAME_VERSION = "1.1.0";
const QUESTION_DB_VERSION = "1.1";

// Настройки игры по умолчанию
const DEFAULT_SETTINGS = {
    music: true,
    sound: true,
    difficulty: "medium",
    playerName: "Игрок 1",
    player2Name: "Игрок 2",
    highScore: 0,
    totalGames: 0,
    totalCorrect: 0,
    totalQuestions: 0
};

// Конфигурация игры
const GAME_CONFIG = {
    timerPerQuestion: 15, // секунд на вопрос
    totalTime: 180, // общее время игры (секунды)
    correctAnswerPoints: 100,
    wrongAnswerPenalty: 50,
    comboMultiplier: 1.5,
    evolutionThreshold: 5, // правильных ответов для эволюции
    maxCombo: 10,
    initialSize: 1.0, // начальный размер существ
    maxSize: 3.0, // максимальный размер существ
    attackPower: {
        virus: 20,
        bacteria: 15
    },
    maxQuestionsPerTopic: 10 // максимальное количество вопросов на тему за игру
};

// Цвета для команд
const TEAM_COLORS = {
    virus: "#ff2a6d",
    bacteria: "#05d9e8",
    neutral: "#9d4edd"
};

// Состояния игры
const GAME_STATE = {
    MENU: "menu",
    TEAM_SELECTION: "team_selection",
    PLAYER_SETUP: "player_setup",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game_over",
    RESULTS: "results"
};

// Тематики вопросов
const QUESTION_TOPICS = {
    cell: "Клетка и органоиды",
    genetics: "Генетика",
    evolution: "Эволюция",
    ecology: "Экология",
    anatomy: "Анатомия человека",
    microbiology: "Микроорганизмы"
};

// Уровни эволюции
const EVOLUTION_LEVELS = {
    virus: [
        { name: "Простой вирус", spikes: 6, color: "#ff2a6d", size: 1.0 },
        { name: "Шипы атаки", spikes: 8, color: "#ff4d7d", size: 1.3 },
        { name: "Двойная оболочка", spikes: 10, color: "#ff709d", size: 1.6 },
        { name: "Стелс-вирус", spikes: 12, color: "#ff93bd", size: 2.0 },
        { name: "Идеальный хищник", spikes: 16, color: "#ffb6dd", size: 2.5 }
    ],
    bacteria: [
        { name: "Простая бактерия", flagella: 3, capsule: false, color: "#05d9e8", size: 1.0 },
        { name: "Жгутики движения", flagella: 5, capsule: false, color: "#28e9fa", size: 1.3 },
        { name: "Защитная капсула", flagella: 5, capsule: true, color: "#4bf9ff", size: 1.6 },
        { name: "Биоплёнка", flagella: 7, capsule: true, color: "#6effff", size: 2.0 },
        { name: "Суперколония", flagella: 9, capsule: true, color: "#91ffff", size: 2.5 }
    ]
};

// Глобальные переменные игры
let gameState = GAME_STATE.MENU;
let currentTeam = null;
let player1Team = null;
let player2Team = null;
let gameScore = { virus: 0, bacteria: 0 };
let player1Score = 0;
let player2Score = 0;
let gameTime = GAME_CONFIG.totalTime;
let gameTimer = null;
let questionTimers = { virus: null, bacteria: null };
let currentQuestions = { virus: null, bacteria: null };
let correctAnswers = { virus: 0, bacteria: 0 };
let totalAnswers = { virus: 0, bacteria: 0 };
let comboCounter = { virus: 0, bacteria: 0 };
let maxCombo = { virus: 0, bacteria: 0 };
let evolutionLevels = { virus: 0, bacteria: 0 };
let questionHistory = [];
let askedQuestionsCount = { virus: [], bacteria: [] };
let usedQuestionIds = new Set();
let settings = { ...DEFAULT_SETTINGS };
let questions = [];
let audioElements = {};
let isFullscreen = false;
let isMobile = false;
let isTouchDevice = false;
let currentRound = 1;
let isWaitingForNextRound = false;

// ==========================================================================
// КЛАССЫ ИГРЫ
// ==========================================================================

/**
 * Класс для управления вопросами
 */
class QuestionManager {
    constructor() {
        this.questions = [];
        this.topics = new Map();
        this.questionPools = {
            virus: new Map(),
            bacteria: new Map()
        };
        this.loadQuestions();
        this.initializeQuestionPools();
    }

    /**
     * Загрузка вопросов из встроенной базы данных
     */
    loadQuestions() {
        // Встроенная база вопросов по биологии (50+ вопросов)
        this.questions = [
            // Клетка и органоиды (10 вопросов)
            {
                id: 1,
                topic: "cell",
                difficulty: "easy",
                text: "Какой органоид клетки называют 'энергетической станцией'?",
                answers: [
                    { text: "Митохондрия", correct: true },
                    { text: "Рибосома", correct: false },
                    { text: "Ядро", correct: false },
                    { text: "Аппарат Гольджи", correct: false }
                ],
                explanation: "Митохондрии отвечают за клеточное дыхание и производство энергии в форме АТФ."
            },
            {
                id: 2,
                topic: "cell",
                difficulty: "medium",
                text: "Какой органоид отвечает за синтез белка?",
                answers: [
                    { text: "Эндоплазматическая сеть", correct: false },
                    { text: "Рибосома", correct: true },
                    { text: "Комплекс Гольджи", correct: false },
                    { text: "Лизосома", correct: false }
                ],
                explanation: "Рибосомы - немембранные органоиды, состоящие из РНК и белка, осуществляющие синтез белка."
            },
            {
                id: 3,
                topic: "cell",
                difficulty: "hard",
                text: "Какой процесс происходит в хлоропластах растительных клеток?",
                answers: [
                    { text: "Дыхание", correct: false },
                    { text: "Фотосинтез", correct: true },
                    { text: "Деление", correct: false },
                    { text: "Транскрипция", correct: false }
                ],
                explanation: "В хлоропластах происходит фотосинтез - процесс преобразования световой энергии в химическую."
            },
            {
                id: 4,
                topic: "cell",
                difficulty: "easy",
                text: "Какой органоид содержит наследственную информацию?",
                answers: [
                    { text: "Ядро", correct: true },
                    { text: "Митохондрия", correct: false },
                    { text: "Вакуоль", correct: false },
                    { text: "ЭПС", correct: false }
                ],
                explanation: "Ядро содержит хромосомы с ДНК, в которой записана наследственная информация."
            },
            {
                id: 5,
                topic: "cell",
                difficulty: "medium",
                text: "Какой органоид отвечает за внутриклеточное пищеварение?",
                answers: [
                    { text: "Лизосома", correct: true },
                    { text: "Пероксисома", correct: false },
                    { text: "Рибосома", correct: false },
                    { text: "Хлоропласт", correct: false }
                ],
                explanation: "Лизосомы содержат пищеварительные ферменты и расщепляют органические вещества."
            },
            // Генетика (10 вопросов)
            {
                id: 6,
                topic: "genetics",
                difficulty: "easy",
                text: "Какой нуклеотид комплементарен аденину в ДНК?",
                answers: [
                    { text: "Тимин", correct: true },
                    { text: "Цитозин", correct: false },
                    { text: "Гуанин", correct: false },
                    { text: "Урацил", correct: false }
                ],
                explanation: "В ДНК аденин образует пару с тимином (А-Т), а гуанин - с цитозином (Г-Ц)."
            },
            {
                id: 7,
                topic: "genetics",
                difficulty: "medium",
                text: "Как называется процесс образования иРНК на матрице ДНК?",
                answers: [
                    { text: "Трансляция", correct: false },
                    { text: "Транскрипция", correct: true },
                    { text: "Репликация", correct: false },
                    { text: "Трансформация", correct: false }
                ],
                explanation: "Транскрипция - процесс синтеза РНК на матрице ДНК с участием фермента РНК-полимеразы."
            },
            {
                id: 8,
                topic: "genetics",
                difficulty: "hard",
                text: "Какой закон Менделя описывает независимое наследование признаков?",
                answers: [
                    { text: "Первый закон", correct: false },
                    { text: "Второй закон", correct: false },
                    { text: "Третий закон", correct: true },
                    { text: "Закон сцепленного наследования", correct: false }
                ],
                explanation: "Третий закон Менделя (закон независимого наследования) действует для генов, расположенных в разных хромосомах."
            },
            {
                id: 9,
                topic: "genetics",
                difficulty: "medium",
                text: "Сколько хромосом в клетках человека?",
                answers: [
                    { text: "23", correct: false },
                    { text: "46", correct: true },
                    { text: "48", correct: false },
                    { text: "24", correct: false }
                ],
                explanation: "В соматических клетках человека 46 хромосом (23 пары)."
            },
            {
                id: 10,
                topic: "genetics",
                difficulty: "easy",
                text: "Как называется альтернативная форма гена?",
                answers: [
                    { text: "Аллель", correct: true },
                    { text: "Локус", correct: false },
                    { text: "Генотип", correct: false },
                    { text: "Фенотип", correct: false }
                ],
                explanation: "Аллель - одна из альтернативных форм гена, расположенного в определенном локусе хромосомы."
            },
            // Эволюция (10 вопросов)
            {
                id: 11,
                topic: "evolution",
                difficulty: "easy",
                text: "Кто является автором теории естественного отбора?",
                answers: [
                    { text: "Чарльз Дарвин", correct: true },
                    { text: "Жан-Батист Ламарк", correct: false },
                    { text: "Карл Линней", correct: false },
                    { text: "Грегор Мендель", correct: false }
                ],
                explanation: "Чарльз Дарвин в 1859 году опубликовал книгу 'Происхождение видов', где изложил теорию естественного отбора."
            },
            {
                id: 12,
                topic: "evolution",
                difficulty: "medium",
                text: "Какой процесс приводит к образованию новых видов?",
                answers: [
                    { text: "Естественный отбор", correct: false },
                    { text: "Видообразование", correct: true },
                    { text: "Миграция", correct: false },
                    { text: "Мутация", correct: false }
                ],
                explanation: "Видообразование - процесс возникновения новых биологических видов в ходе эволюции."
            },
            {
                id: 13,
                topic: "evolution",
                difficulty: "hard",
                text: "Как называется процесс изменения частот аллелей в популяции из-за случайных событий?",
                answers: [
                    { text: "Естественный отбор", correct: false },
                    { text: "Генетический дрейф", correct: true },
                    { text: "Поток генов", correct: false },
                    { text: "Мутационный процесс", correct: false }
                ],
                explanation: "Генетический дрейф - случайное изменение частот аллелей в малых популяциях."
            },
            // Экология (10 вопросов)
            {
                id: 14,
                topic: "ecology",
                difficulty: "easy",
                text: "Как называются организмы, производящие органические вещества из неорганических?",
                answers: [
                    { text: "Продуценты", correct: true },
                    { text: "Консументы", correct: false },
                    { text: "Редуценты", correct: false },
                    { text: "Детритофаги", correct: false }
                ],
                explanation: "Продуценты (автотрофы) создают органические вещества из неорганических с помощью фотосинтеза или хемосинтеза."
            },
            {
                id: 15,
                topic: "ecology",
                difficulty: "medium",
                text: "Как называется цепь превращения энергии от продуцентов к консументам?",
                answers: [
                    { text: "Пищевая цепь", correct: true },
                    { text: "Энергетическая пирамида", correct: false },
                    { text: "Трофический уровень", correct: false },
                    { text: "Биоценоз", correct: false }
                ],
                explanation: "Пищевая (трофическая) цепь - последовательность организмов, в которой каждый предыдущий служит пищей для следующего."
            },
            // Анатомия человека (10 вопросов)
            {
                id: 16,
                topic: "anatomy",
                difficulty: "easy",
                text: "Сколько камер имеет сердце человека?",
                answers: [
                    { text: "2", correct: false },
                    { text: "3", correct: false },
                    { text: "4", correct: true },
                    { text: "5", correct: false }
                ],
                explanation: "Сердце человека имеет 4 камеры: два предсердия и два желудочка."
            },
            {
                id: 17,
                topic: "anatomy",
                difficulty: "medium",
                text: "Какой отдел головного мозга отвечает за координацию движений?",
                answers: [
                    { text: "Большие полушария", correct: false },
                    { text: "Мозжечок", correct: true },
                    { text: "Продолговатый мозг", correct: false },
                    { text: "Средний мозг", correct: false }
                ],
                explanation: "Мозжечок отвечает за координацию движений, равновесие и мышечный тонус."
            },
            // Микроорганизмы (10 вопросов)
            {
                id: 18,
                topic: "microbiology",
                difficulty: "easy",
                text: "К какому типу организмов относятся вирусы?",
                answers: [
                    { text: "Неклеточные формы жизни", correct: true },
                    { text: "Одноклеточные растения", correct: false },
                    { text: "Одноклеточные животные", correct: false },
                    { text: "Многоклеточные грибы", correct: false }
                ],
                explanation: "Вирусы - неклеточные формы жизни, способные размножаться только внутри живых клеток."
            },
            {
                id: 19,
                topic: "microbiology",
                difficulty: "medium",
                text: "Какой процесс обеспечивает движение бактерий?",
                answers: [
                    { text: "Работа жгутиков", correct: true },
                    { text: "Бинарное деление", correct: false },
                    { text: "Спорообразование", correct: false },
                    { text: "Конъюгация", correct: false }
                ],
                explanation: "Жгутики - органоиды движения бактерий, вращение которых позволяет им передвигаться в жидкой среде."
            },
            // Дополнительные вопросы для разнообразия
            {
                id: 20,
                topic: "cell",
                difficulty: "medium",
                text: "Какой органоид участвует в формировании лизосом?",
                answers: [
                    { text: "Комплекс Гольджи", correct: true },
                    { text: "Эндоплазматическая сеть", correct: false },
                    { text: "Митохондрия", correct: false },
                    { text: "Рибосома", correct: false }
                ],
                explanation: "Аппарат Гольджи участвует в образовании лизосом и других мембранных органоидов."
            },
            {
                id: 21,
                topic: "genetics",
                difficulty: "hard",
                text: "Как называется тип наследования, при котором признак проявляется только у гомозигот?",
                answers: [
                    { text: "Доминантный", correct: false },
                    { text: "Рецессивный", correct: true },
                    { text: "Кодоминантный", correct: false },
                    { text: "Неполное доминирование", correct: false }
                ],
                explanation: "Рецессивные признаки проявляются только у гомозиготных особей."
            },
            {
                id: 22,
                topic: "evolution",
                difficulty: "medium",
                text: "Как называется процесс приспособления организмов к среде обитания?",
                answers: [
                    { text: "Адаптация", correct: true },
                    { text: "Мутация", correct: false },
                    { text: "Миграция", correct: false },
                    { text: "Изоляция", correct: false }
                ],
                explanation: "Адаптация - процесс приспособления организмов к условиям окружающей среды."
            },
            {
                id: 23,
                topic: "ecology",
                difficulty: "hard",
                text: "Как называется взаимовыгодное сожительство разных видов?",
                answers: [
                    { text: "Симбиоз", correct: true },
                    { text: "Паразитизм", correct: false },
                    { text: "Хищничество", correct: false },
                    { text: "Конкуренция", correct: false }
                ],
                explanation: "Симбиоз - взаимовыгодное сожительство организмов разных видов."
            },
            {
                id: 24,
                topic: "anatomy",
                difficulty: "hard",
                text: "Какой гормон регулирует уровень глюкозы в крови?",
                answers: [
                    { text: "Инсулин", correct: true },
                    { text: "Адреналин", correct: false },
                    { text: "Тироксин", correct: false },
                    { text: "Эстроген", correct: false }
                ],
                explanation: "Инсулин - гормон поджелудочной железы, который снижает уровень глюкозы в крови."
            },
            {
                id: 25,
                topic: "microbiology",
                difficulty: "hard",
                text: "Как называется процесс обмена генетическим материалом у бактерий через пили?",
                answers: [
                    { text: "Трансформация", correct: false },
                    { text: "Трансдукция", correct: false },
                    { text: "Конъюгация", correct: true },
                    { text: "Трансляция", correct: false }
                ],
                explanation: "Конъюгация - процесс передачи генетического материала от одной бактерии к другой через специальные выросты (пили)."
            },
            // Еще больше вопросов...
            {
                id: 26,
                topic: "cell",
                difficulty: "easy",
                text: "Как называется наружная оболочка клетки?",
                answers: [
                    { text: "Цитоплазма", correct: false },
                    { text: "Клеточная мембрана", correct: true },
                    { text: "Клеточная стенка", correct: false },
                    { text: "Ядерная оболочка", correct: false }
                ],
                explanation: "Клеточная мембрана - полупроницаемая оболочка, окружающая клетку."
            },
            {
                id: 27,
                topic: "genetics",
                difficulty: "medium",
                text: "Как называется совокупность всех генов организма?",
                answers: [
                    { text: "Фенотип", correct: false },
                    { text: "Генотип", correct: true },
                    { text: "Геном", correct: false },
                    { text: "Кариотип", correct: false }
                ],
                explanation: "Генотип - совокупность всех генов организма."
            },
            {
                id: 28,
                topic: "evolution",
                difficulty: "easy",
                text: "Что является основной движущей силой эволюции?",
                answers: [
                    { text: "Естественный отбор", correct: true },
                    { text: "Искусственный отбор", correct: false },
                    { text: "Мутации", correct: false },
                    { text: "Миграции", correct: false }
                ],
                explanation: "Естественный отбор - основной движущий фактор эволюции."
            },
            {
                id: 29,
                topic: "ecology",
                difficulty: "medium",
                text: "Как называется сообщество живых организмов и среды их обитания?",
                answers: [
                    { text: "Популяция", correct: false },
                    { text: "Экосистема", correct: true },
                    { text: "Биоценоз", correct: false },
                    { text: "Биосфера", correct: false }
                ],
                explanation: "Экосистема - биологическая система, состоящая из сообщества организмов и среды их обитания."
            },
            {
                id: 30,
                topic: "anatomy",
                difficulty: "medium",
                text: "Какой орган отвечает за очистку крови?",
                answers: [
                    { text: "Печень", correct: false },
                    { text: "Почки", correct: true },
                    { text: "Сердце", correct: false },
                    { text: "Легкие", correct: false }
                ],
                explanation: "Почки фильтруют кровь и выводят продукты обмена веществ."
            }
        ];

        // Группировка вопросов по темам
        this.topics.set("cell", this.questions.filter(q => q.topic === "cell"));
        this.topics.set("genetics", this.questions.filter(q => q.topic === "genetics"));
        this.topics.set("evolution", this.questions.filter(q => q.topic === "evolution"));
        this.topics.set("ecology", this.questions.filter(q => q.topic === "ecology"));
        this.topics.set("anatomy", this.questions.filter(q => q.topic === "anatomy"));
        this.topics.set("microbiology", this.questions.filter(q => q.topic === "microbiology"));

        console.log(`Загружено ${this.questions.length} вопросов по биологии`);
    }

    /**
     * Инициализация пулов вопросов для каждой команды
     */
    initializeQuestionPools() {
        // Вирусы получают вопросы по микробиологии, клеткам и генетике
        // Бактерии - по эволюции, экологии и анатомии
        const virusTopics = ["microbiology", "cell", "genetics"];
        const bacteriaTopics = ["evolution", "ecology", "anatomy"];
        
        virusTopics.forEach(topic => {
            this.questionPools.virus.set(topic, [...this.topics.get(topic)]);
        });
        
        bacteriaTopics.forEach(topic => {
            this.questionPools.bacteria.set(topic, [...this.topics.get(topic)]);
        });
        
        console.log("Пул вопросов инициализирован");
    }

    /**
     * Получение случайного вопроса для команды
     */
    getTeamQuestion(team, difficulty = "medium") {
        const topics = team === "virus" 
            ? ["microbiology", "cell", "genetics"]
            : ["evolution", "ecology", "anatomy"];
        
        // Выбор темы с учетом ограничений
        let availableTopics = topics.filter(topic => {
            const pool = this.questionPools[team].get(topic);
            return pool && pool.length > 0;
        });
        
        if (availableTopics.length === 0) {
            // Если все вопросы закончились, перезаполняем пул
            this.initializeQuestionPools();
            availableTopics = topics;
        }
        
        // Выбор случайной темы
        const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        const pool = this.questionPools[team].get(randomTopic);
        
        // Фильтрация по сложности
        let filteredQuestions = pool.filter(q => q.difficulty === difficulty);
        if (filteredQuestions.length === 0) {
            filteredQuestions = pool; // Если нет вопросов нужной сложности, берем любые
        }
        
        // Исключение уже использованных вопросов
        filteredQuestions = filteredQuestions.filter(q => !usedQuestionIds.has(q.id));
        
        if (filteredQuestions.length === 0) {
            // Если все вопросы использованы, сбрасываем использованные
            usedQuestionIds.clear();
            filteredQuestions = pool.filter(q => q.difficulty === difficulty);
            if (filteredQuestions.length === 0) {
                filteredQuestions = pool;
            }
        }
        
        // Выбор случайного вопроса
        const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
        const selectedQuestion = filteredQuestions[randomIndex];
        
        // Удаляем вопрос из пула и добавляем в использованные
        const poolIndex = pool.findIndex(q => q.id === selectedQuestion.id);
        if (poolIndex > -1) {
            pool.splice(poolIndex, 1);
        }
        usedQuestionIds.add(selectedQuestion.id);
        
        // Отслеживаем количество заданных вопросов по теме
        if (!askedQuestionsCount[team][randomTopic]) {
            askedQuestionsCount[team][randomTopic] = 0;
        }
        askedQuestionsCount[team][randomTopic]++;
        
        // Если тема исчерпана (задано много вопросов), временно исключаем ее
        if (askedQuestionsCount[team][randomTopic] >= GAME_CONFIG.maxQuestionsPerTopic) {
            this.questionPools[team].set(randomTopic, []);
        }
        
        return selectedQuestion;
    }

    /**
     * Получение объяснения к вопросу
     */
    getQuestionExplanation(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        return question ? question.explanation : "Объяснение отсутствует";
    }
}

/**
 * Класс для управления существом (вирус/бактерия)
 */
class Creature {
    constructor(type, containerId) {
        this.type = type;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.evolutionLevel = 0;
        this.size = GAME_CONFIG.initialSize;
        this.health = 100;
        this.attackPower = GAME_CONFIG.attackPower[type];
        this.isAttacking = false;
        this.isHit = false;
        this.correctAnswersInRow = 0;
        
        this.init();
    }
    
    init() {
        this.updateAppearance();
        this.animate();
    }
    
    updateAppearance() {
        const evolution = EVOLUTION_LEVELS[this.type][this.evolutionLevel];
        
        if (this.container) {
            this.container.style.color = evolution.color;
            this.container.style.transform = `scale(${evolution.size})`;
            
            if (this.type === "virus") {
                const spikes = this.container.querySelectorAll('.entity-spike');
                spikes.forEach(spike => spike.style.display = 'none');
                
                for (let i = 0; i < evolution.spikes && i < spikes.length; i++) {
                    spikes[i].style.display = 'block';
                    spikes[i].style.transform = `translate(-50%, -50%) rotate(${i * (360 / evolution.spikes)}deg)`;
                }
            }
            
            if (this.type === "bacteria") {
                const flagella = this.container.querySelectorAll('.entity-flagella');
                flagella.forEach(flagellum => flagellum.style.display = 'none');
                
                for (let i = 0; i < evolution.flagella && i < flagella.length; i++) {
                    flagella[i].style.display = 'block';
                    flagella[i].style.transform = `translate(-50%, -50%) rotate(${i * (360 / evolution.flagella)}deg)`;
                }
                
                const capsule = this.container.querySelector('.entity-capsule');
                if (capsule) {
                    capsule.style.display = evolution.capsule ? 'block' : 'none';
                }
            }
        }
    }
    
    evolve() {
        if (this.evolutionLevel < EVOLUTION_LEVELS[this.type].length - 1) {
            this.evolutionLevel++;
            this.updateAppearance();
            this.playEvolutionEffect();
            return true;
        }
        return false;
    }
    
    grow() {
        this.correctAnswersInRow++;
        const maxSize = EVOLUTION_LEVELS[this.type][this.evolutionLevel].size;
        if (this.size < maxSize) {
            this.size = Math.min(this.size + 0.1, maxSize);
            if (this.container) {
                this.container.style.transform = `scale(${this.size})`;
            }
        }
        
        // Проверка эволюции
        if (this.correctAnswersInRow >= GAME_CONFIG.evolutionThreshold) {
            this.evolve();
            this.correctAnswersInRow = 0;
        }
    }
    
    shrink() {
        this.correctAnswersInRow = 0;
        const minSize = GAME_CONFIG.initialSize;
        if (this.size > minSize) {
            this.size = Math.max(this.size - 0.15, minSize);
            if (this.container) {
                this.container.style.transform = `scale(${this.size})`;
            }
        }
    }
    
    attack(targetCreature) {
        if (this.isAttacking || targetCreature.isHit) return;
        
        this.isAttacking = true;
        
        if (this.container) {
            this.container.classList.add('attacking');
        }
        
        playSound('attack');
        
        this.createAttackEffect(targetCreature);
        
        setTimeout(() => {
            targetCreature.takeDamage(this.attackPower);
            this.isAttacking = false;
            
            if (this.container) {
                this.container.classList.remove('attacking');
            }
        }, 500);
    }
    
    takeDamage(damage) {
        this.health = Math.max(this.health - damage, 0);
        this.isHit = true;
        
        if (this.container) {
            this.container.classList.add('hit');
            this.container.style.animation = 'shake 0.5s';
            
            setTimeout(() => {
                this.container.classList.remove('hit');
                this.container.style.animation = '';
                this.isHit = false;
            }, 500);
        }
        
        playSound('wrong');
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        console.log(`${this.type} уничтожен!`);
        
        if (this.container) {
            this.container.style.animation = 'scaleDown 0.5s forwards';
            this.container.style.opacity = '0.5';
        }
        
        playSound('lose');
    }
    
    createAttackEffect(targetCreature) {
        const battleZone = document.querySelector('.battle-effects');
        if (!battleZone) return;
        
        const effect = document.createElement('div');
        effect.className = `attack-effect ${this.type}-attack`;
        
        const sourceRect = this.container ? this.container.getBoundingClientRect() : { left: 100, top: 100 };
        const targetRect = targetCreature.container ? targetCreature.container.getBoundingClientRect() : { left: 400, top: 100 };
        
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        effect.style.position = 'absolute';
        effect.style.left = `${startX}px`;
        effect.style.top = `${startY}px`;
        effect.style.width = `${distance}px`;
        effect.style.height = '4px';
        effect.style.background = this.type === 'virus' 
            ? 'linear-gradient(90deg, var(--color-accent-virus), transparent)' 
            : 'linear-gradient(90deg, var(--color-accent-bacteria), transparent)';
        effect.style.transform = `rotate(${angle}deg)`;
        effect.style.transformOrigin = '0 0';
        effect.style.zIndex = '5';
        
        battleZone.appendChild(effect);
        
        setTimeout(() => {
            effect.style.transition = 'all 0.3s ease';
            effect.style.opacity = '0';
            effect.style.transform = `rotate(${angle}deg) scaleX(0)`;
            
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 300);
        }, 100);
    }
    
    playEvolutionEffect() {
        const container = this.container;
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'evolution-particle';
                particle.style.position = 'absolute';
                particle.style.width = '10px';
                particle.style.height = '10px';
                particle.style.background = this.type === 'virus' 
                    ? TEAM_COLORS.virus 
                    : TEAM_COLORS.bacteria;
                particle.style.borderRadius = '50%';
                particle.style.left = '50%';
                particle.style.top = '50%';
                particle.style.transform = 'translate(-50%, -50%)';
                particle.style.zIndex = '10';
                
                container.appendChild(particle);
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const targetX = Math.cos(angle) * distance;
                const targetY = Math.sin(angle) * distance;
                
                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: `translate(${targetX}px, ${targetY}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 1000,
                    easing: 'ease-out'
                });
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1000);
            }, i * 50);
        }
        
        playSound('evolution');
    }
    
    animate() {
        if (this.container && !this.isAttacking && !this.isHit) {
            const time = Date.now() / 1000;
            const floatY = Math.sin(time * 0.5) * 5;
            const rotateY = Math.sin(time * 0.3) * 5;
            
            this.container.style.transform = `scale(${this.size}) translateY(${floatY}px) rotateY(${rotateY}deg)`;
            
            const pulse = 1 + Math.sin(time * 2) * 0.05;
            const glow = this.container.querySelector('.entity-glow');
            if (glow) {
                glow.style.opacity = 0.3 + Math.sin(time) * 0.2;
                glow.style.transform = `translate(-50%, -50%) scale(${pulse})`;
            }
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    reset() {
        this.evolutionLevel = 0;
        this.size = GAME_CONFIG.initialSize;
        this.health = 100;
        this.isAttacking = false;
        this.isHit = false;
        this.correctAnswersInRow = 0;
        
        if (this.container) {
            this.container.style.opacity = '1';
            this.container.style.animation = '';
            this.container.classList.remove('attacking', 'hit');
        }
        
        this.updateAppearance();
    }
}

/**
 * Класс для управления аудио
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMusicEnabled = true;
        this.isSoundEnabled = true;
        this.musicVolume = 0.5;
        this.soundVolume = 0.7;
        
        this.init();
    }
    
    init() {
        this.sounds = {
            click: document.getElementById('click-sound'),
            correct: document.getElementById('correct-sound'),
            wrong: document.getElementById('wrong-sound'),
            attack: document.getElementById('attack-sound'),
            evolution: document.getElementById('evolution-sound'),
            win: document.getElementById('win-sound'),
            lose: document.getElementById('lose-sound')
        };
        
        this.music = document.getElementById('background-music');
        
        this.setVolumes();
        
        if (this.music) {
            this.music.loop = true;
            this.music.addEventListener('ended', () => {
                this.music.currentTime = 0;
                this.music.play();
            });
        }
    }
    
    setVolumes() {
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
        
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.soundVolume;
            }
        });
    }
    
    playSound(name) {
        if (!this.isSoundEnabled || !this.sounds[name]) return;
        
        try {
            this.sounds[name].currentTime = 0;
            this.sounds[name].play().catch(e => console.log(`Ошибка воспроизведения звука ${name}:`, e));
        } catch (e) {
            console.log(`Ошибка воспроизведения звука ${name}:`, e);
        }
    }
    
    playMusic() {
        if (!this.isMusicEnabled || !this.music) return;
        
        try {
            this.music.play().catch(e => {
                console.log("Ошибка воспроизведения музыки:", e);
            });
        } catch (e) {
            console.log("Ошибка воспроизведения музыки:", e);
        }
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }
    
    toggleMusic(enabled) {
        this.isMusicEnabled = enabled;
        if (enabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        this.saveSettings();
    }
    
    toggleSound(enabled) {
        this.isSoundEnabled = enabled;
        this.saveSettings();
    }
    
    saveSettings() {
        settings.music = this.isMusicEnabled;
        settings.sound = this.isSoundEnabled;
        saveSettings();
    }
    
    loadSettings() {
        this.isMusicEnabled = settings.music;
        this.isSoundEnabled = settings.sound;
        this.setVolumes();
        
        if (this.isMusicEnabled) {
            this.playMusic();
        }
    }
}

/**
 * Класс для управления интерфейсом
 */
class UIManager {
    constructor() {
        this.screens = {
            menu: document.getElementById('menu-screen'),
            team: document.getElementById('team-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            result: document.getElementById('result-screen'),
            howToPlay: document.getElementById('how-to-play-screen'),
            topics: document.getElementById('topics-screen'),
            about: document.getElementById('about-screen')
        };
        
        this.currentScreen = 'menu';
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.showScreen('menu');
        
        this.initMenu();
        this.initTeamSelection();
        this.initGameUI();
        this.initPauseUI();
        this.initResultUI();
        this.initTutorialUI();
        this.initTopicsUI();
        this.initAboutUI();
        this.initMobileMenu();
        
        this.isInitialized = true;
        console.log("UI Manager инициализирован");
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active-screen');
            }
        });
        
        document.querySelectorAll('.overlay-screen.active').forEach(overlay => {
            overlay.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active-screen');
            this.currentScreen = screenName;
        }
        
        window.scrollTo(0, 0);
        playSound('click');
    }
    
    showOverlay(overlayName) {
        const overlay = document.getElementById(overlayName);
        if (overlay) {
            overlay.classList.add('active');
            playSound('click');
        }
    }
    
    hideOverlay(overlayName) {
        const overlay = document.getElementById(overlayName);
        if (overlay) {
            overlay.classList.remove('active');
            playSound('click');
        }
    }
    
    initMenu() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showScreen('team');
            });
        }
        
        const howToPlayBtn = document.getElementById('how-to-play-btn');
        if (howToPlayBtn) {
            howToPlayBtn.addEventListener('click', () => {
                this.showOverlay('how-to-play-screen');
            });
        }
        
        const topicsBtn = document.getElementById('topics-btn');
        if (topicsBtn) {
            topicsBtn.addEventListener('click', () => {
                this.showOverlay('topics-screen');
            });
        }
        
        const aboutBtn = document.getElementById('about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                this.showOverlay('about-screen');
            });
        }
        
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.checked = settings.music;
            musicToggle.addEventListener('change', (e) => {
                audioManager.toggleMusic(e.target.checked);
            });
        }
        
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = settings.sound;
            soundToggle.addEventListener('change', (e) => {
                audioManager.toggleSound(e.target.checked);
            });
        }
        
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect) {
            difficultySelect.value = settings.difficulty;
            difficultySelect.addEventListener('change', (e) => {
                settings.difficulty = e.target.value;
                saveSettings();
            });
        }
        
        const githubLink = document.getElementById('github-link');
        if (githubLink) {
            githubLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.open('https://github.com', '_blank');
                playSound('click');
            });
        }
        
        const shareLink = document.getElementById('share-link');
        if (shareLink) {
            shareLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareGame();
            });
        }
        
        const fullscreenLink = document.getElementById('fullscreen-link');
        if (fullscreenLink) {
            fullscreenLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFullscreen();
            });
        }
        
        this.animateTitle();
    }
    
    initTeamSelection() {
        const backBtn = document.getElementById('team-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        const virusTeamBtn = document.querySelector('.btn-select-team[data-team="virus"]');
        if (virusTeamBtn) {
            virusTeamBtn.addEventListener('click', () => {
                player1Team = 'virus';
                player2Team = 'bacteria';
                startGame();
            });
        }
        
        const bacteriaTeamBtn = document.querySelector('.btn-select-team[data-team="bacteria"]');
        if (bacteriaTeamBtn) {
            bacteriaTeamBtn.addEventListener('click', () => {
                player1Team = 'bacteria';
                player2Team = 'virus';
                startGame();
            });
        }
        
        const randomTeamBtn = document.getElementById('random-team-btn');
        if (randomTeamBtn) {
            randomTeamBtn.addEventListener('click', () => {
                const teams = ['virus', 'bacteria'];
                player1Team = teams[Math.floor(Math.random() * teams.length)];
                player2Team = player1Team === 'virus' ? 'bacteria' : 'virus';
                startGame();
            });
        }
        
        this.animateTeamModels();
    }
    
    initGameUI() {
        const gameMenuBtn = document.getElementById('game-menu-btn');
        if (gameMenuBtn) {
            gameMenuBtn.addEventListener('click', () => {
                pauseGame();
            });
        }
        
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                pauseGame();
            });
        }
        
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                useHint();
            });
        }
        
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            attackBtn.addEventListener('click', () => {
                manualAttack();
            });
        }
        
        const evolutionBtn = document.getElementById('evolution-btn');
        if (evolutionBtn) {
            evolutionBtn.addEventListener('click', () => {
                forceEvolution();
            });
        }
        
        this.initAnswerHandlers();
    }
    
    initAnswerHandlers() {
        const virusAnswers = document.querySelectorAll('#virus-question-container .answer-option');
        virusAnswers.forEach(btn => {
            btn.addEventListener('click', () => {
                const answerIndex = parseInt(btn.getAttribute('data-index'));
                answerQuestion('virus', answerIndex);
            });
        });
        
        const bacteriaAnswers = document.querySelectorAll('#bacteria-question-container .answer-option');
        bacteriaAnswers.forEach(btn => {
            btn.addEventListener('click', () => {
                const answerIndex = parseInt(btn.getAttribute('data-index'));
                answerQuestion('bacteria', answerIndex);
            });
        });
    }
    
    initPauseUI() {
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                resumeGame();
            });
        }
        
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                restartGame();
            });
        }
        
        const pauseSettingsBtn = document.getElementById('pause-settings-btn');
        if (pauseSettingsBtn) {
            pauseSettingsBtn.addEventListener('click', () => {
                this.showOverlay('how-to-play-screen');
            });
        }
        
        const pauseMenuBtn = document.getElementById('pause-menu-btn');
        if (pauseMenuBtn) {
            pauseMenuBtn.addEventListener('click', () => {
                returnToMenu();
            });
        }
    }
    
    initResultUI() {
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                restartGame();
            });
        }
        
        const shareResultBtn = document.getElementById('share-result-btn');
        if (shareResultBtn) {
            shareResultBtn.addEventListener('click', () => {
                this.shareGame();
            });
        }
        
        const resultMenuBtn = document.getElementById('result-menu-btn');
        if (resultMenuBtn) {
            resultMenuBtn.addEventListener('click', () => {
                returnToMenu();
            });
        }
    }
    
    initTutorialUI() {
        const closeTutorialBtn = document.getElementById('close-tutorial-btn');
        if (closeTutorialBtn) {
            closeTutorialBtn.addEventListener('click', () => {
                this.hideOverlay('how-to-play-screen');
            });
        }
        
        const startAfterTutorialBtn = document.getElementById('start-after-tutorial');
        if (startAfterTutorialBtn) {
            startAfterTutorialBtn.addEventListener('click', () => {
                this.hideOverlay('how-to-play-screen');
                this.showScreen('team');
            });
        }
    }
    
    initTopicsUI() {
        const closeTopicsBtn = document.getElementById('close-topics-btn');
        if (closeTopicsBtn) {
            closeTopicsBtn.addEventListener('click', () => {
                this.hideOverlay('topics-screen');
            });
        }
        
        const topicsBackBtn = document.getElementById('topics-back-btn');
        if (topicsBackBtn) {
            topicsBackBtn.addEventListener('click', () => {
                this.hideOverlay('topics-screen');
            });
        }
    }
    
    initAboutUI() {
        const closeAboutBtn = document.getElementById('close-about-btn');
        if (closeAboutBtn) {
            closeAboutBtn.addEventListener('click', () => {
                this.hideOverlay('about-screen');
            });
        }
        
        const aboutBackBtn = document.getElementById('about-back-btn');
        if (aboutBackBtn) {
            aboutBackBtn.addEventListener('click', () => {
                this.hideOverlay('about-screen');
            });
        }
        
        const aboutLinks = document.querySelectorAll('.about-link');
        aboutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                playSound('click');
                
                const linkId = link.id;
                if (linkId === 'github-about-link') {
                    window.open('https://github.com', '_blank');
                } else if (linkId === 'issues-link') {
                    window.open('https://github.com/issues', '_blank');
                } else if (linkId === 'suggest-link') {
                    window.open('https://github.com/discussions', '_blank');
                } else if (linkId === 'contact-link') {
                    window.open('mailto:example@email.com', '_blank');
                }
            });
        });
    }
    
    initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuContent = document.getElementById('mobile-menu-content');
        
        if (mobileMenuToggle && mobileMenuContent) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenuToggle.classList.toggle('active');
                mobileMenuContent.classList.toggle('active');
                playSound('click');
            });
            
            const menuItems = document.querySelectorAll('.mobile-menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.getAttribute('data-action');
                    
                    switch (action) {
                        case 'home':
                            returnToMenu();
                            break;
                        case 'restart':
                            restartGame();
                            break;
                        case 'sound':
                            toggleSound();
                            break;
                        case 'fullscreen':
                            this.toggleFullscreen();
                            break;
                        case 'help':
                            this.showOverlay('how-to-play-screen');
                            break;
                    }
                    
                    mobileMenuToggle.classList.remove('active');
                    mobileMenuContent.classList.remove('active');
                });
            });
        }
    }
    
    updateGameUI() {
        document.getElementById('virus-score').textContent = gameScore.virus;
        document.getElementById('bacteria-score').textContent = gameScore.bacteria;
        
        const totalScore = gameScore.virus + gameScore.bacteria;
        if (totalScore > 0) {
            const virusProgress = (gameScore.virus / totalScore) * 100;
            const bacteriaProgress = (gameScore.bacteria / totalScore) * 100;
            
            document.getElementById('virus-progress').style.width = `${virusProgress}%`;
            document.getElementById('bacteria-progress').style.width = `${bacteriaProgress}%`;
        }
        
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('game-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('game-combo').textContent = Math.max(comboCounter.virus, comboCounter.bacteria);
        
        const playerTeam = player1Team;
        document.getElementById('evolution-level').textContent = evolutionLevels[playerTeam] || 0;
        
        const totalCorrect = (correctAnswers.virus || 0) + (correctAnswers.bacteria || 0);
        const totalTotal = (totalAnswers.virus || 0) + (totalAnswers.bacteria || 0);
        
        document.getElementById('correct-answers').textContent = totalCorrect;
        document.getElementById('accuracy-rate').textContent = totalTotal > 0 
            ? `${Math.round((totalCorrect / totalTotal) * 100)}%` 
            : '0%';
        document.getElementById('player-record').textContent = settings.highScore;
        
        document.getElementById('game-round').textContent = currentRound;
        
        document.getElementById('player-name').textContent = `${settings.playerName} (${player1Team === 'virus' ? 'Вирусы' : 'Бактерии'})`;
        document.getElementById('player-side').textContent = `${settings.player2Name} (${player2Team === 'virus' ? 'Вирусы' : 'Бактерии'})`;
    }
    
    updatePauseUI() {
        const minutes = Math.floor((GAME_CONFIG.totalTime - gameTime) / 60);
        const seconds = (GAME_CONFIG.totalTime - gameTime) % 60;
        document.getElementById('pause-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const totalCorrect = (correctAnswers.virus || 0) + (correctAnswers.bacteria || 0);
        document.getElementById('pause-correct').textContent = totalCorrect;
        
        document.getElementById('pause-combo').textContent = Math.max(maxCombo.virus || 0, maxCombo.bacteria || 0);
        
        const totalTotal = (totalAnswers.virus || 0) + (totalAnswers.bacteria || 0);
        const accuracy = totalTotal > 0 ? Math.round((totalCorrect / totalTotal) * 100) : 0;
        document.getElementById('pause-accuracy').textContent = `${accuracy}%`;
    }
    
    updateResultUI(isVirusWinner) {
        const resultHeader = document.getElementById('result-header');
        const resultTitle = document.querySelector('.result-title');
        const resultSubtitle = document.querySelector('.result-subtitle');
        
        if (isVirusWinner) {
            resultHeader.className = 'result-header victory-virus';
            resultTitle.textContent = 'ПОБЕДА ВИРУСОВ!';
            resultSubtitle.textContent = player1Team === 'virus' ? `${settings.playerName} победил!` : `${settings.player2Name} победил!`;
        } else {
            resultHeader.className = 'result-header victory-bacteria';
            resultTitle.textContent = 'ПОБЕДА БАКТЕРИЙ!';
            resultSubtitle.textContent = player1Team === 'bacteria' ? `${settings.playerName} победил!` : `${settings.player2Name} победил!`;
        }
        
        const finalScore = player1Team === 'virus' ? gameScore.virus : gameScore.bacteria;
        document.getElementById('final-score').textContent = finalScore;
        
        const timePlayed = GAME_CONFIG.totalTime - gameTime;
        const minutes = Math.floor(timePlayed / 60);
        const seconds = timePlayed % 60;
        document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const totalCorrect = (correctAnswers.virus || 0) + (correctAnswers.bacteria || 0);
        const totalTotal = (totalAnswers.virus || 0) + (totalAnswers.bacteria || 0);
        document.getElementById('final-correct').textContent = `${totalCorrect}/${totalTotal}`;
        
        document.getElementById('final-combo').textContent = Math.max(maxCombo.virus || 0, maxCombo.bacteria || 0);
        
        const evolutionStages = document.querySelectorAll('.evolution-stage');
        const winningTeam = isVirusWinner ? 'virus' : 'bacteria';
        const winningEvolutionLevel = evolutionLevels[winningTeam] || 0;
        
        evolutionStages.forEach((stage, index) => {
            if (index <= winningEvolutionLevel) {
                stage.classList.add('achieved');
            } else {
                stage.classList.remove('achieved');
            }
        });
        
        if (finalScore > settings.highScore) {
            settings.highScore = finalScore;
            saveSettings();
            showNotification('Новый рекорд!', `Установлен новый рекорд: ${finalScore} очков!`, 'success');
        }
    }
    
    displayQuestion(team, question) {
        if (!question) return;
        
        const container = team === 'virus' 
            ? document.getElementById('virus-question-container') 
            : document.getElementById('bacteria-question-container');
        
        if (!container) return;
        
        const questionText = container.querySelector('.question-text');
        if (questionText) {
            questionText.textContent = question.text;
        }
        
        const answers = container.querySelectorAll('.answer-option');
        answers.forEach((answerBtn, index) => {
            if (question.answers[index]) {
                const answerText = answerBtn.querySelector('.answer-text');
                if (answerText) {
                    answerText.textContent = question.answers[index].text;
                }
                
                answerBtn.classList.remove('correct', 'incorrect');
                answerBtn.disabled = false;
                answerBtn.style.opacity = '1';
            }
        });
        
        this.startQuestionTimer(team);
    }
    
    startQuestionTimer(team) {
        if (questionTimers[team]) {
            clearInterval(questionTimers[team]);
        }
        
        let timeLeft = GAME_CONFIG.timerPerQuestion;
        const timerCircle = document.querySelector(`#${team}-timer .timer-circle-fg`);
        const timerValue = document.querySelector(`#${team}-timer .timer-value`);
        
        if (timerCircle && timerValue) {
            timerCircle.style.strokeDashoffset = 0;
            timerValue.textContent = timeLeft;
            
            questionTimers[team] = setInterval(() => {
                timeLeft--;
                
                const progress = (timeLeft / GAME_CONFIG.timerPerQuestion) * 100;
                timerCircle.style.strokeDashoffset = 100 - progress;
                timerValue.textContent = timeLeft;
                
                if (timeLeft <= 5) {
                    timerCircle.style.stroke = TEAM_COLORS.virus;
                    timerValue.style.color = TEAM_COLORS.virus;
                    
                    if (timeLeft <= 3) {
                        timerValue.classList.add('pulse');
                    }
                } else {
                    timerCircle.style.stroke = team === 'virus' ? TEAM_COLORS.virus : TEAM_COLORS.bacteria;
                    timerValue.style.color = team === 'virus' ? TEAM_COLORS.virus : TEAM_COLORS.bacteria;
                    timerValue.classList.remove('pulse');
                }
                
                if (timeLeft <= 0) {
                    clearInterval(questionTimers[team]);
                    this.handleTimeOut(team);
                }
            }, 1000);
        }
    }
    
    handleTimeOut(team) {
        const container = team === 'virus' 
            ? document.getElementById('virus-question-container') 
            : document.getElementById('bacteria-question-container');
        
        if (container) {
            const answers = container.querySelectorAll('.answer-option');
            answers.forEach(btn => {
                btn.classList.add('incorrect');
                btn.disabled = true;
                btn.style.opacity = '0.7';
            });
        }
        
        processAnswer(team, -1, false);
        showNotification('Время вышло!', `${team === 'virus' ? 'Вирусы' : 'Бактерии'} не успели ответить`, 'error');
        
        checkRoundCompletion();
    }
    
    highlightAnswer(team, answerIndex, isCorrect) {
        const container = team === 'virus' 
            ? document.getElementById('virus-question-container') 
            : document.getElementById('bacteria-question-container');
        
        if (!container) return;
        
        const answerBtn = container.querySelector(`.answer-option[data-index="${answerIndex}"]`);
        if (answerBtn) {
            answerBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
            answerBtn.disabled = true;
            answerBtn.style.opacity = isCorrect ? '1' : '0.7';
            
            const question = currentQuestions[team];
            if (question) {
                const answers = container.querySelectorAll('.answer-option');
                answers.forEach((btn, idx) => {
                    if (question.answers[idx].correct) {
                        btn.classList.add('correct');
                        btn.disabled = true;
                        btn.style.opacity = '1';
                    } else if (idx !== answerIndex) {
                        btn.style.opacity = '0.5';
                        btn.disabled = true;
                    }
                });
            }
        }
    }
    
    showEvolutionEffect(team) {
        const evolutionNotification = document.getElementById(`${team}-evolution`);
        if (evolutionNotification) {
            evolutionNotification.classList.add('show');
            
            const evolutionLevel = evolutionLevels[team] || 0;
            const evolutionData = EVOLUTION_LEVELS[team][evolutionLevel];
            const evoTitle = evolutionNotification.querySelector('.evo-title');
            const evoDesc = evolutionNotification.querySelector('.evo-desc');
            
            if (evoTitle && evoDesc) {
                evoTitle.textContent = `ЭВОЛЮЦИЯ ${team === 'virus' ? 'ВИРУСОВ' : 'БАКТЕРИЙ'}!`;
                evoDesc.textContent = evolutionData.name;
            }
            
            setTimeout(() => {
                evolutionNotification.classList.remove('show');
            }, 3000);
        }
    }
    
    showComboEffect(team, count) {
        const comboNotification = document.querySelector('.combo-notification');
        const comboCount = document.getElementById('combo-count');
        
        if (comboNotification && comboCount) {
            comboCount.textContent = count;
            comboNotification.classList.add('show');
            
            this.createFireworks();
            
            setTimeout(() => {
                comboNotification.classList.remove('show');
            }, 2000);
        }
    }
    
    createFireworks() {
        const comboEffects = document.getElementById('combo-effects');
        if (!comboEffects) return;
        
        const oldFireworks = comboEffects.querySelectorAll('.firework');
        oldFireworks.forEach(fw => fw.remove());
        
        for (let i = 0; i < 8; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.position = 'absolute';
            firework.style.width = '4px';
            firework.style.height = '4px';
            firework.style.borderRadius = '50%';
            firework.style.background = getRandomColor();
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.zIndex = '100';
            
            comboEffects.appendChild(firework);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;
            
            firework.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${targetX}px, ${targetY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });
            
            setTimeout(() => {
                if (firework.parentNode) {
                    firework.parentNode.removeChild(firework);
                }
            }, 1000);
        }
    }
    
    animateTitle() {
        const titleChars = document.querySelectorAll('.title-char');
        titleChars.forEach((char, index) => {
            char.style.animationDelay = `${index * 0.1}s`;
        });
        
        const subtitleChars = document.querySelectorAll('.subtitle-char');
        subtitleChars.forEach((char, index) => {
            char.style.animationDelay = `${index * 0.2}s`;
        });
    }
    
    animateTeamModels() {
        const teamModels = document.querySelectorAll('.team-entity');
        teamModels.forEach(model => {
            model.addEventListener('mousemove', (e) => {
                if (isTouchDevice) return;
                
                const rect = model.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateY = (x - centerX) / 20;
                const rotateX = (centerY - y) / 20;
                
                model.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            
            model.addEventListener('mouseleave', () => {
                model.style.transform = 'rotateX(0) rotateY(0)';
            });
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
            isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            isFullscreen = false;
        }
        
        playSound('click');
    }
    
    shareGame() {
        const shareData = {
            title: 'Микромир: Вирусы vs Бактерии',
            text: 'Играй в увлекательную биологическую игру и изучай науку весело!',
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Успешный шаринг'))
                .catch(error => console.log('Ошибка шаринга:', error));
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    showNotification('Ссылка скопирована', 'Ссылка на игру скопирована в буфер обмена!', 'success');
                })
                .catch(err => {
                    console.error('Ошибка копирования:', err);
                    showNotification('Ошибка', 'Не удалось скопировать ссылку', 'error');
                });
        }
        
        playSound('click');
    }
    
    showNotification(title, message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' :
                     type === 'error' ? 'fas fa-exclamation-circle' :
                     type === 'warning' ? 'fas fa-exclamation-triangle' :
                     'fas fa-info-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
        
        playSound(type === 'error' ? 'wrong' : 'click');
    }
}

// ==========================================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ И ИНИЦИАЛИЗАЦИЯ
// ==========================================================================

let questionManager;
let uiManager;
let audioManager;
let virusCreature;
let bacteriaCreature;
let answeredThisRound = { virus: false, bacteria: false };

/**
 * Инициализация игры
 */
function initGame() {
    console.log('Инициализация игры...');
    
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile || isTouchDevice) {
        document.body.classList.add('touch-device');
        console.log('Обнаружено сенсорное устройство');
    }
    
    loadSettings();
    
    questionManager = new QuestionManager();
    audioManager = new AudioManager();
    uiManager = new UIManager();
    
    audioManager.loadSettings();
    
    virusCreature = new Creature('virus', 'virus-entity');
    bacteriaCreature = new Creature('bacteria', 'bacteria-entity');
    
    updateQuestionCount();
    
    setTimeout(() => {
        const loadingIndicator = document.getElementById('menu-loading');
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 500);
        }
        
        const mobileLoading = document.getElementById('mobile-loading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
    }, 1500);
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    document.addEventListener('keydown', handleKeyDown);
    
    console.log('Игра инициализирована!');
}

/**
 * Обновление счетчика вопросов
 */
function updateQuestionCount() {
    const questionCount = document.getElementById('question-count');
    if (questionCount && questionManager) {
        questionCount.textContent = `${questionManager.questions.length}/500`;
    }
}

/**
 * Загрузка настроек
 */
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('microbiology_game_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            settings = { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
        settings = { ...DEFAULT_SETTINGS };
    }
}

/**
 * Сохранение настроек
 */
function saveSettings() {
    try {
        localStorage.setItem('microbiology_game_settings', JSON.stringify(settings));
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
    }
}

/**
 * Начало игры
 */
function startGame() {
    if (!player1Team || !player2Team) {
        player1Team = 'virus';
        player2Team = 'bacteria';
    }
    
    gameScore = { virus: 0, bacteria: 0 };
    player1Score = 0;
    player2Score = 0;
    gameTime = GAME_CONFIG.totalTime;
    correctAnswers = { virus: 0, bacteria: 0 };
    totalAnswers = { virus: 0, bacteria: 0 };
    comboCounter = { virus: 0, bacteria: 0 };
    maxCombo = { virus: 0, bacteria: 0 };
    evolutionLevels = { virus: 0, bacteria: 0 };
    questionHistory = [];
    askedQuestionsCount = { virus: [], bacteria: [] };
    usedQuestionIds.clear();
    currentRound = 1;
    isWaitingForNextRound = false;
    answeredThisRound = { virus: false, bacteria: false };
    
    virusCreature.reset();
    bacteriaCreature.reset();
    
    questionManager.initializeQuestionPools();
    
    uiManager.updateGameUI();
    uiManager.showScreen('game');
    gameState = GAME_STATE.PLAYING;
    
    startGameTimer();
    loadNewQuestions();
    
    showNotification('Игра началась!', `${settings.playerName} за вирусы, ${settings.player2Name} за бактерии!`, 'success');
}

/**
 * Загрузка новых вопросов
 */
function loadNewQuestions() {
    answeredThisRound = { virus: false, bacteria: false };
    isWaitingForNextRound = false;
    
    const virusQuestion = questionManager.getTeamQuestion('virus', settings.difficulty);
    const bacteriaQuestion = questionManager.getTeamQuestion('bacteria', settings.difficulty);
    
    currentQuestions.virus = virusQuestion;
    currentQuestions.bacteria = bacteriaQuestion;
    
    uiManager.displayQuestion('virus', virusQuestion);
    uiManager.displayQuestion('bacteria', bacteriaQuestion);
    
    questionHistory.push(virusQuestion.id, bacteriaQuestion.id);
    
    updateCurrentTopic();
    
    console.log(`Раунд ${currentRound}: Загружены новые вопросы`);
}

/**
 * Обновление темы
 */
function updateCurrentTopic() {
    const topicTags = document.querySelectorAll('.topic-tag');
    topicTags.forEach(tag => tag.classList.remove('active'));
    
    const virusTopic = currentQuestions.virus?.topic;
    const bacteriaTopic = currentQuestions.bacteria?.topic;
    
    if (virusTopic) {
        const topicTag = document.querySelector(`.topic-tag[data-topic="${virusTopic}"]`);
        if (topicTag) {
            topicTag.classList.add('active');
        }
    }
}

/**
 * Ответ на вопрос
 */
function answerQuestion(team, answerIndex) {
    if (gameState !== GAME_STATE.PLAYING || answeredThisRound[team] || isWaitingForNextRound) return;
    
    if (questionTimers[team]) {
        clearInterval(questionTimers[team]);
        questionTimers[team] = null;
    }
    
    const question = currentQuestions[team];
    if (!question) return;
    
    const isCorrect = question.answers[answerIndex]?.correct || false;
    
    uiManager.highlightAnswer(team, answerIndex, isCorrect);
    processAnswer(team, answerIndex, isCorrect);
    
    answeredThisRound[team] = true;
    
    checkRoundCompletion();
}

/**
 * Обработка ответа
 */
function processAnswer(team, answerIndex, isCorrect) {
    totalAnswers[team] = (totalAnswers[team] || 0) + 1;
    
    if (isCorrect) {
        correctAnswers[team] = (correctAnswers[team] || 0) + 1;
        comboCounter[team] = (comboCounter[team] || 0) + 1;
        
        if (comboCounter[team] > (maxCombo[team] || 0)) {
            maxCombo[team] = comboCounter[team];
        }
        
        const points = GAME_CONFIG.correctAnswerPoints * (comboCounter[team] > 1 ? GAME_CONFIG.comboMultiplier : 1);
        gameScore[team] += points;
        
        if (team === player1Team) {
            player1Score += points;
        } else {
            player2Score += points;
        }
        
        if (team === 'virus') {
            virusCreature.grow();
        } else {
            bacteriaCreature.grow();
        }
        
        if (team === 'virus') {
            virusCreature.attack(bacteriaCreature);
        } else {
            bacteriaCreature.attack(virusCreature);
        }
        
        playSound('correct');
        
        if (comboCounter[team] >= 3) {
            uiManager.showComboEffect(team, comboCounter[team]);
        }
        
        showAnswerExplanation(team, questionManager.getQuestionExplanation(currentQuestions[team].id));
    } else {
        comboCounter[team] = 0;
        gameScore[team] = Math.max(0, gameScore[team] - GAME_CONFIG.wrongAnswerPenalty);
        
        if (team === 'virus') {
            virusCreature.shrink();
        } else {
            bacteriaCreature.shrink();
        }
        
        if (team === 'virus') {
            bacteriaCreature.attack(virusCreature);
        } else {
            virusCreature.attack(bacteriaCreature);
        }
        
        playSound('wrong');
    }
    
    uiManager.updateGameUI();
    checkWinConditions();
}

/**
 * Показать объяснение
 */
function showAnswerExplanation(team, explanation) {
    if (!explanation) return;
    
    const teamName = team === 'virus' ? 'Вирусы' : 'Бактерии';
    const playerName = team === player1Team ? settings.playerName : settings.player2Name;
    
    uiManager.showNotification(
        `${playerName} ответил правильно!`,
        explanation,
        'success'
    );
}

/**
 * Проверка завершения раунда
 */
function checkRoundCompletion() {
    if (answeredThisRound.virus && answeredThisRound.bacteria) {
        isWaitingForNextRound = true;
        
        setTimeout(() => {
            currentRound++;
            loadNewQuestions();
            
            if (currentRound % 5 === 0) {
                showNotification('Новый уровень сложности!', 'Вопросы становятся сложнее!', 'warning');
            }
        }, 2000);
    }
}

/**
 * Проверка условий победы
 */
function checkWinConditions() {
    if (gameTime <= 0) {
        endGame();
        return;
    }
    
    if (virusCreature.health <= 0) {
        endGame('bacteria');
        return;
    }
    
    if (bacteriaCreature.health <= 0) {
        endGame('virus');
        return;
    }
    
    const scoreDifference = Math.abs(gameScore.virus - gameScore.bacteria);
    if (scoreDifference > 1000 && gameTime < 60) {
        const winner = gameScore.virus > gameScore.bacteria ? 'virus' : 'bacteria';
        endGame(winner);
        return;
    }
}

/**
 * Завершение игры
 */
function endGame(winner = null) {
    gameState = GAME_STATE.GAME_OVER;
    
    clearInterval(gameTimer);
    Object.values(questionTimers).forEach(timer => {
        if (timer) clearInterval(timer);
    });
    
    let finalWinner;
    if (winner) {
        finalWinner = winner;
    } else {
        finalWinner = gameScore.virus > gameScore.bacteria ? 'virus' : 'bacteria';
    }
    
    settings.totalGames++;
    settings.totalCorrect += (correctAnswers.virus || 0) + (correctAnswers.bacteria || 0);
    settings.totalQuestions += (totalAnswers.virus || 0) + (totalAnswers.bacteria || 0);
    saveSettings();
    
    if ((finalWinner === 'virus' && player1Team === 'virus') || (finalWinner === 'bacteria' && player1Team === 'bacteria')) {
        playSound('win');
    } else {
        playSound('lose');
    }
    
    uiManager.updateResultUI(finalWinner === 'virus');
    
    setTimeout(() => {
        uiManager.showScreen('result');
    }, 2000);
}

/**
 * Запуск игрового таймера
 */
function startGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameTimer = setInterval(() => {
        gameTime--;
        
        uiManager.updateGameUI();
        
        if (gameTime <= 0) {
            clearInterval(gameTimer);
            endGame();
        }
        
        if (gameTime === 30) {
            showNotification('Внимание!', 'Осталось 30 секунд!', 'warning');
            playSound('click');
        }
        
        if (gameTime === 10) {
            showNotification('Последний рывок!', 'Осталось 10 секунд!', 'error');
            playSound('click');
        }
    }, 1000);
}

/**
 * Пауза игры
 */
function pauseGame() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    gameState = GAME_STATE.PAUSED;
    
    clearInterval(gameTimer);
    Object.values(questionTimers).forEach(timer => {
        if (timer) clearInterval(timer);
    });
    
    uiManager.updatePauseUI();
    uiManager.showOverlay('pause-screen');
    playSound('click');
}

/**
 * Продолжить игру
 */
function resumeGame() {
    if (gameState !== GAME_STATE.PAUSED) return;
    
    gameState = GAME_STATE.PLAYING;
    
    uiManager.hideOverlay('pause-screen');
    startGameTimer();
    
    Object.keys(currentQuestions).forEach(team => {
        if (currentQuestions[team] && !answeredThisRound[team]) {
            uiManager.startQuestionTimer(team);
        }
    });
    
    playSound('click');
}

/**
 * Перезапуск игры
 */
function restartGame() {
    uiManager.hideOverlay('pause-screen');
    uiManager.hideOverlay('how-to-play-screen');
    uiManager.hideOverlay('topics-screen');
    uiManager.hideOverlay('about-screen');
    
    uiManager.showScreen('team');
    gameState = GAME_STATE.TEAM_SELECTION;
    
    playSound('click');
}

/**
 * Вернуться в меню
 */
function returnToMenu() {
    uiManager.hideOverlay('pause-screen');
    uiManager.hideOverlay('how-to-play-screen');
    uiManager.hideOverlay('topics-screen');
    uiManager.hideOverlay('about-screen');
    
    uiManager.showScreen('menu');
    gameState = GAME_STATE.MENU;
    
    clearInterval(gameTimer);
    Object.values(questionTimers).forEach(timer => {
        if (timer) clearInterval(timer);
    });
    
    playSound('click');
}

/**
 * Использовать подсказку
 */
function useHint() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const hintCounter = document.querySelector('.hint-counter');
    let hints = parseInt(hintCounter.textContent) || 3;
    
    if (hints > 0) {
        hints--;
        hintCounter.textContent = hints;
        
        const currentTeam = !answeredThisRound.virus ? 'virus' : 'bacteria';
        const question = currentQuestions[currentTeam];
        
        if (question) {
            const correctIndex = question.answers.findIndex(answer => answer.correct);
            const container = currentTeam === 'virus' 
                ? document.getElementById('virus-question-container') 
                : document.getElementById('bacteria-question-container');
            
            if (container) {
                const correctBtn = container.querySelector(`.answer-option[data-index="${correctIndex}"]`);
                if (correctBtn) {
                    let blinkCount = 0;
                    const blinkInterval = setInterval(() => {
                        correctBtn.classList.toggle('correct');
                        
                        blinkCount++;
                        if (blinkCount >= 6) {
                            clearInterval(blinkInterval);
                            correctBtn.classList.remove('correct');
                        }
                    }, 300);
                }
            }
            
            const playerName = currentTeam === player1Team ? settings.playerName : settings.player2Name;
            showNotification('Подсказка!', `${playerName}: правильный ответ мигает зеленым`, 'info');
        }
        
        playSound('click');
    } else {
        showNotification('Подсказки закончились', 'Вы использовали все подсказки', 'warning');
        playSound('wrong');
    }
}

/**
 * Ручная атака
 */
function manualAttack() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const currentPlayer = !answeredThisRound.virus ? 'virus' : 'bacteria';
    
    if (currentPlayer === 'virus') {
        virusCreature.attack(bacteriaCreature);
    } else {
        bacteriaCreature.attack(virusCreature);
    }
    
    playSound('attack');
}

/**
 * Принудительная эволюция
 */
function forceEvolution() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    const currentPlayer = !answeredThisRound.virus ? 'virus' : 'bacteria';
    
    if (currentPlayer === 'virus') {
        if (virusCreature.evolve()) {
            evolutionLevels.virus++;
            uiManager.showEvolutionEffect('virus');
            playSound('evolution');
        } else {
            showNotification('Максимальная эволюция', 'Вирус достиг максимального уровня', 'info');
        }
    } else {
        if (bacteriaCreature.evolve()) {
            evolutionLevels.bacteria++;
            uiManager.showEvolutionEffect('bacteria');
            playSound('evolution');
        } else {
            showNotification('Максимальная эволюция', 'Бактерия достигла максимального уровня', 'info');
        }
    }
}

/**
 * Воспроизведение звука
 */
function playSound(name) {
    if (audioManager) {
        audioManager.playSound(name);
    }
}

/**
 * Переключение звука
 */
function toggleSound() {
    if (audioManager) {
        const newState = !audioManager.isSoundEnabled;
        audioManager.toggleSound(newState);
        
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = newState;
        }
        
        showNotification(
            newState ? 'Звук включен' : 'Звук выключен',
            newState ? 'Звуковые эффекты активированы' : 'Звуковые эффекты отключены',
            'info'
        );
    }
}

/**
 * Обработчик полноэкранного режима
 */
function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement || 
                   !!document.webkitFullscreenElement || 
                   !!document.msFullscreenElement;
}

/**
 * Обработчик нажатия клавиш
 */
function handleKeyDown(e) {
    switch (e.key) {
        case 'Escape':
            if (gameState === GAME_STATE.PLAYING) {
                pauseGame();
            } else if (gameState === GAME_STATE.PAUSED) {
                resumeGame();
            }
            break;
            
        case ' ':
            if (gameState === GAME_STATE.PLAYING) {
                pauseGame();
            }
            break;
            
        case '1':
        case '2':
        case '3':
        case '4':
            if (gameState === GAME_STATE.PLAYING) {
                const answerIndex = parseInt(e.key) - 1;
                const currentPlayer = !answeredThisRound.virus ? 'virus' : 'bacteria';
                answerQuestion(currentPlayer, answerIndex);
            }
            break;
            
        case 'h':
            if (gameState === GAME_STATE.PLAYING) {
                useHint();
            }
            break;
            
        case 'a':
            if (gameState === GAME_STATE.PLAYING) {
                manualAttack();
            }
            break;
            
        case 'e':
            if (gameState === GAME_STATE.PLAYING) {
                forceEvolution();
            }
            break;
            
        case 'm':
            if (audioManager) {
                const newState = !audioManager.isMusicEnabled;
                audioManager.toggleMusic(newState);
                
                const musicToggle = document.getElementById('music-toggle');
                if (musicToggle) {
                    musicToggle.checked = newState;
                }
            }
            break;
    }
}

/**
 * Показать уведомление
 */
function showNotification(title, message, type = 'info') {
    if (uiManager) {
        uiManager.showNotification(title, message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}

/**
 * Получение случайного цвета
 */
function getRandomColor() {
    const colors = [
        '#ff2a6d', '#05d9e8', '#9d4edd', '#ffd166', 
        '#06d6a0', '#ff6b9d', '#4cc9f0', '#7209b7'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Инициализация космического фона
 */
function initCosmicBackground() {
    const particlesField = document.getElementById('particles-field');
    if (!particlesField) return;
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.className = 'cosmic-particle';
        particle.style.position = 'absolute';
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
        particle.style.borderRadius = '50%';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.zIndex = '0';
        
        particlesField.appendChild(particle);
        animateParticle(particle);
    }
    
    const energyField = document.getElementById('energy-field');
    if (energyField) {
        setInterval(() => {
            createEnergyWave();
        }, 3000);
    }
}

/**
 * Анимация частицы
 */
function animateParticle(particle) {
    const startX = parseFloat(particle.style.left);
    const startY = parseFloat(particle.style.top);
    
    const targetX = startX + (Math.random() - 0.5) * 50;
    const targetY = startY + (Math.random() - 0.5) * 50;
    
    const duration = 10000 + Math.random() * 20000;
    
    particle.animate([
        { transform: 'translate(0, 0)', opacity: 0.3 },
        { transform: `translate(${targetX - startX}%, ${targetY - startY}%)`, opacity: 0.1 }
    ], {
        duration: duration,
        easing: 'linear',
        iterations: Infinity,
        direction: 'alternate'
    });
}

/**
 * Создание энергетической волны
 */
function createEnergyWave() {
    const energyField = document.getElementById('energy-field');
    if (!energyField) return;
    
    const wave = document.createElement('div');
    wave.className = 'energy-wave';
    wave.style.position = 'absolute';
    wave.style.width = '0';
    wave.style.height = '0';
    wave.style.border = '2px solid rgba(5, 217, 232, 0.3)';
    wave.style.borderRadius = '50%';
    wave.style.left = `${Math.random() * 100}%`;
    wave.style.top = `${Math.random() * 100}%`;
    wave.style.transform = 'translate(-50%, -50%)';
    wave.style.zIndex = '0';
    
    energyField.appendChild(wave);
    
    wave.animate([
        { width: '0', height: '0', opacity: 1 },
        { width: '500px', height: '500px', opacity: 0 }
    ], {
        duration: 2000,
        easing: 'ease-out'
    });
    
    setTimeout(() => {
        if (wave.parentNode) {
            wave.parentNode.removeChild(wave);
        }
    }, 2000);
}

/**
 * Инициализация микроскопических элементов
 */
function initMicroscopicElements() {
    const microscopicElements = document.getElementById('microscopic-elements');
    if (!microscopicElements) return;
    
    const cellTypes = ['cell', 'mitochondria', 'ribosome', 'nucleus', 'vacuole'];
    
    for (let i = 0; i < 20; i++) {
        const element = document.createElement('div');
        element.className = `microscopic-element ${cellTypes[Math.floor(Math.random() * cellTypes.length)]}`;
        element.style.position = 'absolute';
        element.style.width = `${Math.random() * 40 + 20}px`;
        element.style.height = element.style.width;
        element.style.background = getRandomMicroscopicColor();
        element.style.borderRadius = cellTypes.includes('cell') ? '50%' : '10%';
        element.style.left = `${Math.random() * 100}%`;
        element.style.top = `${Math.random() * 100}%`;
        element.style.opacity = '0.1';
        element.style.zIndex = '0';
        
        microscopicElements.appendChild(element);
        animateMicroscopicElement(element);
    }
}

/**
 * Получение цвета для микроскопического элемента
 */
function getRandomMicroscopicColor() {
    const colors = [
        'rgba(255, 42, 109, 0.1)',
        'rgba(5, 217, 232, 0.1)',
        'rgba(157, 78, 221, 0.1)',
        'rgba(255, 209, 102, 0.1)',
        'rgba(6, 214, 160, 0.1)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Анимация микроскопического элемента
 */
function animateMicroscopicElement(element) {
    const startX = parseFloat(element.style.left);
    const startY = parseFloat(element.style.top);
    
    const targetX = startX + (Math.random() - 0.5) * 30;
    const targetY = startY + (Math.random() - 0.5) * 30;
    
    const duration = 15000 + Math.random() * 15000;
    
    element.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0.1 },
        { transform: `translate(${targetX - startX}%, ${targetY - startY}%) rotate(180deg)`, opacity: 0.05 },
        { transform: `translate(0, 0) rotate(360deg)`, opacity: 0.1 }
    ], {
        duration: duration,
        easing: 'ease-in-out',
        iterations: Infinity
    });
}

/**
 * Инициализация 4D-эффектов
 */
function init4DEffects() {
    document.addEventListener('mousemove', (e) => {
        if (isTouchDevice) return;
        
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        const starsLayers = document.querySelectorAll('.stars-layer');
        starsLayers.forEach((layer, index) => {
            const speed = 0.5 + index * 0.2;
            layer.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
        });
        
        const nebulae = document.querySelectorAll('.nebula');
        nebulae.forEach((nebula, index) => {
            const speed = 0.3 + index * 0.1;
            nebula.style.transform = `translate(${x * speed * 50}px, ${y * speed * 50}px)`;
        });
    });
    
    const buttons = document.querySelectorAll('.menu-btn, .btn-select-team, .control-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            if (isTouchDevice) return;
            
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const shadowX = (x - centerX) / 10;
            const shadowY = (y - centerY) / 10;
            
            btn.style.transform = `perspective(1000px) rotateX(${-shadowY}deg) rotateY(${shadowX}deg) translateZ(10px)`;
            btn.style.boxShadow = `${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, 0.3)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            btn.style.boxShadow = '';
        });
    });
    
    const cards = document.querySelectorAll('.team-card, .topic-card, .feature');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (isTouchDevice) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (x - centerX) / 20;
            const rotateX = (centerY - y) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            const glow = card.querySelector('.topic-glow, .btn-glow, .select-glow');
            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.2), transparent)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            
            const glow = card.querySelector('.topic-glow, .btn-glow, .select-glow');
            if (glow) {
                glow.style.background = '';
            }
        });
    });
}

/**
 * Проверка поддержки WebGL
 */
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl && gl instanceof WebGLRenderingContext) {
        document.body.classList.add('webgl-supported');
        console.log('WebGL поддерживается');
        return true;
    } else {
        document.body.classList.add('webgl-not-supported');
        console.log('WebGL не поддерживается, используются базовые эффекты');
        return false;
    }
}

/**
 * Оптимизация для мобильных устройств
 */
function optimizeForMobile() {
    if (!isMobile && !isTouchDevice) return;
    
    console.log('Оптимизация для мобильных устройств...');
    
    const particles = document.querySelectorAll('.cosmic-particle');
    for (let i = 20; i < particles.length; i++) {
        if (particles[i].parentNode) {
            particles[i].parentNode.removeChild(particles[i]);
        }
    }
    
    document.body.classList.add('reduced-motion');
    
    const heavyEffects = document.querySelectorAll('.energy-wave, .microscopic-element');
    heavyEffects.forEach(effect => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    });
}

// ==========================================================================
// ЗАПУСК ИГРЫ
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация игры...');
    
    checkWebGLSupport();
    initGame();
    initCosmicBackground();
    initMicroscopicElements();
    init4DEffects();
    
    setTimeout(optimizeForMobile, 1000);
    
    window.addEventListener('resize', handleResize);
    
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
});

/**
 * Обработчик изменения размера окна
 */
function handleResize() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    if (uiManager && gameState === GAME_STATE.PLAYING) {
        uiManager.updateGameUI();
    }
}

window.game = {
    initGame,
    startGame,
    pauseGame,
    restartGame,
    settings,
    gameState,
    gameScore,
    player1Score,
    player2Score
};

console.log('Biology.js загружен и готов к работе!');