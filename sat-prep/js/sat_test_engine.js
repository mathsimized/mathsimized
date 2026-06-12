const SATTestEngine = {
  currentState: 'idle',
  currentModule: 1,
  currentQuestion: 0,
  answers: {},
  markedForReview: {},
  eliminatedChoices: {},
  timeRemaining: 0,
  module1Score: 0,
  module2Score: 0,
  adaptivePath: null,
  testType: 'full',
  questions: null,
  module1Questions: [],
  module2Questions: [],
  isPaused: false,
  timerInterval: null,

  englishQuestions: [],
  mathQuestions: [],
  currentSection: 'english',

  MODULE_TIME: 2100,
  QUICK_TIME: 900,
  TRANSITION_DELAY: 3000,

  dispatchEvent: function(name, detail) {
    if (typeof CustomEvent === 'undefined') return;
    const event = new CustomEvent(name, { detail: detail || {} });
    if (typeof document !== 'undefined' && document.dispatchEvent) {
      document.dispatchEvent(event);
    }
  },

  getFormattedTime: function(seconds) {
    if (seconds == null) seconds = this.timeRemaining;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  startTimer: function(seconds) {
    this.stopTimer();
    this.timeRemaining = seconds;
    this.isPaused = false;

    this.dispatchEvent('sat:timerUpdate', {
      timeRemaining: this.timeRemaining,
      formatted: this.getFormattedTime(),
      isLow: this.timeRemaining <= 300
    });

    this.timerInterval = setInterval(function() {
      if (SATTestEngine.isPaused) return;

      SATTestEngine.timeRemaining--;
      const isLow = SATTestEngine.timeRemaining <= 300;
      const formatted = SATTestEngine.getFormattedTime();

      SATTestEngine.dispatchEvent('sat:timerUpdate', {
        timeRemaining: SATTestEngine.timeRemaining,
        formatted: formatted,
        isLow: isLow
      });

      if (SATTestEngine.timeRemaining <= 0) {
        SATTestEngine.stopTimer();
        SATTestEngine.dispatchEvent('sat:timerExpired', {
          module: SATTestEngine.currentModule,
          state: SATTestEngine.currentState
        });
        SATTestEngine.handleTimerExpired();
      }
    }, 1000);
  },

  stopTimer: function() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  handleTimerExpired: function() {
    if (this.testType === 'quick') {
      this.finishQuickTest();
    } else if (this.currentModule === 1) {
      this.submitModule1();
    } else if (this.currentModule === 2) {
      this.finishTest();
    }
  },

  switchToSection: function(section) {
    if (section !== 'english' && section !== 'math') return;
    this.currentSection = section;
    this.currentQuestion = 0;
    if (section === 'english') {
      this.currentState = 'english_section';
    } else {
      this.currentState = 'math_section';
    }
    this.dispatchEvent('sat:sectionChange', { section: section });
    this.dispatchEvent('sat:stateChange', { state: this.currentState, section: section });
    this.saveToSession();
  },

  getSectionCorrect: function(section) {
    const questions = section === 'english' ? this.englishQuestions : this.mathQuestions;
    if (!questions || questions.length === 0) return 0;
    let correct = 0;
    questions.forEach(function(q) {
      if (SATTestEngine.answers[q.id] === q.correct_answer) correct++;
    });
    return correct;
  },

  goToQuestion: function(index) {
    const questions = this.getCurrentQuestions();
    if (!questions || index < 0 || index >= questions.length) return;

    this.currentQuestion = index;
    this.saveToSession();

    const q = questions[index];
    this.dispatchEvent('sat:questionChange', {
      questionIndex: index,
      questionId: q ? q.id : null
    });
    this.dispatchEvent('sat:stateChange', { state: this.currentState });
  },

  answerQuestion: function(questionId, answer) {
    this.answers[questionId] = answer;
    this.saveToSession();
    this.dispatchEvent('sat:answerChange', { questionId: questionId, answer: answer });
    this.dispatchEvent('sat:stateChange', { state: this.currentState });
  },

  toggleMarkForReview: function(questionId) {
    if (this.markedForReview[questionId]) {
      delete this.markedForReview[questionId];
    } else {
      this.markedForReview[questionId] = true;
    }
    this.saveToSession();
    this.dispatchEvent('sat:stateChange', { state: this.currentState });
  },

  toggleEliminateChoice: function(questionId, choice) {
    if (!this.eliminatedChoices[questionId]) {
      this.eliminatedChoices[questionId] = {};
    }
    if (this.eliminatedChoices[questionId][choice]) {
      delete this.eliminatedChoices[questionId][choice];
    } else {
      this.eliminatedChoices[questionId][choice] = true;
    }
    this.saveToSession();
    this.dispatchEvent('sat:stateChange', { state: this.currentState });
  },

  getCurrentQuestions: function() {
    if (this.testType === 'quick') {
      if (this.currentSection === 'english') return this.englishQuestions;
      if (this.currentSection === 'math') return this.mathQuestions;
      return this.questions;
    }
    if (this.currentModule === 1) return this.module1Questions;
    return this.module2Questions;
  },

  getQuestionState: function(questionId) {
    return {
      answered: questionId in this.answers,
      answer: this.answers[questionId] || null,
      marked: !!this.markedForReview[questionId],
      eliminated: this.eliminatedChoices[questionId] || {}
    };
  },

  getProgress: function() {
    const questions = this.getCurrentQuestions();
    if (!questions || questions.length === 0) return { answered: 0, total: 0, percentage: 0 };
    let answered = 0;
    questions.forEach(function(q) {
      if (q.id in SATTestEngine.answers) answered++;
    });
    return {
      answered: answered,
      total: questions.length,
      percentage: Math.round((answered / questions.length) * 100)
    };
  },

  calculateModuleScore: function(module) {
    const questions = module === 'module1'
      ? (SAT_QUESTIONS ? SAT_QUESTIONS.module1 : this.module1Questions)
      : this.module2Questions;
    if (!questions) return 0;
    let correct = 0;
    questions.forEach(function(q) {
      if (SATTestEngine.answers[q.id] === q.correct_answer) correct++;
    });
    return correct;
  },

  determineAdaptivePath: function() {
    this.module1Score = this.calculateModuleScore('module1');
    this.adaptivePath = this.module1Score >= 14 ? 'hard' : 'easy';
    if (SAT_QUESTIONS) {
      const key = this.adaptivePath === 'hard' ? 'module2_hard' : 'module2_easy';
      if (SAT_QUESTIONS[key]) {
        this.module2Questions = SAT_QUESTIONS[key].slice();
      }
    }
  },

  calculateScaledScore: function(raw) {
    if (this.testType === 'quick') {
      return this.calculateQuickScore(raw);
    }
    const scaled = Math.round((raw / 44) * 800 / 10) * 10;
    return Math.min(800, Math.max(200, scaled));
  },

  calculateQuickScore: function(raw, outOf) {
    outOf = outOf || 10;
    const base = Math.round((raw / outOf) * 800 / 10) * 10;
    return Math.min(800, Math.max(200, base));
  },

  initFullTest: function() {
    this.resetState();
    this.testType = 'full';
    this.currentModule = 1;
    this.currentState = 'module1';
    this.currentQuestion = 0;

    if (SAT_QUESTIONS && SAT_QUESTIONS.module1) {
      this.module1Questions = SAT_QUESTIONS.module1.slice();
    }

    this.startTimer(this.MODULE_TIME);
    this.saveToSession();
    this.dispatchEvent('sat:stateChange', { state: 'module1', module: 1 });
  },

  initQuickTest: function(subject) {
    this.resetState();
    this.testType = 'quick';
    this.currentModule = 1;
    this.currentSection = 'english';
    this.currentState = 'english_section';
    this.currentQuestion = 0;
    this.subject = subject || 'combined';

    this.englishQuestions = [];
    this.mathQuestions = [];

    if (typeof SAT_ENGLISH_QUESTIONS !== 'undefined' && SAT_ENGLISH_QUESTIONS.quick_test) {
      this.englishQuestions = SAT_ENGLISH_QUESTIONS.quick_test.slice(0, 5);
    }
    if (SAT_QUESTIONS && SAT_QUESTIONS.quick_test) {
      this.mathQuestions = SAT_QUESTIONS.quick_test.slice(0, 5);
    }

    this.subject = 'combined';
    this.startTimer(this.QUICK_TIME);
    this.saveToSession();
    this.dispatchEvent('sat:stateChange', { state: 'english_section', module: 1, quick: true, subject: 'combined' });
  },

  submitModule1: function() {
    this.stopTimer();
    this.module1Score = this.calculateModuleScore('module1');

    if (this.testType === 'quick') {
      this.finishQuickTest();
      return;
    }

    this.determineAdaptivePath();
    this.currentState = 'transition';
    this.dispatchEvent('sat:stateChange', { state: 'transition', module: 1 });
    this.dispatchEvent('sat:moduleComplete', {
      module: 1,
      score: this.module1Score,
      adaptivePath: this.adaptivePath
    });
    this.saveToSession();

    var self = this;
    setTimeout(function() {
      self.currentState = 'break';
      self.dispatchEvent('sat:stateChange', { state: 'break', module: 1 });
      self.saveToSession();
    }, this.TRANSITION_DELAY);
  },

  startModule2: function() {
    this.currentModule = 2;
    this.currentQuestion = 0;
    this.currentState = 'module2';

    if (SAT_QUESTIONS) {
      const key = this.adaptivePath === 'hard' ? 'module2_hard' : 'module2_easy';
      if (SAT_QUESTIONS[key]) {
        this.module2Questions = SAT_QUESTIONS[key].slice();
      }
    }

    this.startTimer(this.MODULE_TIME);
    this.saveToSession();
    this.dispatchEvent('sat:stateChange', { state: 'module2', module: 2, adaptivePath: this.adaptivePath });
  },

  getResults: function() {
    if (this.testType === 'quick') {
      const engCorrect = this.getSectionCorrect('english');
      const mathCorrect = this.getSectionCorrect('math');
      const engTotal = this.englishQuestions.length || 5;
      const mathTotal = this.mathQuestions.length || 5;
      const engScaled = this.calculateQuickScore(engCorrect, engTotal);
      const mathScaled = this.calculateQuickScore(mathCorrect, mathTotal);
      const totalScaled = engScaled + mathScaled;

      return {
        testType: 'quick',
        englishCorrect: engCorrect,
        englishTotal: engTotal,
        englishScaled: engScaled,
        mathCorrect: mathCorrect,
        mathTotal: mathTotal,
        mathScaled: mathScaled,
        totalCorrect: engCorrect + mathCorrect,
        totalQuestions: engTotal + mathTotal,
        scaledScore: totalScaled,
        answers: Object.assign({}, this.answers)
      };
    }

    const module1Correct = this.calculateModuleScore('module1');
    const module2Correct = this.currentModule >= 2 ? this.calculateModuleScore('module2') : 0;
    const totalCorrect = module1Correct + module2Correct;
    const totalQuestions = 44;
    const scaledScore = this.calculateScaledScore(totalCorrect);

    return {
      testType: this.testType,
      module1Correct: module1Correct,
      module2Correct: module2Correct,
      totalCorrect: totalCorrect,
      totalQuestions: totalQuestions,
      scaledScore: scaledScore,
      adaptivePath: this.adaptivePath,
      answers: Object.assign({}, this.answers)
    };
  },

  finishTest: function() {
    this.stopTimer();
    this.currentState = 'finished';

    const results = this.getResults();
    this.dispatchEvent('sat:testComplete', { results: results });
    this.dispatchEvent('sat:stateChange', { state: 'finished' });
    this.saveToSession();
  },

  finishQuickTest: function() {
    this.stopTimer();
    this.currentState = 'finished';

    const results = this.getResults();
    this.dispatchEvent('sat:testComplete', { results: results });
    this.dispatchEvent('sat:stateChange', { state: 'finished' });
    this.saveToSession();
  },

  getTimeDisplay: function() {
    return this.getFormattedTime(this.timeRemaining);
  },

  resetState: function() {
    this.stopTimer();
    this.currentState = 'idle';
    this.currentModule = 1;
    this.currentQuestion = 0;
    this.answers = {};
    this.markedForReview = {};
    this.eliminatedChoices = {};
    this.timeRemaining = 0;
    this.module1Score = 0;
    this.module2Score = 0;
    this.adaptivePath = null;
    this.testType = 'full';
    this.questions = null;
    this.module1Questions = [];
    this.module2Questions = [];
    this.englishQuestions = [];
    this.mathQuestions = [];
    this.currentSection = 'english';
    this.isPaused = false;
    this.subject = 'combined';
  },

  saveToSession: function() {
    try {
      const state = {
        currentState: this.currentState,
        currentModule: this.currentModule,
        currentQuestion: this.currentQuestion,
        currentSection: this.currentSection,
        answers: this.answers,
        markedForReview: this.markedForReview,
        eliminatedChoices: this.eliminatedChoices,
        timeRemaining: this.timeRemaining,
        module1Score: this.module1Score,
        module2Score: this.module2Score,
        adaptivePath: this.adaptivePath,
        testType: this.testType,
        isPaused: this.isPaused,
        subject: this.subject
      };
      sessionStorage.setItem('sat_test_state', JSON.stringify(state));
    } catch (e) {
      // sessionStorage not available or full
    }
  },

  loadFromSession: function() {
    try {
      const saved = sessionStorage.getItem('sat_test_state');
      if (!saved) return false;

      const state = JSON.parse(saved);
      this.currentState = state.currentState || 'idle';
      this.currentModule = state.currentModule || 1;
      this.currentQuestion = state.currentQuestion || 0;
      this.answers = state.answers || {};
      this.markedForReview = state.markedForReview || {};
      this.eliminatedChoices = state.eliminatedChoices || {};
      this.timeRemaining = state.timeRemaining || 0;
      this.module1Score = state.module1Score || 0;
      this.module2Score = state.module2Score || 0;
      this.adaptivePath = state.adaptivePath || null;
      this.testType = state.testType || 'full';
      this.isPaused = state.isPaused || false;

      this.subject = state.subject || 'combined';
      this.currentSection = state.currentSection || 'english';

      if (SAT_QUESTIONS || SAT_ENGLISH_QUESTIONS) {
        if (this.testType === 'quick') {
          if (typeof SAT_ENGLISH_QUESTIONS !== 'undefined' && SAT_ENGLISH_QUESTIONS.quick_test) {
            this.englishQuestions = SAT_ENGLISH_QUESTIONS.quick_test.slice(0, 5);
          }
          if (SAT_QUESTIONS && SAT_QUESTIONS.quick_test) {
            this.mathQuestions = SAT_QUESTIONS.quick_test.slice(0, 5);
          }
        } else {
          if (SAT_QUESTIONS.module1) {
            this.module1Questions = SAT_QUESTIONS.module1.slice();
          }
          if (this.module2Questions.length === 0 && this.adaptivePath) {
            const key = this.adaptivePath === 'hard' ? 'module2_hard' : 'module2_easy';
            if (SAT_QUESTIONS[key]) {
              this.module2Questions = SAT_QUESTIONS[key].slice();
            }
          }
        }
      }

      if (this.currentState === 'module1' || this.currentState === 'module2' || this.currentState === 'english_section' || this.currentState === 'math_section') {
        if (this.timeRemaining > 0 && !this.timerInterval) {
          this.startTimer(this.timeRemaining);
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  },

  clearSession: function() {
    try {
      sessionStorage.removeItem('sat_test_state');
    } catch (e) {
      // sessionStorage not available
    }
  }
};
