import React, { FC, useState } from 'react';
import { RuleQueryParamTable } from './RuleQueryParamTable';
import { Rule } from '../../action/grouping/TabGrouper';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Tab } from '../../tabutil';

export const NEW_RULE = 'NEW_RULE';

export function getNewRule(): Rule {
  return {
    id: NEW_RULE,
    displayName: '',
    origin: '',
    pathname: '',
    queryParams: [],
    useExactPath: false,
  };
}

export const getEmptyRule = (): Rule => ({
  ...getNewRule(),
  id: '',
});

export const editingRuleState = atom<{
  rule: Rule;
}>({
  rule: {
    ...getNewRule(),
    id: '',
  },
});

export const getNewRuleFromTab = (tab: Tab): Rule => {
  if (!tab.url) return getNewRule();

  const url = new URL(tab.url);
  return {
    id: NEW_RULE,
    displayName: url.origin,
    origin: url.origin,
    pathname: url.pathname,
    queryParams: [...url.searchParams.keys()],
  };
};

export const EditRuleDisplay: FC<{
  // TODO: Accept rule as prop again
  onClose(): void;
  onEditRule(rule: Rule): void;
}> = ({ onClose, onEditRule }) => {
  const { rule } = useAtomValue(editingRuleState);
  const [name, setName] = useState(rule.displayName ?? '');
  const [domain, setDomain] = useState(rule.origin ?? '');
  const [path, setPath] = useState(rule.pathname);
  const [query, setQuery] = useState(rule.queryParams);
  const [ignorePath, setIgnorePath] = useState(rule.pathname === null);
  const [strictPath, setStrictPath] = useState(rule.useExactPath);

  const dirty =
    name !== rule.displayName ||
    domain !== rule.origin ||
    path !== rule.pathname ||
    query.length !== rule.queryParams.length ||
    query.some((q) => !rule.queryParams.includes(q)) ||
    strictPath !== rule.useExactPath;

  const canSubmit = name.length > 0 && domain.length > 0;

  const modifiedRule: Rule = {
    ...rule,
    queryParams: query,
    useExactPath: strictPath && !ignorePath,
    pathname: ignorePath ? null : path,
    origin: domain,
    displayName: name,
  };

  const addNewQueryParam = (query: string) => {
    if (query) {
      setQuery((q) => [...new Set([...q, query])]);
    }
  };

  return (
    <div className="card card-compact shadow-xl">
      <div className="card-body">
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            placeholder="Type here"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full max-w-xs card-title"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Domain</span>
          </label>
          <input
            type="text"
            placeholder="https://example.com"
            className="input input-bordered"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>

        {!ignorePath && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Path</span>
            </label>
            <input
              type="text"
              placeholder="/path/to/page"
              className="input input-bordered"
              value={path ?? ''}
              onChange={(e) => setPath(e.target.value || null)}
            />
          </div>
        )}

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Ignore Path</span>
            <input
              type="checkbox"
              className="toggle"
              checked={ignorePath}
              onChange={(e) => {
                setIgnorePath(e.target.checked);
                setPath('');
                setStrictPath(false);
              }}
            />
          </label>
        </div>

        {!ignorePath && (
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Use Exact Path</span>
              <input
                type="checkbox"
                className="toggle"
                checked={strictPath}
                onChange={(e) => setStrictPath(e.target.checked)}
              />
            </label>
          </div>
        )}

        <h3 className="text-xl">Query</h3>
        <RuleQueryParamTable
          query={query}
          addQuery={addNewQueryParam}
          removeQuery={(queryToRemove) =>
            setQuery(query.filter((q) => q !== queryToRemove))
          }
        />

        {canSubmit && (
          <div>
            <h3 className="text-xl">Summary</h3>
            <ul className="list-disc list-inside">
              <li>
                <strong>Domain:</strong> {domain}
              </li>
              {ignorePath || !path ? (
                <li>Include all links at this domain</li>
              ) : (
                <li>
                  <strong>Path:</strong>{' '}
                  {strictPath ? 'matches' : 'starts with'}{' '}
                  <span className="font-mono">{path}</span>
                </li>
              )}
              {query.length > 0 && (
                <li>
                  <strong>Query:</strong> must contain
                  <ul className="list-disc list-inside pl-4">
                    {query.map((q) => (
                      <li key={q} className="font-mono">
                        {q}
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="card-actions justify-between items-center">
          <span
            className="font-mono text-gray-500 max-w-[15ch] truncate"
            title={rule.id !== NEW_RULE ? rule.id : undefined}
          >
            {rule.id !== NEW_RULE ? rule.id : ''}
          </span>

          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => onClose()}>
              Cancel
            </button>

            {dirty && (
              <button
                className="btn btn-primary btn-sm"
                disabled={!canSubmit}
                onClick={() => onEditRule(modifiedRule)}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
