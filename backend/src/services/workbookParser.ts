import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'
import csvParser from 'csv-parser'
import { Readable } from 'stream'
import { detectDelimiter } from '../utils/studentImportFields'

export interface ParsedWorkbook {
  headers: string[]
  rows: string[][]
}

function isExcelFile(originalname: string) {
  return path.extname(originalname).toLowerCase() === '.xlsx'
}

function cellToString(v: any): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t: any) => t.text).join('')
    if ('result' in v) return cellToString(v.result)
    if ('text' in v) return String(v.text)
    return ''
  }
  return String(v).trim()
}

async function parseExcel(filePath: string): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const sheet = workbook.worksheets[0]
  if (!sheet) return { headers: [], rows: [] }

  const allRows: string[][] = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = []
    // ExcelJS rows are 1-indexed and sparse; values[0] is always undefined.
    const values = row.values as any[]
    for (let i = 1; i < values.length; i++) {
      cells.push(cellToString(values[i]))
    }
    allRows.push(cells)
  })

  if (allRows.length === 0) return { headers: [], rows: [] }
  const [headerRow, ...dataRows] = allRows
  return { headers: headerRow, rows: dataRows.filter((r) => r.some((c) => c.trim() !== '')) }
}

async function parseCsv(filePath: string): Promise<ParsedWorkbook> {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '')
  const headerLine = raw.split(/\r?\n/)[0] || ''
  const separator = detectDelimiter(headerLine)

  const headers: string[] = []
  const rows: string[][] = []

  await new Promise<void>((resolve, reject) => {
    Readable.from([raw])
      .pipe(csvParser({ separator, headers: false }))
      .on('data', (row: Record<string, string>) => {
        const cells = Object.keys(row).sort((a, b) => Number(a) - Number(b)).map((k) => (row[k] ?? '').trim())
        if (headers.length === 0) {
          headers.push(...cells)
        } else if (cells.some((c) => c !== '')) {
          rows.push(cells)
        }
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  })

  return { headers, rows }
}

export async function parseWorkbook(filePath: string, originalname: string): Promise<ParsedWorkbook> {
  if (isExcelFile(originalname)) return parseExcel(filePath)
  return parseCsv(filePath)
}
