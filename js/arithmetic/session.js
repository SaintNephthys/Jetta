(() => {
  'use strict';
  const { makeQuestion, summarize, validCustomDigits } = globalThis.Jetta;

  class PracticeSession {
    constructor({
      mode,
      limit,
      selected,
      level,
      customDigits = null,
      now = Date.now(),
      random = Math.random,
    }) {
      if (
        !['count', 'time'].includes(mode) ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        !selected?.length ||
        selected.some((op) => !['add', 'subtract', 'multiply', 'divide'].includes(op)) ||
        !['easy', 'medium', 'custom', 'hard'].includes(level) ||
        (level === 'custom' && !validCustomDigits(customDigits, selected))
      )
        throw new Error('Invalid practice settings');
      Object.assign(this, { mode, limit, selected: [...selected], level, started: now, random });
      this.customDigits = level === 'custom' ? { ...customDigits } : null;
      this.answers = [];
      this.queue = [];
      this.finishedAt = null;
      this.question = this.nextQuestion();
    }

    nextQuestion() {
      if (!this.queue.length) {
        this.queue = [...this.selected];
        for (let i = this.queue.length - 1; i > 0; i--) {
          const j = Math.floor(this.random() * (i + 1));
          [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
      }
      return makeQuestion(this.queue.pop(), this.level, this.random, this.customDigits);
    }

    elapsed(now) {
      const end = this.finishedAt ?? now;
      const seconds = Math.max(0, (end - this.started) / 1000);
      return this.mode === 'time' ? Math.min(this.limit, seconds) : seconds;
    }

    update(now) {
      if (
        this.finishedAt === null &&
        this.mode === 'time' &&
        now >= this.started + this.limit * 1000
      ) {
        this.finishedAt = this.started + this.limit * 1000;
      }
      return this.finishedAt !== null;
    }

    submit(value, now) {
      if (this.update(now) || !Number.isSafeInteger(value) || value < 0) return false;
      this.answers.push({ question: this.question, userAnswer: value });
      if (this.mode === 'count' && this.answers.length === this.limit) this.finishedAt = now;
      else this.question = this.nextQuestion();
      return true;
    }

    summary(now) {
      const summary = summarize(this.answers);
      const seconds = this.elapsed(now);
      return {
        ...summary,
        seconds,
        average: summary.total ? seconds / summary.total : null,
        mode: this.mode,
      };
    }
  }

  globalThis.Jetta.PracticeSession = PracticeSession;
})();
