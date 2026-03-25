export interface AcademicResource {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "image" | "video" | "other";
  tags: string[];
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  resources: AcademicResource[];
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface AcademicStructure {
  semesters: Semester[];
}
