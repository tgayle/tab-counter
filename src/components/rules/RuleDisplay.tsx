import React, { FC } from 'react';
import { Rule } from '../../action/grouping/TabGrouper';
import { EditRuleDisplay } from './EditRuleDisplay';
import { MdDelete, MdEdit } from 'react-icons/md';
import { RuleQueryParamTable } from './RuleQueryParamTable';

export const RuleDisplay: FC<{
  rule: Rule;
  editing: boolean;
  onEdit(): void;
  onEditEnd(editedRule?: Rule): void;
  onDelete(): void;
}> = ({ rule, editing, onEdit, onEditEnd, onDelete }) => {
  if (editing)
    return <EditRuleDisplay onClose={onEditEnd} onEditRule={onEditEnd} />;

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
              <RulePathExplanation rule={rule} />
            </p>
          )}
        </div>

        {rule.queryParams.length > 0 && (
          <RuleQueryParamTable query={rule.queryParams} />
        )}

        <div className="card-actions justify-between">
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => onDelete()}
          >
            <MdDelete size={24} />
          </button>

          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => onEdit()}
          >
            <MdEdit size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RulePathExplanation: FC<{ rule: Rule }> = ({ rule }) => {
  return (
    <>
      Path must {rule.useExactPath ? 'be' : 'start with'}{' '}
      <span className="font-mono">{rule.pathname}</span>
    </>
  );
};
