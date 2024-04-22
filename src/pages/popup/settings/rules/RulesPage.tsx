import React, { useState } from 'react';
import { MdAdd, MdChevronLeft, MdClose, MdRestore } from 'react-icons/md';
import {
  editingRuleState,
  EditRuleDisplay,
  getEmptyRule,
  getNewRule,
  NEW_RULE,
} from '../../../../components/rules/EditRuleDisplay';
import { RuleDisplay } from '../../../../components/rules/RuleDisplay';
import { nanoid } from 'nanoid';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  addRuleAtom,
  groupingRulesAtom,
  removeRuleAtom,
  restoreDefaultRulesAtom,
  updateRuleAtom,
} from '../../../../state/rules';
import clsx from 'clsx';

export function RulesPage({ onBack }: { onBack?: () => void }) {
  const rules = useAtomValue(groupingRulesAtom);
  const addRule = useSetAtom(addRuleAtom);
  const removeRule = useSetAtom(removeRuleAtom);
  const updateRule = useSetAtom(updateRuleAtom);
  const restoreDefaultRules = useSetAtom(restoreDefaultRulesAtom);

  const [editingRule, setEditingRule] = useAtom(editingRuleState);
  const [rulesHelpOpen, setRulesHelpOpen] = useState(false);

  return (
    <div
      className={clsx(
        'flex flex-col p-2 max-h-screen',
        rulesHelpOpen && 'overflow-hidden',
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl flex items-center">
          {onBack && (
            <button
              className="btn-ghost btn btn-sm btn-square"
              aria-label="Back"
              onClick={onBack}
            >
              <MdChevronLeft size={24} />
            </button>
          )}

          <span>
            Rules
            <button
              className="text-xs opacity-60 pl-2 "
              onClick={() => setRulesHelpOpen(true)}
            >
              what?
            </button>
          </span>
        </h2>
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
            onClick={() => {
              setEditingRule({
                rule:
                  editingRule.rule.id === NEW_RULE
                    ? getEmptyRule()
                    : getNewRule(),
              });
            }}
          >
            {editingRule.rule.id === NEW_RULE ? (
              <MdClose size={24} />
            ) : (
              <MdAdd size={24} />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        {editingRule.rule.id === NEW_RULE && (
          <EditRuleDisplay
            onClose={() => setEditingRule({ rule: getEmptyRule() })}
            onEditRule={(rule) => {
              addRule({
                ...rule,
                id: nanoid(),
              });
              setEditingRule({ rule: getEmptyRule() });
            }}
          />
        )}

        {rules.map((rule) => (
          <RuleDisplay
            rule={rule}
            key={rule.id}
            onDelete={() => removeRule(rule)}
            editing={rule.id === editingRule.rule.id}
            onEdit={() => setEditingRule({ rule })}
            onEditEnd={(rule) => {
              if (rule) {
                updateRule(rule);
              }

              setEditingRule({
                rule: getEmptyRule(),
              });
            }}
          />
        ))}
      </div>

      <div className={clsx('modal', rulesHelpOpen && 'modal-open')}>
        <div className="modal-box max-h-96 overflow-auto">
          <MdClose
            className="btn btn-square btn-sm absolute right-4 top-4"
            size={16}
            onClick={() => setRulesHelpOpen(false)}
          />
          <div className="flex flex-col gap-2">
            <h2 className="card-title">Rules</h2>
            <p>Rules let you control how tabs will be grouped together.</p>
            <p>
              You can use them to give custom names to a set of tabs instead of
              using the default.
            </p>
            <p>Rules also let you influence how we identify duplicate tabs.</p>
            <p>
              <strong>Example:</strong>
            </p>

            <div>
              <p>Consider the following URLs:</p>

              <ul className="list-disc list-inside">
                <li>google.com/search?q=cats</li>
                <li>google.com/search?q=dogs</li>
              </ul>
            </div>

            <p>
              By default, tabs are considered duplicates when they have the same
              path. The path for the URLs above are both <code>/search</code>,
              so without a rule, we&apos;d count these as duplicates.
            </p>

            <p>
              Adding a simple rule fixes that. We even added a few for you by
              default!
            </p>

            <p>
              Have a look at some of the default rules we include for you for an
              idea on how to make them work for you.
            </p>

            <button
              className="btn btn-sm mt-2"
              onClick={() => setRulesHelpOpen(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
