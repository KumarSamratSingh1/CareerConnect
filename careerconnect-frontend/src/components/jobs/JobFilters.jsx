import { Search, RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import './JobFilters.css';

/**
 * Reusable JobFilters bar with keyword search, multi-select filters, and active filter tags.
 */
export const JobFilters = ({
  filters,
  onFilterChange,
  onReset,
  totalResults = 0
}) => {
  const hasActiveFilters = Boolean(
    filters.keyword ||
    (filters.category && filters.category !== 'ALL') ||
    (filters.type && filters.type !== 'ALL') ||
    (filters.locationType && filters.locationType !== 'ALL') ||
    (filters.experienceLevel && filters.experienceLevel !== 'ALL')
  );

  return (
    <div className="job-filters">
      {/* Top Search Line */}
      <div className="job-filters__top">
        <div className="job-filters__search">
          <Input
            label="Search Opportunities"
            placeholder="Search by job title, company, technology (e.g. React, Spring Boot, DevOps)..."
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="job-filters__grid">
        <Select
          label="Category / Discipline"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          options={[
            { value: 'ALL', label: 'All Categories' },
            { value: 'Engineering', label: 'Engineering & Tech' },
            { value: 'Data & AI', label: 'Data Science & AI' },
            { value: 'Product', label: 'Product Management' },
            { value: 'Design', label: 'UI/UX & Design' },
            { value: 'Cloud & DevOps', label: 'Cloud & DevOps' },
            { value: 'Internships', label: 'Campus Internships' }
          ]}
        />

        <Select
          label="Employment Type"
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          options={[
            { value: 'ALL', label: 'All Employment Types' },
            { value: 'Full-time', label: 'Full-time' },
            { value: 'Internship', label: 'Internship' }
          ]}
        />

        <Select
          label="Workplace Setting"
          value={filters.locationType}
          onChange={(e) => onFilterChange('locationType', e.target.value)}
          options={[
            { value: 'ALL', label: 'All Locations' },
            { value: 'Remote', label: 'Remote' },
            { value: 'Hybrid', label: 'Hybrid' },
            { value: 'On-site', label: 'On-site' }
          ]}
        />

        <Select
          label="Experience Level"
          value={filters.experienceLevel}
          onChange={(e) => onFilterChange('experienceLevel', e.target.value)}
          options={[
            { value: 'ALL', label: 'All Experience Levels' },
            { value: 'Fresher', label: 'Fresher (College / 0 Yrs)' },
            { value: 'Entry', label: 'Entry Level (1 - 3 Yrs)' },
            { value: 'Mid', label: 'Mid Level (3 - 5 Yrs)' },
            { value: 'Senior', label: 'Senior (5+ Yrs)' }
          ]}
        />
      </div>

      {/* Bottom status and active pills */}
      <div className="job-filters__actions">
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary font-medium flex items-center gap-1">
            <SlidersHorizontal size={14} className="text-brand" />
            {totalResults} {totalResults === 1 ? 'Opportunity' : 'Opportunities'} Found
          </span>

          {hasActiveFilters && (
            <div className="job-filters__active-pills">
              {filters.keyword && (
                <span className="job-filters__pill">
                  "{filters.keyword}"
                  <button
                    type="button"
                    className="job-filters__pill-remove"
                    onClick={() => onFilterChange('keyword', '')}
                    aria-label="Remove keyword filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.category && filters.category !== 'ALL' && (
                <span className="job-filters__pill">
                  {filters.category}
                  <button
                    type="button"
                    className="job-filters__pill-remove"
                    onClick={() => onFilterChange('category', 'ALL')}
                    aria-label="Remove category filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.type && filters.type !== 'ALL' && (
                <span className="job-filters__pill">
                  {filters.type}
                  <button
                    type="button"
                    className="job-filters__pill-remove"
                    onClick={() => onFilterChange('type', 'ALL')}
                    aria-label="Remove type filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.locationType && filters.locationType !== 'ALL' && (
                <span className="job-filters__pill">
                  {filters.locationType}
                  <button
                    type="button"
                    className="job-filters__pill-remove"
                    onClick={() => onFilterChange('locationType', 'ALL')}
                    aria-label="Remove location filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.experienceLevel && filters.experienceLevel !== 'ALL' && (
                <span className="job-filters__pill">
                  {filters.experienceLevel}
                  <button
                    type="button"
                    className="job-filters__pill-remove"
                    onClick={() => onFilterChange('experienceLevel', 'ALL')}
                    aria-label="Remove experience filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw size={14} />}
          >
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
