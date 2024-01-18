import clsx from 'clsx';
import React from 'react';
import { MdChevronLeft, MdMoreVert } from 'react-icons/md';
import { Tab } from '../../tabutil';

type GroupAccordionIconHeaderProps = {
  onOpen: (() => void) | undefined;
  title: string;
  tabs: Tab[];
  open: boolean | undefined;
  onRemoveGroup: (() => void) | undefined;
  removeGroupText: string;
  mergeGroupText: string;
  onMergeGroup?: () => void;
};
export function GroupAccordionIconHeader({
  onOpen,
  onRemoveGroup,
  open,
  removeGroupText,
  tabs,
  title,
  mergeGroupText,
  onMergeGroup,
}: GroupAccordionIconHeaderProps) {
  return (
    <div
      className="flex font-medium p-2 items-center cursor-pointer hover:bg-gray-200 transition-colors"
      onClick={onOpen}
    >
      <span className="grow truncate text-md" title={title}>
        {title}
      </span>

      <span className="flex items-center gap-2 pl-2">
        <span>({tabs.length})</span>
        <MdChevronLeft
          size={24}
          className={
            'transition-transform ' + (open ? 'rotate-90' : '-rotate-90')
          }
        />
      </span>

      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          className="btn btn-circle btn-ghost btn-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <MdMoreVert size={20} />
        </div>

        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48"
        >
          {mergeGroupText && (
            <li
              onClick={() => onMergeGroup?.()}
              className={clsx(!onMergeGroup && 'disabled')}
            >
              <a>{mergeGroupText}</a>
            </li>
          )}

          <li onClick={() => onRemoveGroup?.()}>
            <a>{removeGroupText}</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
