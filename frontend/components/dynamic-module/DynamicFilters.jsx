'use client';

import { SearchFilter } from '@/components/common/SearchFilter';

const getSearchFieldType = (component) => {
  switch (component) {
    case 'select':
      return 'select';
    case 'number':
      return 'number';
    case 'date':
      return 'dateRange';
    case 'datetime':
      return 'dateTimeRange';
    default:
      return 'text';
  }
};

export function DynamicFilters({ fields = [], filters = {}, onChange, onSearch, onReset }) {
  const searchableFields = fields.filter((field) => field.isSearchable);

  if (searchableFields.length === 0) return null;

  const searchFields = searchableFields.map((field) => {
    const label = field.searchLabel || field.label;
    const configuredOptions = (field.searchOptions || []).map((option) => ({
      ...option,
      value: String(option.value),
    }));

    return {
      name: field.name,
      type: getSearchFieldType(field.searchComponent),
      placeholder: field.placeholder || (
        field.searchComponent === 'select' ? `选择${label}` : `搜索${label}`
      ),
      options: field.searchComponent === 'select' && !configuredOptions.some((option) => option.value === '')
        ? [{ value: '', label: `全部${label}` }, ...configuredOptions]
        : configuredOptions,
    };
  });

  const searchValues = searchableFields.reduce((values, field) => {
    if (field.searchComponent === 'date' || field.searchComponent === 'datetime') {
      values[field.name] = {
        start: filters[`${field.name}_start`] || '',
        end: filters[`${field.name}_end`] || '',
      };
    } else {
      values[field.name] = filters[field.name] || '';
    }
    return values;
  }, {});

  const handleChange = (values) => {
    const nextFilters = { ...filters };

    searchableFields.forEach((field) => {
      if (field.searchComponent === 'date' || field.searchComponent === 'datetime') {
        nextFilters[`${field.name}_start`] = values[field.name]?.start || '';
        nextFilters[`${field.name}_end`] = values[field.name]?.end || '';
      } else {
        nextFilters[field.name] = values[field.name] || '';
      }
    });

    onChange?.(nextFilters);
  };

  const handleReset = () => {
    onChange?.({});
    onReset?.();
  };

  return (
    <SearchFilter
      variant="toolbar"
      fields={searchFields}
      values={searchValues}
      onChange={handleChange}
      onSearch={onSearch}
      onReset={handleReset}
    />
  );
}
