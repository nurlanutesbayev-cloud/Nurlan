# Аян FMCG Trend Tracker

## Деплой на Vercel (5 минут)

### Шаг 1 — GitHub
1. Зайдите на **github.com** → зарегистрируйтесь или войдите
2. Нажмите **"New repository"** (зелёная кнопка)
3. Название: `ayan-trend-tracker`
4. Нажмите **"Create repository"**
5. Нажмите **"uploading an existing file"**
6. Перетащите ВСЕ файлы из папки `ayan-tracker` (включая папку `src`)
7. Нажмите **"Commit changes"**

### Шаг 2 — Vercel
1. Зайдите на **vercel.com** → войдите через GitHub
2. Нажмите **"Add New Project"**
3. Выберите репозиторий `ayan-trend-tracker`
4. Framework Preset: выберите **Vite**
5. Нажмите **"Deploy"**
6. Через 1 минуту получите ссылку вида `ayan-trend-tracker.vercel.app`

### Обновление трекера
Когда получите новую версию файла от Claude:
1. Замените файл `src/App.jsx` в GitHub (кнопка "Edit" или перетащите новый файл)
2. Vercel автоматически обновит сайт через 30 секунд
3. Все пользователи увидят новую версию сразу — кэш не нужен

## Локальный запуск
```bash
npm install
npm run dev
```
