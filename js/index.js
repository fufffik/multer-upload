const express = require('express')
const path = require('path')
const filesRouter = require('./routes/files')

const app = express()
app.use(express.json())

// Отдача загруженных файлов как статика
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/upload', filesRouter)

// Глобальный error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

app.listen(3000, () => console.log('Сервер запущен на порту 3000'))
