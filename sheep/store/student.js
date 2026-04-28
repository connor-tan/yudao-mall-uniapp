import { defineStore } from 'pinia';
import StudentApi from '@/sheep/api/edu/student';

function normalizeStudentId(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

const student = defineStore({
  id: 'student',
  state: () => ({
    studentList: [],
    currentStudentId: undefined,
    visibilityVersion: 0,
    loaded: false,
    loading: false,
  }),
  getters: {
    currentStudent: (state) =>
      state.studentList.find((item) => item.id === state.currentStudentId) || null,
  },
  actions: {
    async initAfterLogin() {
      await this.reloadList();
    },

    async ensureLoaded(force = false) {
      if (this.loaded && !force) {
        return this.studentList;
      }
      return this.reloadList();
    },

    async reloadList() {
      if (this.loading) {
        return this.studentList;
      }
      this.loading = true;
      try {
        const response = await StudentApi.getMySimpleList();
        if (!response) {
          return this.studentList;
        }
        const { code, data } = response;
        if (code !== 0) {
          return this.studentList;
        }
        this.studentList = data || [];
        this.loaded = true;
        this.applyCurrentStudentId(this.resolveNextStudentId(this.studentList));
        return this.studentList;
      } finally {
        this.loading = false;
      }
    },

    resolveNextStudentId(studentList) {
      const persistedStudentId = normalizeStudentId(this.currentStudentId);
      const matchedStudent = studentList.find((item) => item.id === persistedStudentId);
      if (matchedStudent) {
        return matchedStudent.id;
      }
      return studentList.length > 0 ? studentList[0].id : undefined;
    },

    applyCurrentStudentId(studentId) {
      const nextStudentId = normalizeStudentId(studentId);
      if (this.currentStudentId === nextStudentId) {
        return false;
      }
      this.currentStudentId = nextStudentId;
      this.visibilityVersion += 1;
      return true;
    },

    switchCurrentStudent(studentId) {
      return this.applyCurrentStudentId(studentId);
    },

    reset() {
      const hadStudentContext = Boolean(this.currentStudentId || this.studentList.length);
      this.studentList = [];
      this.currentStudentId = undefined;
      this.loaded = false;
      this.loading = false;
      if (hadStudentContext) {
        this.visibilityVersion += 1;
      }
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'student-store',
        paths: ['currentStudentId'],
      },
    ],
  },
});

export default student;
