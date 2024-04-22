import { atom } from 'jotai';
import { Rule } from '../action/grouping/TabGrouper';
import { tabGrouper } from './tabs';

export const groupingRulesAtom = atom<Rule[]>([]);
groupingRulesAtom.onMount = (setAtom) => {
  const listener = tabGrouper.observeRules((rules: Rule[]) => setAtom(rules));
  return () => tabGrouper.unobserveRules(listener);
};

export const addRuleAtom = atom(null, async (get, set, rule: Rule) => {
  const newRules = [rule, ...get(groupingRulesAtom)];
  await tabGrouper.updateRules(newRules);
});

export const removeRuleAtom = atom(null, async (get, set, rule: Rule) => {
  const newRules = get(groupingRulesAtom).filter((r) => r.id !== rule.id);
  await tabGrouper.updateRules(newRules);
});

export const updateRuleAtom = atom(null, async (get, set, rule: Rule) => {
  const rules = get(groupingRulesAtom).slice();
  rules.splice(
    rules.findIndex((r) => r.id === rule.id),
    1,
    rule,
  );
  await tabGrouper.updateRules(rules);
});

export const restoreDefaultRulesAtom = atom(null, async () => {
  await tabGrouper.restoreDefaultRules();
});
