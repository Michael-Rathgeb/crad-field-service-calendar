// Department configs
import fieldService from './departments/field_service';
import clinical from './departments/clinical';

// Region configs
import americas from './regions/americas';

const departments = {
  field_service: fieldService,
  clinical: clinical
};

const regions = {
  americas: americas
};

// Read from environment variables (set at build time)
const activeDepartment = import.meta.env.VITE_DEPARTMENT || 'field_service';
const activeRegion = import.meta.env.VITE_REGION || 'americas';

export const departmentConfig = departments[activeDepartment];
export const regionConfig = regions[activeRegion];
export const allDepartments = departments;
export const allRegions = regions;

// Convenience exports
export const DEPARTMENT = activeDepartment;
export const REGION = activeRegion;
