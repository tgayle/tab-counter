import React, { useState } from 'react';
import { MdAdd, MdClose, MdRestore } from 'react-icons/md';
import { useStore } from '../../store';
import {
  EditRuleDisplay,
  NEW_RULE,
} from '../../components/rules/EditRuleDisplay';
import { RuleDisplay } from '../../components/rules/RuleDisplay';
import { nanoid } from 'nanoid';

export function SettingsPane() {
  const rules = useStore(({ state }) => state.rules);
  const addRule = useStore(({ state }) => state.addRule);
  const removeRule = useStore(({ state }) => state.removeRule);
  const updateRule = useStore(({ state }) => state.updateRule);
  const restoreDefaultRules = useStore(
    ({ state }) => state.restoreDefaultRules,
  );
  const [editingRule, setEditingRule] = useState<string | null>(null);

  return (
    <div className="flex flex-col p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Rules</h2>
        <div>
          {rules.length === 0 && (
            <div className="tooltip" data-tip="Restore default rules">
              <button
                className="btn btn-circle btn-sm btn-ghost "
                onClick={restoreDefaultRules}
              >
                <MdRestore size={24} />
              </button>
            </div>
          )}
          <button
            className="btn btn-ghost btn-circle "
            onClick={() =>
              setEditingRule(editingRule === NEW_RULE ? null : NEW_RULE)
            }
          >
            {editingRule === NEW_RULE ? (
              <MdClose size={24} />
            ) : (
              <MdAdd size={24} />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        {editingRule === NEW_RULE && (
          <EditRuleDisplay
            rule={{
              id: NEW_RULE,
              displayName: null,
              origin: '',
              pathname: '',
              queryParams: [],
            }}
            onClose={() => setEditingRule(null)}
            onEditRule={(rule) => {
              addRule({
                ...rule,
                id: nanoid(),
              });
              setEditingRule(null);
            }}
          />
        )}

        {rules.map((rule) => (
          <RuleDisplay
            rule={rule}
            key={rule.id}
            onDelete={() => removeRule(rule)}
            editing={rule.id === editingRule}
            onEdit={() => setEditingRule(rule.id)}
            onEditEnd={(rule) => {
              if (rule) {
                updateRule(rule);
              }

              setEditingRule(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}
