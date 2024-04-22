import React, { MouseEventHandler, ReactNode } from 'react';
import { RulesPage } from './settings/rules/RulesPage';
import { atom, useAtom } from 'jotai';
import Features from '../../Features';

enum ToolsTab {
  Rules = 'rules',
  Organize = 'organize',
}

const activeToolsTab = atom<ToolsTab | null>(null);

export function ToolsPane() {
  const [activeTab, setActiveTab] = useAtom(activeToolsTab);

  if (!Features.TAB_GROUPING) {
    return <RulesPage />;
  }

  if (activeTab === null) {
    return <ToolsList onSelect={setActiveTab} />;
  }

  switch (activeTab) {
    case ToolsTab.Rules:
      return <RulesPage onBack={() => setActiveTab(null)} />;
    case ToolsTab.Organize:
      return <p>todo</p>;
  }
}

function ToolsList({ onSelect }: { onSelect: (tab: ToolsTab | null) => void }) {
  const onClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (Object.values(ToolsTab).includes(e.currentTarget.name as ToolsTab)) {
      onSelect(e.currentTarget.name as ToolsTab);
    } else {
      onSelect(null);
    }
  };

  return (
    <div className="divide-y">
      <ToolCard
        name={ToolsTab.Rules}
        title="Manage Rules"
        subtitle="Create rules to change how tabs are grouped"
        onClick={onClick}
      />

      <ToolCard
        name={ToolsTab.Organize}
        title="Organize Tabs"
        subtitle="Create an expression to reorder tabs across windows"
        onClick={onClick}
      />
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
