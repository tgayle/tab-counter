import React, { MouseEventHandler, ReactNode } from 'react';
import { RulesPage } from './settings/rules/RulesPage';
import { atom, useAtom } from 'jotai';
import Features from '../../Features';
import { TabOrganizerPage } from './features/tab-organizer/TabOrganizerPage';
import { activeToolsTab } from '../../state/ui';
import { excludePinnedTabsAtom } from '../../state/settings';

export enum ToolsTab {
  Rules = 'rules',
  Organize = 'organize',
}

export function ToolsPane() {
  const [activeTab, setActiveTab] = useAtom(activeToolsTab);

  if (activeTab === null) {
    return <ToolsList onSelect={setActiveTab} />;
  }

  switch (activeTab) {
    case ToolsTab.Rules:
      return <RulesPage onBack={() => setActiveTab(null)} />;
    case ToolsTab.Organize:
      return <TabOrganizerPage onBack={() => setActiveTab(null)} />;
  }
}

function ToolsList({ onSelect }: { onSelect: (tab: ToolsTab | null) => void }) {
  const [excludePinnedTabs, setExcludePinnedTabs] = useAtom(
    excludePinnedTabsAtom,
  );

  const onClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (Object.values(ToolsTab).includes(e.currentTarget.name as ToolsTab)) {
      onSelect(e.currentTarget.name as ToolsTab);
    } else {
      onSelect(null);
    }
  };

  return (
    <div>
      <h3 className="text-2xl p-2">Settings</h3>
      <div className="divide-y">
        <div className="form-control px-1">
          <label className="label cursor-pointer">
            <span className="label-text">
              Exclude pinned tabs from tab count
            </span>
            <input
              type="checkbox"
              checked={excludePinnedTabs}
              onChange={(e) => setExcludePinnedTabs(e.target.checked)}
              className="checkbox"
            />
          </label>
        </div>
        <ToolCard
          name={ToolsTab.Rules}
          title="Manage Rules"
          subtitle="Create rules to change how tabs are grouped"
          onClick={onClick}
        />

        {Features.TAB_GROUPING && (
          <ToolCard
            name={ToolsTab.Organize}
            title="Organize Tabs"
            subtitle="Create an expression to reorder tabs across windows"
            onClick={onClick}
          />
        )}
      </div>
    </div>
  );
}

function ToolCard({
  title,
  subtitle,
  onClick,
  name,
}: {
  name: ToolsTab;
  title: ReactNode;
  subtitle: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      name={name}
      className="p-2 text-left hover:bg-base-300 transition-colors duration-200 w-full join-item"
      onClick={onClick}
    >
      <div className=" text-sm font-semibold">{title}</div>
      <div className="opacity-75 ">{subtitle}</div>
    </button>
  );
}
