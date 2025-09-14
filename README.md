# Kanban Board - Система управления задачами

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-12.2-FFCA28?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)

Современная система управления проектами и задачами с поддержкой Kanban-досок, командной работы и интеграции с Telegram.

## Возможности

### Основные функции
- **Kanban-доски**: Визуальное управление задачами с drag-and-drop
- **Командная работа**: Приглашение участников и распределение ролей
- **Профессиональные фильтры**: Задачи по специализациям (Developer, Designer, Manager, QA)
- **Уровни приоритетов**: Гибкая система приоритизации задач
- **Дедлайны**: Отслеживание сроков с уведомлениями о просрочке

### Telegram-интеграция
- Мгновенные уведомления о новых задачах
- Напоминания о дедлайнах
- Просмотр задач прямо в Telegram
- Быстрое обновление статуса задач

### Управление пользователями
- Аутентификация через Google
- Персональные профили с профессиональными ролями
- Владельцы досок и участники
- Настройки уведомлений

## Технологический стек

### Frontend
- **React 18** с TypeScript
- **Vite** для сборки и разработки
- **React Router** для маршрутизации
- **Tailwind CSS** для стилизации
- **Radix UI** компоненты
- **@dnd-kit** для drag-and-drop функциональности

### Backend & База данных
- **Firebase Authentication** для авторизации
- **Firestore** для хранения данных
- **Firebase Hosting** для развертывания

### UI/UX
- **Lucide React** иконки
- **shadcn/ui** дизайн-система
- **date-fns** для работы с датами
- Адаптивный дизайн

## Установка и запуск

### Предварительные требования
- Node.js 18+
- npm или yarn
- Firebase проект

### Настройка проекта

1. **Клонирование репозитория**
```bash
git clone https://github.com/ReunionRS/kanban-board-workspace.git
cd kanban-board-workspace
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка Firebase**

Создайте файл `.env` в корне проекта:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Структура Firestore**

Создайте следующие коллекции в Firestore:
```
users/
  {userId}/
    - name: string
    - email: string
    - profession: string
    - telegramUsername: string (optional)
    - telegramLinked: boolean
    - createdAt: timestamp

boards/
  {boardId}/
    - title: string
    - description: string
    - members: array
    - memberEmails: array
    - createdAt: timestamp
    - updatedAt: timestamp

columns/
  {columnId}/
    - title: string
    - boardId: string
    - order: number

cards/
  {cardId}/
    - title: string
    - description: string
    - columnId: string
    - boardId: string
    - priority: string
    - profession: string
    - dueDate: timestamp (optional)
    - createdAt: timestamp
    - updatedAt: timestamp
```

### Запуск разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
```

### Развертывание на Firebase Hosting

1. **Инициализация Firebase**
```bash
firebase init hosting
```

2. **Сборка проекта**
```bash
npm run build
```

3. **Развертывание**
```bash
firebase deploy
```

Firebase Hosting настроен через `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [{"key": "Cache-Control", "value": "no-cache"}]
      }
    ]
  }
}
```

## Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── ui/             # shadcn/ui компоненты
│   ├── kanban/         # Kanban-специфичные компоненты
│   └── ...             # Диалоги и формы
├── contexts/           # React Context (Auth)
├── pages/              # Страницы приложения
├── services/           # Firebase сервисы
├── types/              # TypeScript типы
└── lib/                # Утилиты и конфигурация
```

## Основные компоненты

### Страницы
- **Login** - Аутентификация и настройка профиля
- **Dashboard** - Список досок пользователя
- **Board** - Kanban-доска с задачами
- **Profile** - Управление профилем и настройками

### Ключевые компоненты
- **KanbanColumn** - Колонка задач с drag-and-drop
- **KanbanCard** - Карточка задачи
- **CreateBoardDialog** - Создание новых досок
- **CreateTaskDialog** - Создание задач
- **TelegramLinkSection** - Интеграция с Telegram

## Пользовательский опыт

### Первый запуск
1. Вход через Google аккаунт
2. Выбор профессии для персонализации
3. Опциональная настройка Telegram-уведомлений
4. Создание первой доски

### Работа с досками
1. Создание доски с приглашением участников
2. Добавление задач с приоритетами и дедлайнами
3. Перетаскивание задач между колонками
4. Фильтрация по профессиям и поиск

### Уведомления
- В реальном времени через Firestore
- Telegram-бот для внешних уведомлений
- Визуальные индикаторы просрочек

## Безопасность

- Firebase Authentication для безопасного входа
- Firestore Security Rules для контроля доступа
- Проверка членства в досках на уровне клиента и сервера

## Мобильная адаптация

- Полностью адаптивный дизайн
- Touch-friendly drag-and-drop
- Оптимизированные диалоги для мобильных устройств
- Навигационная панель для мобильных экранов

## Производительность

- Code splitting по маршрутам
- Lazy loading компонентов
- Оптимизированные запросы к Firestore
- Real-time подписки только для активных досок

## Разработка

### Команды разработки
```bash
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run build:dev    # Сборка в dev режиме
npm run preview      # Предпросмотр собранного приложения
npm run lint         # Проверка кода ESLint
```

### Стандарты кода
- TypeScript для типобезопасности
- ESLint для проверки кода
- Prettier для форматирования (рекомендуется)
- Компонентная архитектура

## Развертывание

Проект настроен для развертывания на Firebase Hosting с автоматической настройкой SPA маршрутизации через `firebase.json`.

## Лицензия

Этот проект создан для демонстрационных целей. При использовании в коммерческих целях, пожалуйста, свяжитесь с автором.

## Поддержка

При возникновении вопросов или проблем, создайте issue в репозитории проекта.