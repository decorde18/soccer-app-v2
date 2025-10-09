"use client";
import React, { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { fieldMap } from "@/lib/fieldMap";

export default function DynamicForm({ table, onSubmit, defaults = {} }) {
  const [schema, setSchema] = useState([]);
  const [values, setValues] = useState(defaults);

  useEffect(() => {
    fetch(`/api/${table}/schema`)
      .then((r) => r.json())
      .then(setSchema)
      .catch(console.error);
  }, [table]);

  const handleChange = (field, value) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };
  const getComponentType = (col) => {
    const fieldOverride = fieldMap.fieldOverrides[col.name];
    if (fieldOverride) return fieldOverride.component;

    const type = col.type.toLowerCase();
    for (const key in fieldMap.typeOverrides) {
      if (type.includes(key)) return fieldMap.typeOverrides[key];
    }
    return "text";
  };

  const getOptions = (col) => {
    const fieldOverride = fieldMap.fieldOverrides[col.name];
    if (fieldOverride?.options) return fieldOverride.options;
    if (col.type.includes("enum")) return parseEnumValues(col.type);
    return [];
  };
  if (!schema.length) return <p>Loading form...</p>;

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {schema
        .filter((c) => !c.isPrimary)
        .map((col) => {
          const componentType = getComponentType(col);
          const value = values[col.name] ?? "";

          switch (componentType) {
            case "textarea":
              return (
                <Textarea
                  key={col.name}
                  label={col.name}
                  value={value}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                />
              );
            case "select":
              return (
                <Select
                  key={col.name}
                  label={col.name}
                  options={getOptions(col)}
                  value={value}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                />
              );
            case "checkbox":
              return (
                <div key={col.name} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={!!value}
                    onChange={(e) => handleChange(col.name, e.target.checked)}
                  />
                  <label>{col.name}</label>
                </div>
              );
            default:
              return (
                <Input
                  key={col.name}
                  label={col.name}
                  type={componentType}
                  value={value}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                />
              );
          }
        })}

      <Button type='submit'>Save</Button>
    </form>
  );
}

/** Helpers */
function detectInputType(mysqlType) {
  if (mysqlType.includes("int")) return "number";
  if (mysqlType.includes("date")) return "date";
  if (mysqlType.includes("bool") || mysqlType.includes("tinyint(1)"))
    return "checkbox";
  return "text";
}

function parseEnumValues(typeString) {
  const matches = typeString.match(/enum\((.+)\)/i);
  if (!matches) return [];
  return matches[1]
    .split(",")
    .map((v) => v.replace(/'/g, ""))
    .map((v) => ({ label: v, value: v }));
}
