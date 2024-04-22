import React, { useEffect, useRef } from 'react';
import { Tab as TabType } from '../../tabutil';
import { TabItem, TabItemActions } from '../tab/TabItem';
import autoAnimate from '@formkit/auto-animate';
import { GroupAccordionIconHeader } from '../../components/groups/GroupAccordionIconHeader';

type GroupAccordionItemProps = {
  title: string;
  tabs: TabType[];
  onRemoveGroup?: () => void;
  removeGroupText?: string;
  open?: boolean;
  onOpen?(): void;
  mergeGroupText?: string;
  onMergeGroup?: () => void;
  alwaysShowGroup?: boolean;
  menuDisabled?: boolean;

  disabledOptions?: TabItemActions[];
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
  alwaysShowGroup,
  menuDisabled,
  disabledOptions,
}: GroupAccordionItemProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  if (!tabs.length) {
    return null;
  }

  const singleItemMode = tabs.length === 1 && !alwaysShowGroup;

  return (
    <div>
      {!singleItemMode && (
        <GroupAccordionIconHeader
          onOpen={onOpen}
          title={title}
          tabs={tabs}
          open={open}
          onRemoveGroup={onRemoveGroup}
          removeGroupText={removeGroupText}
          mergeGroupText={mergeGroupText}
          onMergeGroup={onMergeGroup}
          menuDisabled={menuDisabled}
        />
      )}
      <div ref={containerRef}>
        {(open || singleItemMode) && (
          <BrowserTabList tabs={tabs} hiddenOptions={disabledOptions} />
        )}
      </div>
    </div>
  );
};

export const BrowserTabList = ({
  tabs,
  hiddenOptions,
}: {
  tabs: TabType[];
  hiddenOptions?: TabItemActions[];
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current && autoAnimate(containerRef.current);
  }, [containerRef]);

  return (
    <div className="divide-y" ref={containerRef}>
      {tabs.map((tab) => (
        <TabItem tab={tab} key={tab.id} hiddenOptions={hiddenOptions} />
      ))}
    </div>
  );
};
