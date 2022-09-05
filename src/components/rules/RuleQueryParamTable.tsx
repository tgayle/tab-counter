import React, { FC, useState } from 'react';
import { MdAdd, MdRemove } from 'react-icons/md';

export const RuleQueryParamTable: FC<{
  query: string[];
  addQuery?(q: string): void;
  removeQuery?(q: string): void;
}> = ({ query, addQuery, removeQuery }) => {
  const [newQueryText, setNewQueryText] = useState('');

  return (
    <table className="table table-compact w-full shadow-md rounded-bl-md rounded-br-md">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {query.map((query) => (
          <tr key={query}>
            <td className="flex justify-between items-center">
              <span className="font-mono">{query}</span>

              {removeQuery ? (
                <button
                  className="btn btn-circle btn-ghost btn-sm"
                  onClick={() => removeQuery(query)}
                >
                  <MdRemove size={16} />
                </button>
              ) : null}
            </td>
          </tr>
        ))}

        {addQuery ? (
          <>
            <tr>
              <td>
                <input
                  type="text"
                  className="input w-full input-sm"
                  placeholder="Add a new query parameter"
                  value={newQueryText}
                  onChange={(e) => setNewQueryText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addQuery(newQueryText);
                      setNewQueryText('');
                    }
                  }}
                />
              </td>
            </tr>
            <tr>
              <td className="p-0">
                <button
                  className="btn btn-ghost btn-sm w-full rounded-t-none rounded-b-md"
                  onClick={() => (addQuery(newQueryText), setNewQueryText(''))}
                >
                  <MdAdd size={16} />
                  Add Query
                </button>
              </td>
            </tr>
          </>
        ) : null}
      </tbody>
    </table>
  );
};
