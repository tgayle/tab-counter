import browser from 'webextension-polyfill';
import { getCurrentWindow, Tab } from '../tabutil';
import { TabGroupResult } from './grouping/TabGrouper';
import {
  GroupSortOrder,
  GroupTabsByOptions,
  TabFilterType,
  TabSortOrder,
} from './TabFilter';

export type Filters = {
  query: string;
  tabs: {
    type: TabFilterType;
    sortBy: TabSortOrder;
  };
  grouping: {
    groupBy: GroupTabsByOptions;
    sortBy: GroupSortOrder;
  };
};

export class TabFilterProcessor {
  static readonly viaIpc: IPCHelpers = {
    async execute({ filters, targetTabs }) {
      const msg: IPCMessages['msg'] = {
        data: { filters, targetTabs },
        type: 'execute',
      };
      return sendIpc(msg);
    },
  };
}

type IPCHelpers = {
  [T in IPCMessages['key']]: Extract<
    IPCMessages,
    { key: T }
  >['msg']['data'] extends null
    ? () => Promise<Extract<IPCMessages, { key: T }>['res']>
    : (
        input: Extract<IPCMessages, { key: T }>['msg']['data'],
      ) => Promise<Extract<IPCMessages, { key: T }>['res']>;
};

async function sendIpc<R>(msg: BaseIPCMessage<string, any, any>['msg']) {
  const id = (await getCurrentWindow()).id;
  const res: R = await browser.runtime.sendMessage({
    ...msg,
    windowId: id,
  });

  return res;
}

type BaseIPCMessage<T extends string, I, R> = {
  res: R;
  key: T;
  msg: {
    type: T;
    windowId?: number;
    data: I;
  };
};

export type IPCMessages = BaseIPCMessage<
  'execute',
  { filters: Filters; targetTabs: Tab[] },
  TabGroupResult
>;

export function profile<T = void>(name: string, action: () => T): T {
  const start = performance.now();
  const r = action();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
  return r;
}

export function profiler(name: string) {
  const start = performance.now();

  return {
    done: () => {
      const end = performance.now();
      console.log(`${name} took ${end - start}ms`);
    },
  };
}
