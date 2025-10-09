/**
 * Optional field render configuration
 * Maps column names or MySQL types to custom input types
 */
export const fieldMap = {
  // Force specific fields to render as select
  fieldOverrides: {
    team_id: {
      component: "select",
      options: [
        { label: "Team A", value: 1 },
        { label: "Team B", value: 2 },
      ],
    },
    is_active: { component: "checkbox" },
    notes: { component: "textarea" },
  },

  // Map MySQL data types to input components
  typeOverrides: {
    int: "number",
    varchar: "text",
    text: "textarea",
    date: "date",
    "tinyint(1)": "checkbox",
    enum: "select",
  },
};
