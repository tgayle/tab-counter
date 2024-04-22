import React, { useEffect, useMemo, useState } from 'react';
import { MdChevronLeft } from 'react-icons/md';
import clsx from 'clsx';
import { GroupAccordionItem } from '../../../../components/groups/GroupAccordionItem';
import {
  TabItem,
  TabItemActions,
  dropdownItemHandler,
} from '../../../../components/tab/TabItem';
import {
  EvaluatedTabExpression,
  useEvaluateTabExpression,
} from './ExpressionEvaluator';
import { Tab, createTabGroup } from '../../../../tabutil';
import { ExpressionGroupedOutputResult } from '../../../../action/grouping/TabGrouper';

export function TabOrganizerPage({ onBack }: { onBack: () => void }) {
  const [expression, setExpression] = useState('');
  const [selectedCaptureGroups, setSelectedCaptureGroups] = useState<number[]>(
    [],
  );
  const [tabGroupNameTemplate, setTabGroupNameTemplate] = useState('');

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

  const generatedGroupTemplate = generateGroupTemplate(
    expressionResult,
    tabGroupNameTemplate,
    selectedCaptureGroups,
  );

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

            {expressionResult.captureGroups.length > 1 && (
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Generated Tab Group Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Type here"
                  className="input input-bordered input-sm w-full"
                  value={tabGroupNameTemplate}
                  onChange={(e) => setTabGroupNameTemplate(e.target.value)}
                />
                <div className="label">
                  <span className="label-text-alt">
                    <strong>Example:</strong> {generatedGroupTemplate}
                  </span>
                </div>
              </label>
            )}
          </>
        )}

        <div className="flex justify-between text-sm py-2">
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

        <div className="flex justify-end">
          <button
            className="btn btn-sm btn-primary"
            disabled={
              !generatedGroupTemplate ||
              !expressionResult.matches?.results.length
            }
            onClick={async () => {
              for (const group of expressionResult.matches?.results ?? []) {
                const groupName = generateGroupTemplate(
                  expressionResult,
                  tabGroupNameTemplate,
                  selectedCaptureGroups,
                  group.tabs[0],
                );
                await generateTabGroup(
                  await tabsAreAlreadyGrouped(group, groupName),
                  group,
                );
              }
            }}
          >
            Group All
          </button>
        </div>

        <div className="-mx-2">
          {expressionResult.matches?.results.map((group) => (
            <SuspenseExpressionResultGroup
              group={group}
              key={group.rule.id}
              generatedGroupTemplate={generatedGroupTemplate}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              generateTabGroup={generateTabGroup}
              expectedGroupName={generateGroupTemplate(
                expressionResult,
                tabGroupNameTemplate,
                selectedCaptureGroups,
                group.tabs[0],
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );

  async function generateTabGroup(
    alreadyGrouped: boolean,
    group: ExpressionGroupedOutputResult,
  ) {
    if (alreadyGrouped) {
      return;
    }

    const groupName = generateGroupTemplate(
      expressionResult,
      tabGroupNameTemplate,
      selectedCaptureGroups,
      group.tabs[0],
    );

    if (!groupName) {
      console.warn(
        'Group name template is invalid',
        tabGroupNameTemplate,
        expressionResult.expression,
      );
      return;
    }

    const [preexistingGroup] = await chrome.tabGroups.query({
      title: groupName,
    });

    await createTabGroup(groupName, group.tabs, null, preexistingGroup);
  }
}

async function tabsAreAlreadyGrouped(
  group: ExpressionGroupedOutputResult,
  expectedGroupName: string | null,
) {
  const firstGroupId = (group.tabs[0] as chrome.tabs.Tab).groupId;
  const firstWindowId = (group.tabs[0] as chrome.tabs.Tab).windowId;
  const alreadyGrouped = group.tabs.every((tab) => {
    return (
      'groupId' in tab &&
      tab.groupId !== chrome.tabs.TAB_ID_NONE &&
      tab.groupId === firstGroupId &&
      tab.windowId === firstWindowId
    );
  });

  const tabGroup =
    firstGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
      ? await chrome.tabGroups.get(firstGroupId)
      : null;
  return (
    alreadyGrouped &&
    expectedGroupName !== null &&
    tabGroup?.title === expectedGroupName
  );
}

function generateGroupTemplate(
  expressionResult: EvaluatedTabExpression,
  templateString: string,
  selectedCaptureGroups: number[],
  tab: Tab | undefined = expressionResult.matches?.results[0]?.tabs[0],
) {
  if (
    !tab ||
    !expressionResult.expression ||
    expressionResult.loading ||
    !tab.title
  ) {
    return null;
  }

  const { expression } = expressionResult;

  const tabMatch = tab.title.match(expression);

  if (!tabMatch) {
    return null;
  }

  const substituted = templateString.replaceAll(/(\$\d+)/g, (match) => {
    const groupOrdinal = parseInt(match.slice(1));

    if (!selectedCaptureGroups.includes(groupOrdinal - 1)) {
      return match;
    }

    return tabMatch[groupOrdinal];
  });

  return substituted;
}

function SuspenseExpressionResultGroup({
  group,
  generatedGroupTemplate,
  expandedSections,
  toggleSection,
  generateTabGroup,
  expectedGroupName,
}: {
  group: ExpressionGroupedOutputResult;
  generatedGroupTemplate: string | null;
  expandedSections: string[];
  toggleSection: (id: string) => void;
  generateTabGroup: (
    alreadyGrouped: boolean,
    group: ExpressionGroupedOutputResult,
  ) => Promise<void>;
  expectedGroupName: string | null;
}) {
  const [alreadyGrouped] = useResource(
    useMemo(
      () => () => tabsAreAlreadyGrouped(group, expectedGroupName),
      [group],
    ),
  );

  if (alreadyGrouped === null) {
    return null;
  }

  return (
    <GroupAccordionItem
      tabs={group.tabs}
      title={group.displayName}
      key={group.rule.id}
      removeGroupText="Close All"
      open={expandedSections.includes(group.rule.id)}
      onOpen={() => toggleSection(group.rule.id)}
      alwaysShowGroup
      menuDisabled={!generatedGroupTemplate || alreadyGrouped}
      extraMenuOptions={
        <div onClick={(e) => e.stopPropagation()}>
          <li
            className={clsx(alreadyGrouped && 'disabled')}
            onClick={dropdownItemHandler(() =>
              generateTabGroup(alreadyGrouped, group),
            )}
          >
            <a>Create Tab Group</a>
          </li>
        </div>
      }
      renderTab={(tab) => (
        <TabItem
          tab={tab}
          key={tab.id}
          hiddenOptions={[
            TabItemActions.CreateRuleFromTab,
            TabItemActions.MoveTabToWindow,
          ]}
        />
      )}
    />
  );
}

function useResource<T>(fn: () => Promise<T>): [T | null, Error | null] {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fn().then(setResult).catch(setError);
  }, [fn]);

  return [result!, error];
}
