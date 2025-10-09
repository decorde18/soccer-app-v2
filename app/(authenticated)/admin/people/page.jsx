"use client";
import { useEffect, useState } from "react";
import DynamicForm from "@/components/admin/DynamicForm";
import DataTable from "@/components/admin/DataTable";

export default function PeopleAdmin() {
  const table = "people";
  const [people, setPeople] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await fetch(`/api/${table}`);
    setPeople(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (data) => {
    const method = data.id ? "PUT" : "POST";
    await fetch(`/api/${table}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/${table}?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className='p-6 space-y-6'>
      <h1 className='text-2xl font-bold'>Manage People</h1>

      <DynamicForm
        table={table}
        defaults={editing || {}}
        onSubmit={handleSubmit}
      />

      <DataTable
        data={people}
        onEdit={(row) => setEditing(row)}
        onDelete={handleDelete}
      />
    </div>
  );
}
