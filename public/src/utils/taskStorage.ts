
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  createdAt: string;
}

const STORAGE_KEY = 'standup-tasks';

export const getTasksForDate = (date: string): Task[] => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${date}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

export const saveTasks = (date: string, tasks: Task[]): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${date}`, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

export const getAllTaskDates = (): string[] => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_KEY))
      .map(key => key.replace(`${STORAGE_KEY}-`, ''))
      .sort()
      .reverse();
  } catch (error) {
    console.error('Error getting task dates:', error);
    return [];
  }
};
