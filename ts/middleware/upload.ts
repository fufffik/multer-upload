import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import type { Request } from 'express'

// Убедиться что папки существуют
const uploadDirs = ['uploads/avatars', 'uploads/documents', 'uploads/temp']
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// ── DiskStorage для аватаров ──
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/avatars')
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// ── DiskStorage для документов ──
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/documents')
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${timestamp}_${safeName}`)
  }
})

// ── MemoryStorage для обработки в памяти ──
const memoryStorage = multer.memoryStorage()

// ── Фильтры по типу файла ──
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Разрешены только изображения: JPEG, PNG, WebP, GIF'))
  }
}

const documentFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Разрешены только документы: PDF, DOC, DOCX, TXT, CSV'))
  }
}

// ── Конфигурации Multer ──

// Загрузка аватара — одно изображение до 2 МБ
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 МБ
    files: 1
  }
})

// Загрузка документов — несколько файлов до 10 МБ каждый
export const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 МБ
    files: 5
  }
})

// Загрузка в память для обработки
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 МБ
  }
})
