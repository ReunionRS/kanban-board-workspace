import { db } from '@/firebase/config';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Board, Column, Task, User as KanbanUser, Profession } from '@/types/kanban';

export class FirestoreService {
  static validateProfession(profession: string | undefined): Profession {
    const validProfessions: Profession[] = ['developer', 'designer', 'manager', 'qa', 'unknown'];
    return validProfessions.includes(profession as Profession) ? (profession as Profession) : 'unknown';
  }

  static sanitizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    } else if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    return data;
  }

  static async saveBoard(board: Board) {
    const sanitizedBoard = this.sanitizeData(board);
    const boardRef = doc(db, 'boards', board.id);
    await setDoc(boardRef, sanitizedBoard);
  }

  static async getBoards(userEmail: string): Promise<Board[]> {
    const q = query(
      collection(db, 'boards'), 
      where('memberEmails', 'array-contains', userEmail)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Board));
  }

  static async saveColumn(column: Column) {
    const sanitizedColumn = this.sanitizeData(column);
    const columnRef = doc(db, 'columns', column.id);
    await setDoc(columnRef, sanitizedColumn);
  }

  static async getBoardColumns(boardId: string): Promise<Column[]> {
    const q = query(
      collection(db, 'columns'), 
      where('boardId', '==', boardId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Column));
  }

  static async saveCard(task: Task) {
    const sanitizedTask = this.sanitizeData(task);
    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, sanitizedTask);
  }

  static subscribeToBoardCards(boardId: string, callback: (tasks: Task[]) => void): () => void {
    try {
      console.log('Subscribing to tasks for board:', boardId);
      
      const q = query(
        collection(db, 'tasks'),
        where('boardId', '==', boardId)
      );

      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const tasks: Task[] = [];
          querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() } as Task);
          });
          
          console.log('Snapshot received:', tasks.length, 'tasks');
          callback(tasks);
        },
        (error) => {
          console.error('Error in real-time subscription:', error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up subscription:', error);
      return () => {};
    }
  }

  static async getColumnCards(columnId: string, profession?: string): Promise<Task[]> {
    let q = query(
      collection(db, 'tasks'), 
      where('columnId', '==', columnId)
    );
    if (profession) {
      q = query(q, where('profession', '==', profession));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }

  static async getCards(): Promise<Task[]> {
    const snapshot = await getDocs(collection(db, 'tasks'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  }

  static async updateCard(task: Task) {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      
      const updateData: any = {
        columnId: task.columnId,
        updatedAt: task.updatedAt,
        title: task.title,
        description: task.description,
        priority: task.priority,
        profession: task.profession,
        labels: task.labels || [],
        references: task.references || '',
        assignee: task.assignee || null,
        comments: task.comments || 0,
        attachments: task.attachments || 0
      };

      if (task.dueDate) {
        updateData.dueDate = task.dueDate;
      } else {
        updateData.dueDate = null;
      }

      if (task.createdAt) {
        updateData.createdAt = task.createdAt;
      }

      console.log('Updating task:', updateData);
      
      await updateDoc(taskRef, updateData);
      console.log('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteCard(taskId: string) { 
    await deleteDoc(doc(db, 'tasks', taskId));
  }

  static async saveUser(user: any) {
    console.log('FirestoreService: Saving user:', user);
    
    const validatedUser = {
      ...user,
      profession: this.validateProfession(user.profession),
      telegramId: user.telegramId || null,
      telegramUsername: user.telegramUsername || null,
      telegramChatId: user.telegramChatId || null,
      telegramLinked: user.telegramLinked || false
    };
    
    const sanitizedUser = this.sanitizeData(validatedUser);
    console.log('FirestoreService: Sanitized user:', sanitizedUser);
    
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, sanitizedUser, { merge: true });
    console.log('FirestoreService: User saved successfully');
  }

  static async getUserByEmail(email: string): Promise<KanbanUser | null> {
    console.log('FirestoreService: Getting user by email:', email);
    
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const userData = snapshot.docs[0].data();
      const user = {
        id: snapshot.docs[0].id,
        ...userData,
        profession: this.validateProfession(userData.profession),
        telegramChatId: userData.telegramChatId || null,
        telegramLinked: userData.telegramLinked || false
      } as KanbanUser;
      
      console.log('FirestoreService: Found user:', user);
      return user;
    }
    
    console.log('FirestoreService: User not found');
    return null;
  }

  static async getUsers(): Promise<KanbanUser[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      profession: this.validateProfession(d.data().profession),
      telegramChatId: d.data().telegramChatId || null,
      telegramLinked: d.data().telegramLinked || false
    } as KanbanUser));
  }

  static async getUserByTelegramUsername(username: string): Promise<KanbanUser | null> {
    console.log('FirestoreService: Getting user by telegram username:', username);
    
    const q = query(collection(db, 'users'), where('telegramUsername', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const userData = snapshot.docs[0].data();
      const user = {
        id: snapshot.docs[0].id,
        ...userData,
        profession: this.validateProfession(userData.profession),
        telegramChatId: userData.telegramChatId || null,
        telegramLinked: userData.telegramLinked || false
      } as KanbanUser;
      
      console.log('FirestoreService: Found user by telegram username:', user);
      return user;
    }
    
    console.log('FirestoreService: User not found by telegram username');
    return null;
  }

  static async updateUserTelegramInfo(userId: string, telegramData: {
    telegramChatId?: string;
    telegramLinked?: boolean;
  }) {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        ...telegramData,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updateData);
      console.log('FirestoreService: User telegram info updated');
      return true;
    } catch (error) {
      console.error('FirestoreService: Error updating telegram info:', error);
      return false;
    }
  }

  static async getLinkedTelegramUsers(): Promise<KanbanUser[]> {
    const q = query(
      collection(db, 'users'), 
      where('telegramLinked', '==', true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      profession: this.validateProfession(d.data().profession),
      telegramChatId: d.data().telegramChatId || null,
      telegramLinked: d.data().telegramLinked || false
    } as KanbanUser));
  }

  static getCurrentUser(): any | null {
    try {
      const stored = localStorage.getItem('currentUser');
      const user = stored ? JSON.parse(stored) : null;
      console.log('FirestoreService: getCurrentUser from cache:', user);
      return user;
    } catch (error) {
      console.error('FirestoreService: Error getting current user from cache:', error);
      return null;
    }
  }

  static setCurrentUser(profile: any) {
    try {
      const validatedProfile = {
        ...profile,
        profession: this.validateProfession(profile.profession),
        telegramChatId: profile.telegramChatId || null,
        telegramLinked: profile.telegramLinked || false
      };
      console.log('FirestoreService: Setting current user in cache:', validatedProfile);
      localStorage.setItem('currentUser', JSON.stringify(validatedProfile));
    } catch (error) {
      console.error('FirestoreService: Error setting current user in cache:', error);
    }
  }

  static clearCurrentUser() {
    console.log('FirestoreService: Clearing current user from cache');
    localStorage.removeItem('currentUser');
  }

  static async deleteBoard(boardId: string) {
    await deleteDoc(doc(db, 'boards', boardId));
    const columns = await this.getBoardColumns(boardId);
    for (const col of columns) {
      const tasks = await this.getColumnCards(col.id);
      for (const task of tasks) {
        await deleteDoc(doc(db, 'tasks', task.id));
      }
      await deleteDoc(doc(db, 'columns', col.id));
    }
  }

  static async initializeDefaultData(user: any) {
    console.log('Initializing default data for user:', user.email);
    const defaultBoard: Board = {
      id: `personal_${user.uid}`,
      title: `Персональные задачи - ${user.name}`,
      description: 'Личные задачи пользователя',
      columns: [
        { id: `col_personal_1`, title: 'Запланировано', tasks: [], boardId: `personal_${user.uid}`, order: 0 },
        { id: `col_personal_2`, title: 'В работе', tasks: [], boardId: `personal_${user.uid}`, order: 1 },
        { id: `col_personal_3`, title: 'Завершено', tasks: [], boardId: `personal_${user.uid}`, order: 2 }
      ],
      members: [{
        id: user.uid,
        name: user.name,
        email: user.email,
        profession: this.validateProfession(user.profession),
        avatar: user.avatar,
        telegramId: user.telegramId,
        role: user.role || 'owner',
        telegramUsername: user.telegramUsername,
        telegramChatId: user.telegramChatId || null,
        telegramLinked: user.telegramLinked || false,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      }],
      memberEmails: [user.email],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.saveBoard(defaultBoard);
    defaultBoard.columns.forEach(col => this.saveColumn(col));
  }
}