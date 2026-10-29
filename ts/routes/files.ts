import { Router, Request, Response, NextFunction } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { uploadAvatar, uploadDocuments, uploadToMemory } from '../middleware/upload'

const router = Router()

// ── Обработка ошибок Multer ──
function handleUploadError(
  err: Error & { code?: string },
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Файл слишком большой' })
    return
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({ error: 'Превышено максимальное количество файлов' })
    return
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ error: 'Неожиданное поле файла' })
    return
  }
  if (err.message) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
}

// ── POST /upload/avatar — загрузка одного аватара ──
router.post(
  '/avatar',
  uploadAvatar.single('avatar'),
  handleUploadError,
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: 'Файл не загружен' })
      return
    }

    res.status(201).json({
      message: 'Аватар загружен',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/avatars/${req.file.filename}`
      }
    })
  }
)

// ── POST /upload/documents — загрузка нескольких документов ──
router.post(
  '/documents',
  uploadDocuments.array('documents', 5),
  handleUploadError,
  (req: Request, res: Response): void => {
    const uploaded = req.files as Express.Multer.File[] | undefined
    if (!uploaded || uploaded.length === 0) {
      res.status(400).json({ error: 'Файлы не загружены' })
      return
    }

    const files = uploaded.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/documents/${file.filename}`
    }))

    res.status(201).json({
      message: `Загружено файлов: ${files.length}`,
      files
    })
  }
)

// ── POST /upload/profile — файл + текстовые поля вместе ──
router.post(
  '/profile',
  uploadAvatar.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  handleUploadError,
  (req: Request, res: Response): void => {
    const { name, bio } = req.body as { name?: string; bio?: string }
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined
    const avatar = files?.avatar?.[0]
    const cover = files?.cover?.[0]

    if (!name) {
      res.status(400).json({ error: 'Поле name обязательно' })
      return
    }

    res.status(201).json({
      message: 'Профиль обновлён',
      profile: {
        name,
        bio: bio || '',
        avatar: avatar ? `/uploads/avatars/${avatar.filename}` : null,
        cover: cover ? `/uploads/avatars/${cover.filename}` : null
      }
    })
  }
)

// ── POST /upload/image/process — обработка изображения в памяти ──
router.post(
  '/image/process',
  uploadToMemory.single('image'),
  handleUploadError,
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: 'Файл не загружен' })
      return
    }

    // req.file.buffer содержит бинарные данные файла
    const base64 = req.file.buffer.toString('base64')

    res.json({
      message: 'Файл получен в памяти',
      size: req.file.size,
      preview: `data:${req.file.mimetype};base64,${base64.substring(0, 50)}...`
    })
  }
)

// ── DELETE /upload/:folder/:filename — удаление файла ──
router.delete('/:folder/:filename', async (req: Request, res: Response): Promise<void> => {
  const folder = String(req.params.folder)
  const filename = String(req.params.filename)
  const allowedFolders = ['avatars', 'documents']

  if (!allowedFolders.includes(folder)) {
    res.status(400).json({ error: 'Недопустимая папка' })
    return
  }

  // Защита от path traversal
  const safeName = path.basename(filename)
  const filePath = path.join('uploads', folder, safeName)

  try {
    await fs.unlink(filePath)
    res.json({ message: 'Файл удалён' })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: 'Файл не найден' })
      return
    }
    throw err
  }
})

export default router
