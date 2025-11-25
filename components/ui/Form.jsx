import React from "react";
import Button from "@/components/ui/Button";

/**
 * Reusable Form Component
 *
 * @param {Object} props
 * @param {Array} props.fields - Array of field configurations
 * @param {Object} props.data - Current form data
 * @param {Function} props.onChange - Handler for field changes
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {Function} props.onCancel - Handler for cancel action
 * @param {Boolean} props.isEditing - Whether in edit mode (vs create mode)
 * @param {Boolean} props.loading - Show loading state on submit button
 * @param {String} props.submitText - Custom submit button text
 * @param {String} props.cancelText - Custom cancel button text
 */
const Form = ({
  fields = [],
  data = {},
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
  submitText,
  cancelText = "Cancel",
  className = "",
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(data);
  };

  const handleFieldChange = (fieldName, value) => {
    onChange?.(fieldName, value);
  };

  const renderField = (field) => {
    const {
      name,
      label,
      type = "text",
      required = false,
      placeholder = "",
      options = [],
      disabled = false,
      hidden = false,
      rows = 3,
      min,
      max,
      step,
      accept,
      multiple = false,
      helperText = "",
    } = field;

    if (hidden) return null;

    const fieldValue = data[name] ?? "";
    const fieldId = `field-${name}`;

    const commonClasses =
      "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-text disabled:bg-muted/10 disabled:cursor-not-allowed";

    return (
      <div key={name} className='mb-4'>
        <label
          htmlFor={fieldId}
          className='block text-sm font-medium text-text mb-1'
        >
          {label} {required && <span className='text-accent'>*</span>}
        </label>

        {/* Text Input */}
        {type === "text" && (
          <input
            id={fieldId}
            type='text'
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={commonClasses}
          />
        )}

        {/* Email Input */}
        {type === "email" && (
          <input
            id={fieldId}
            type='email'
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={commonClasses}
          />
        )}

        {/* Number Input */}
        {type === "number" && (
          <input
            id={fieldId}
            type='number'
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={commonClasses}
          />
        )}

        {/* Date Input */}
        {type === "date" && (
          <input
            id={fieldId}
            type='date'
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            className={commonClasses}
          />
        )}

        {/* Time Input */}
        {type === "time" && (
          <input
            id={fieldId}
            type='time'
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            required={required}
            disabled={disabled}
            className={commonClasses}
          />
        )}

        {/* Textarea */}
        {type === "textarea" && (
          <textarea
            id={fieldId}
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={commonClasses}
          />
        )}

        {/* Select Dropdown */}
        {type === "select" && (
          <select
            id={fieldId}
            value={fieldValue}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            required={required}
            disabled={disabled}
            className={commonClasses}
          >
            <option value=''>{placeholder || "Select an option..."}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Checkbox */}
        {type === "checkbox" && (
          <div className='flex items-center'>
            <input
              id={fieldId}
              type='checkbox'
              checked={!!fieldValue}
              onChange={(e) => handleFieldChange(name, e.target.checked)}
              disabled={disabled}
              className='h-4 w-4 text-primary focus:ring-primary border-border rounded'
            />
            <label htmlFor={fieldId} className='ml-2 text-sm text-text'>
              {helperText}
            </label>
          </div>
        )}

        {/* Radio Buttons */}
        {type === "radio" && (
          <div className='space-y-2'>
            {options.map((option) => (
              <div key={option.value} className='flex items-center'>
                <input
                  id={`${fieldId}-${option.value}`}
                  type='radio'
                  name={name}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={(e) => handleFieldChange(name, e.target.value)}
                  disabled={disabled}
                  className='h-4 w-4 text-primary focus:ring-primary border-border'
                />
                <label
                  htmlFor={`${fieldId}-${option.value}`}
                  className='ml-2 text-sm text-text'
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* File Input */}
        {type === "file" && (
          <input
            id={fieldId}
            type='file'
            onChange={(e) =>
              handleFieldChange(
                name,
                multiple ? e.target.files : e.target.files[0]
              )
            }
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20'
          />
        )}

        {/* Helper Text */}
        {helperText && type !== "checkbox" && (
          <p className='mt-1 text-xs text-muted'>{helperText}</p>
        )}
      </div>
    );
  };

  const defaultSubmitText = isEditing
    ? submitText || "Update"
    : submitText || "Create";

  return (
    <div className={`form-container ${className}`}>
      <div className='space-y-4'>{fields.map(renderField)}</div>

      {/* Form Actions */}
      <div className='flex justify-end space-x-3 mt-6 pt-4 border-t border-border'>
        {onCancel && (
          <Button
            type='button'
            onClick={onCancel}
            variant='outline'
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type='button'
          onClick={handleSubmit}
          variant='primary'
          disabled={loading}
        >
          {loading ? "Saving..." : defaultSubmitText}
        </Button>
      </div>
    </div>
  );
};

export default Form;
