import React, { FC, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import { defaultRules, Rule } from '../../action/grouping/TabGrouper';
export function SettingsPane() {
  return (
    <div>
      <h2 className="text-2xl">Rules</h2>

      <div className="flex flex-col gap-3">
        {defaultRules.map((rule) => (
          <RuleDisplay rule={rule} key={rule.id} />
        ))}
      </div>
    </div>
  );
}

const RuleDisplay: FC<{ rule: Rule }> = ({ rule }) => {
  const [editing, setEditing] = useState(false);
  return (
    <div className="card card-compact shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{rule.displayName ?? rule.origin}</h2>

        <div>
          <p>
            <strong>Domain: </strong>
            <span className="font-mono">{rule.origin}</span>
          </p>
          {rule.pathname !== null && (
            <p>
              Path must {rule.useExactPath ? 'be' : 'start with'}{' '}
              <span className="font-mono">{rule.pathname}/</span>
            </p>
          )}
        </div>

        <div className="card-actions justify-between">
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => setEditing(!editing)}
          >
            <MdDelete size={24} />
          </button>

          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => setEditing(!editing)}
          >
            <MdEdit size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
