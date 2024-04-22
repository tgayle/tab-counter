import React, { useEffect, useMemo, useState } from 'react';
import { MdChevronLeft } from 'react-icons/md';
import { Tab } from '../../../../tabutil';
import { useAtomValue } from 'jotai';
import { allTabsAtom, currentWindowAtom } from '../../../../state/tabs';
import clsx from 'clsx';
import {
  ExpressionGroupedOutput,
  Rule,
  TabGrouper,
} from '../../../../action/grouping/TabGrouper';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from '../../../../action/TabFilter';
import { TabGroupingStrategies } from '../../../../action/grouping/TabGroupingStrategy';
import { GroupAccordionItem } from '../../../../components/groups/GroupAccordionItem';
import { TabItemActions } from '../../../../components/tab/TabItem';

export function TabOrganizerPage({ onBack }: { onBack: () => void }) {
  const [expression, setExpression] = useState('');
  const [selectedCaptureGroups, setSelectedCaptureGroups] = useState<number[]>(
    [],
  );

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections((sections) =>
      sections.includes(id)
        ? sections.filter((section) => section !== id)
        : [...sections, id],
    );
  };

  const expressionResult = useEvaluateTabExpression(
    expression,
    selectedCaptureGroups.sort((a, b) => a - b),
  );

  useEffect(() => {
    setSelectedCaptureGroups(
      selectedCaptureGroups.filter(
        (it) => it < expressionResult.captureGroups.length,
      ),
    );
  }, [expressionResult.captureGroups]);

  return (
    <div className="p-2 grow h-full">
      <h2 className="text-xl flex items-center">
        <button
          className="btn-ghost btn btn-sm btn-square"
          aria-label="Back"
          onClick={onBack}
        >
          <MdChevronLeft size={24} />
        </button>
        Reorganize
      </h2>

      <div className="mt-4">
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Tab Expression</span>
          </div>
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
          />
        </label>

        {expressionResult.captureGroups.length > 0 && (
          <>
            <p className="text-lg">
              <strong>Group Tabs using:</strong>
            </p>

            <p>Capture Group:</p>

            <div className="flex gap-2">
              {expressionResult.captureGroups.map((_, i) => (
                <button
                  className={clsx(
                    'btn btn-circle btn-sm',
                    selectedCaptureGroups.includes(i)
                      ? 'btn-primary'
                      : 'btn-outline',
                  )}
                  key={i}
                  onClick={() =>
                    setSelectedCaptureGroups((groups) =>
                      groups.includes(i)
                        ? groups.filter((g) => g !== i)
                        : [...groups, i],
                    )
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between text-sm">
          <p>
            {expressionResult.matchedTabs.length}/{expressionResult.totalTabs}{' '}
            matched tabs
          </p>

          <p>
            {expressionResult.loading
              ? 'Loading...'
              : expressionResult.matches?.results.length
              ? `${expressionResult.matches.results.length} groups`
              : 'No groups'}
          </p>
        </div>

        <div className="-mx-2">
          {expressionResult.matches?.results.map((group) => (
            <GroupAccordionItem
              tabs={group.tabs}
              title={group.displayName}
              key={group.rule.id}
              removeGroupText="Close All"
              open={expandedSections.includes(group.rule.id)}
              onOpen={() => toggleSection(group.rule.id)}
              alwaysShowGroup
              menuDisabled
              disabledOptions={[
                TabItemActions.CreateRuleFromTab,
                TabItemActions.MoveTabToWindow,
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type TabExpressionCaptureGroup = {
  definition: string;
  startIndex: number;
  endIndex: number;
  groupIndex: number;
};

type EvaluatedTabExpression = {
  expression: string;
  valid: boolean;
  captureGroups: TabExpressionCaptureGroup[];
  totalTabs: number;
  matchedTabs: Tab[];
} & (
  | { loading: true; matches: null }
  | { loading: false; matches: ExpressionGroupedOutput }
);

function useEvaluateTabExpression(
  expression: string,
  selectedCaptureGroups: number[],
): EvaluatedTabExpression {
  const groups = useMemo(() => countExpressionGroups(expression), [expression]);
  const { all } = useAtomValue(allTabsAtom);
  const currentWindow = useAtomValue(currentWindowAtom);

  const matchedTabs = useMemo(() => {
    return groups !== null
      ? all.filter((tab) => tab.title && tab.title.match(expression))
      : [];
  }, [expression]);

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
  }, []);

  return {
    expression,
    valid: groups !== null,
    captureGroups: groups ?? [],
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
    if (!tab.title) continue;

    const match = tab.title.match(expression);

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

    console.log('Materialized expression:', `"${materializedExpression}"`);

    return {
      displayName: combination.join(' - '),
      id: combination.join(''),
      origin: 'https://example.com',
      pathname: null,
      queryParams: [],
      titleRegex: materializedExpression,
    };
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
