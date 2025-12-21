"use client";
import React from "react";
import Button from "@/components/ui/Button";

export default function DataTable({ data = [], onEdit, onDelete }) {
  if (!data.length) return <p>No records found.</p>;

  const cols = Object.keys(data[0]);

  return (
    <div className='overflow-x-auto border rounded-[var(--radius-md)]'>
      <table className='min-w-full border-collapse'>
        <thead>
          <tr className='bg-background'>
            {cols.map((c) => (
              <th
                key={c}
                className='text-left px-3 py-2 border-b font-semibold'
              >
                {c}
              </th>
            ))}
            <th className='px-3 py-2 border-b'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className='hover:bg-surface'>
              {cols.map((c) => (
                <td key={c} className='px-3 py-2 border-b'>
                  {String(row[c] ?? "")}
                </td>
              ))}
              <td className='px-3 py-2 border-b'>
                <div className='flex gap-2'>
                  <Button size='sm' onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => onDelete(row.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
