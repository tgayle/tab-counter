import React, { useEffect, useRef } from 'react';
import { Tab as TabType } from '../../tabutil';
import { TabItem } from '../tab/TabItem';
import autoAnimate from '@formkit/auto-animate';
import { GroupAccordionIconHeader } from '../../components/groups/GroupAccordionIconHeader';

type GroupAccordionItemProps = {
  title: string;
  tabs: TabType[];
  onRemoveGroup?: () => void;
  removeGroupText?: string;
  open?: boolean;
  onOpen?(): void;
  mergeGroupText: string;
  onMergeGroup?: () => void;
};

export const GroupAccordionItem = ({
  title,
  tabs,
  onRemoveGroup,
  open,
  removeGroupText = 'Close Window',
  onOpen,
  mergeGroupText,
  onMergeGroup,
}: GroupAccordionItemProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  if (!tabs.length) {
    return null;
  }

  return (
    <div>
      {tabs.length > 1 && (
        <GroupAccordionIconHeader
          onOpen={onOpen}
          title={title}
          tabs={tabs}
          open={open}
          onRemoveGroup={onRemoveGroup}
          removeGroupText={removeGroupText}
          mergeGroupText={mergeGroupText}
          onMergeGroup={onMergeGroup}
        />
      )}
      <div ref={containerRef}>
        {(open || tabs.length === 1) && <BrowserTabList tabs={tabs} />}
      </div>
    </div>
  );
};

export const BrowserTabList = ({ tabs }: { tabs: TabType[] }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  return (
    <div className="divide-y" ref={containerRef}>
      {tabs.map((tab) => (
        <TabItem tab={tab} key={tab.id} />
      ))}
    </div>
  );
};
