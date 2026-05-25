import { AntiSpamRule } from './rules/AntiSpamRule';

export class HybridEngine {
  constructor() {
    this.rules = [new AntiSpamRule(10000)];
  }

  decide(initialDecision, appContext) {
    let finalDecision = initialDecision;

    for (const rule of this.rules) {
      finalDecision = rule.execute(finalDecision, appContext);
    }

    return finalDecision;
  }
}
