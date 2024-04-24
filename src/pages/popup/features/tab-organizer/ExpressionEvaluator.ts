import { useAtomValue } from 'jotai';
import { useMemo, useState, useEffect } from 'react';
import {
  GroupTabsByOptions,
  GroupSortOrder,
  TabSortOrder,
  TabFilterType,
} from '../../../../action/TabFilter';
import { Rule, TabGrouper } from '../../../../action/grouping/TabGrouper';
import { TabGroupingStrategies } from '../../../../action/grouping/TabGroupingStrategies';
import { allTabsAtom, currentWindowAtom } from '../../../../state/tabs';
import { Tab } from '../../../../tabutil';
import { ExpressionGroupedOutput } from '../../../../action/grouping/ExpressionGroupingStrategy';

export type TabExpressionCaptureGroup = {
  definition: string;
  startIndex: number;
  endIndex: number;
  groupIndex: number;
};

export type EvaluatedTabExpression = {
  expression: string;
  valid: boolean;
  captureGroups: TabExpressionCaptureGroup[];
  totalTabs: number;
  matchedTabs: Tab[];
} & (
  | { loading: true; matches: null }
  | { loading: false; matches: ExpressionGroupedOutput }
);

export function useEvaluateTabExpression(
  expression: string,
  selectedCaptureGroups: number[],
): EvaluatedTabExpression {
  const groups = useMemo(() => countExpressionGroups(expression), [expression]);
  const externalGroupsValue = useMemo(() => groups ?? [], [groups]);
  const { all } = useAtomValue(allTabsAtom);
  const currentWindow = useAtomValue(currentWindowAtom);

  const matchedTabs = useMemo(() => {
    return groups !== null
      ? all.filter((tab) => {
          return (
            (tab.title && tab.title.match(expression)) ||
            (tab.url && tab.url.match(expression))
          );
        })
      : [];
  }, [expression, all]);

  const [matches, setMatches] = useState<ExpressionGroupedOutput | null>(null);

  useEffect(() => {
    (async () => {
      if (groups === null) {
        return;
      }

      const synthesizedRules = generateTabRules(
        all,
        expression,
        selectedCaptureGroups,
        groups,
      );
      const grouper = new TabGrouper(currentWindow?.id ?? -1, synthesizedRules);

      const matches = await grouper.filter(
        all,
        {
          grouping: {
            groupBy: GroupTabsByOptions.Domain,
            sortBy: GroupSortOrder.Count,
          },
          query: '',
          tabs: {
            sortBy: TabSortOrder.Asc,
            type: TabFilterType.All,
          },
        },
        TabGroupingStrategies.Expression,
      );

      console.log(matches);
      setMatches(matches);
    })();
  }, [all, expression]);

  return {
    expression,
    valid: groups !== null,
    captureGroups: externalGroupsValue,
    totalTabs: all.length,
    matchedTabs,
    ...(matches === null
      ? { loading: true, matches: null }
      : { loading: false, matches }),
  };
}

function countExpressionGroups(
  expression: string,
): TabExpressionCaptureGroup[] | null {
  if (!expression.replaceAll(/[()]/g, '').trim()) {
    // ignore expressions which match against everything.
    return null;
  }

  let groupCountRegex: RegExp;
  try {
    // https://stackoverflow.com/questions/16046620/regex-to-count-the-number-of-capturing-groups-in-a-regex
    groupCountRegex = new RegExp(expression.toString() + '|', 'g');
  } catch {
    return null;
  }

  const groupCountMatch = groupCountRegex.exec('');

  if (!groupCountMatch) {
    return null;
  }

  const count = groupCountMatch.length - 1;

  if (count === 0) {
    return [];
  }

  const groups: TabExpressionCaptureGroup[] = [];

  let iterations = 0;

  for (let i = 0; i < expression.length; ) {
    iterations++;

    if (iterations > 1000) {
      console.error('Too many iterations', i);
      break;
    }

    const startIndex = expression.indexOf('(', i);

    if (startIndex === -1) {
      break;
    }

    if (expression[startIndex - 1] === '\\') {
      i = startIndex + 1;
      continue;
    }

    const endIndex = expression.indexOf(')', startIndex);

    if (endIndex === -1) {
      break;
    }

    groups.push({
      definition: expression.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex: endIndex + 1,
      groupIndex: groups.length,
    });

    i = endIndex + 1;
  }

  console.log('group loc', groups);
  return groups;
}

function generateTabRules(
  tabs: Tab[],
  expression: string,
  selectedCaptureGroups: number[],
  captureGroups: TabExpressionCaptureGroup[],
): Rule[] {
  const uniqueValuesPerMatchingGroup = new Map<number, Set<string>>();

  for (const tab of tabs) {
    if (!tab.title && !tab.url) continue;

    const match =
      tab.title?.match(expression) ??
      tab.url?.toLowerCase().match(expression.toLowerCase());

    if (!match) {
      continue;
    }

    for (const i of selectedCaptureGroups) {
      const group = match[i + 1];

      if (!group) {
        continue;
      }

      if (!uniqueValuesPerMatchingGroup.has(i)) {
        uniqueValuesPerMatchingGroup.set(i, new Set());
      }

      uniqueValuesPerMatchingGroup.get(i)?.add(group);
    }
  }

  console.log(uniqueValuesPerMatchingGroup);

  const uniqueCombinations =
    selectedCaptureGroups.length === 0
      ? [[expression]]
      : generateExpressionCombinations(
          uniqueValuesPerMatchingGroup,
          selectedCaptureGroups,
        );

  console.log(
    'Generated',
    uniqueCombinations.length,
    'combinations for expression',
    `"${expression}"`,
  );
  console.log(uniqueCombinations);

  const relevantCaptureGroups = captureGroups.filter((group, i) =>
    selectedCaptureGroups.includes(i),
  );
  return uniqueCombinations.map((combination) => {
    let materializedExpression = expression;
    for (let i = relevantCaptureGroups.length - 1; i >= 0; i--) {
      const group = relevantCaptureGroups[i];
      const value = combination[i];
      materializedExpression =
        materializedExpression.substring(0, group.startIndex) +
        value +
        materializedExpression.substring(group.endIndex);
    }

    return {
      displayName: combination.join(' - '),
      id: combination.join(''),
      origin: 'https://example.com',
      pathname: null,
      queryParams: [],
      regex: materializedExpression,
    } satisfies Rule;
  });
}

function generateExpressionCombinations(
  uniqueValuesPerMatchingGroup: Map<number, Set<string>>,
  selectedCaptureGroups: number[],
  index = 0,
  currentState: readonly string[] = [],
): (readonly string[])[] {
  if (!uniqueValuesPerMatchingGroup.has(selectedCaptureGroups[index])) {
    return [currentState];
  }

  const combinations: (readonly string[])[] = [];

  const matchingGroupValues = uniqueValuesPerMatchingGroup.get(
    selectedCaptureGroups[index],
  )!;

  const initialState = currentState.slice();
  for (const value of matchingGroupValues) {
    currentState = [...initialState, value];

    if (currentState.length === selectedCaptureGroups.length) {
      combinations.push(currentState);
      continue;
    }

    const childCombinations = generateExpressionCombinations(
      uniqueValuesPerMatchingGroup,
      selectedCaptureGroups,
      index + 1,
      currentState.slice(),
    );

    console.log(childCombinations);

    if (childCombinations.length === uniqueValuesPerMatchingGroup.size) {
      combinations.push(...childCombinations);
    }
  }

  return combinations;
}
