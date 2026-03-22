export interface SM2Input {
  quality: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, easeFactor, interval, repetitions } = input;
  
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    switch (repetitions) {
      case 0:
        newInterval = 1;
        break;
      case 1:
        newInterval = 6;
        break;
      default:
        newInterval = Math.round(interval * easeFactor);
        break;
    }
    newRepetitions = repetitions + 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}
