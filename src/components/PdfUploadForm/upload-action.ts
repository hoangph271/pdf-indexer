'use server';
import { PDFDocument } from 'pdf-lib';
import puppeteer, { type PDFOptions } from 'puppeteer';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// ? Workaround for pdfjs-dist, refer https://github.com/vercel/next.js/issues/58313#issuecomment-1807184812
import('pdfjs-dist/legacy/build/pdf.worker.mjs');

function isTextItem (maybeTextItem: TextItem | TextMarkedContent | undefined): maybeTextItem is TextItem {
  return 'str' in (maybeTextItem ?? {});
}

function isHeaderItem (textItem: TextItem, pageHeight: number) {
  // ? scale X and scale Y (_sx and fontSize below) are often equal, can be used to infer the font size
  const [_sx, _shearY, _shearX, fontSize, _x, y] = textItem.transform;

  // ? we detect headers by check if a text item:

  // ? (1) has fontSize >= HEADER_FONT_SIZE_THRESHOLD
  if (fontSize < HEADER_FONT_SIZE_THRESHOLD) return false;

  const trimmedContent = textItem.str.trim();

  // ? (2) AND is NOT an empty string
  if (trimmedContent.length === 0) return false;
  // * the character '\0' (NULL) is NOT removed by trim()
  if (trimmedContent === '\0') return false;

  // ? (3) AND is positioned on the top 10% of page height
  const isPositionedAsHeader = y - fontSize > pageHeight * 0.9;

  if (isPositionedAsHeader) {
    return true;
  }
}

type PdfHeader = {
  title: string
  pageIndex: number
}

async function getHeaders (pdfReader: PDFDocumentProxy, pdfDocument: PDFDocument): Promise<PdfHeader[]> {
  const headers = [];

  for (let pageIndex = 0; pageIndex < pdfReader.numPages; pageIndex++) {
    // * pdfReader count page number from 1
    const page = await pdfReader.getPage(pageIndex + 1);

    const textContent = await page.getTextContent();
    const pageHeight = pdfDocument.getPage(pageIndex).getHeight();

    const headerStrings = textContent.items
      .filter(isTextItem)
      .filter(it => isHeaderItem(it, pageHeight))
      .map(it => it.str.trim())
      .filter(Boolean);

    if (headerStrings.length) {
      headers.push({
        title: headerStrings.join(' '),
        pageIndex,
      });
    }
  }

  return headers;
}

async function generateTocPdf (headers: PdfHeader[], options: PDFOptions) {
  const browser = await puppeteer.launch({
    headless: true,
    // ! --no-sandbox to allow puppeteer to work inside Docker
    // TODO: Remove this workaround
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  const tocHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          font-family: sans-serif;
        }
        h2 {
          text-align: center;
          margin-top: 0;
        }
        ul {
          padding: 0;
          list-style: none;
        }
        li {
          gap: 0.5rem;
          display: flex;
          font-size: ${TOC_FONT_SIZE}px;
          line-height: ${TOC_LINE_HEIGHT}px;
        }
        .spacer {
          flex-grow: 1;
          display: flex;
          align-items: center;
        }
        .spacer::after {
          content: "";
          display: block;
          width: 100%;
          border-bottom: 1px dashed lightgray;
          margin-top: 1px;
        }
      </style>
    </head>
    <body>
      <h2>Table of Contents</h2>
      <ul>
        ${headers.map((header) => {
    return `
            <li>
            ${header.title}
              <span class="spacer"></span>
            ${header.pageIndex}
            </li>`;
  }).join('\n')}
      </ul>
    </body>
    </html>
  `;

  await page.setContent(tocHtml);

  const pdfBuffer = await page.pdf(options);

  return pdfBuffer;
}

const TOC_FONT_SIZE = 16;
const TOC_LINE_HEIGHT = 20;
const TOC_PAGE_H_PADDING = 40;
const TOC_PAGE_V_PADDING = 40;
const HEADER_FONT_SIZE_THRESHOLD = 12;

export async function uploadFile (formData: FormData) {
  const file = formData.get('file') as File;
  const pdfBuffer = await file.arrayBuffer();

  // ? workaround, as importing pdfjs-dist is broken
  // ? refer this GitHub issue https://github.com/vercel/next.js/issues/58313
  // ? for more information & potential fixes
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const pdfReader = await getDocument(pdfBuffer.slice(0)).promise;
  const pdfDocument = await PDFDocument.load(pdfBuffer);

  const headers = await getHeaders(pdfReader, pdfDocument);

  const tocPdfBuffer = await generateTocPdf(headers, {
    width: pdfDocument.getPage(0).getWidth(),
    height: pdfDocument.getPage(0).getHeight(),
    margin: {
      top: TOC_PAGE_V_PADDING,
      bottom: TOC_PAGE_V_PADDING,
      left: TOC_PAGE_H_PADDING,
      right: TOC_PAGE_H_PADDING,
    },
  });

  const tocPdf = await PDFDocument.load(tocPdfBuffer);

  const tocPageIndices = Array
    .from({ length: tocPdf.getPageCount() }, (_, i) => i);

  const tocPages = await pdfDocument.copyPages(tocPdf, tocPageIndices);

  tocPages.forEach((tocPage, i) => {
    pdfDocument.insertPage(i, tocPage);
  });

  return await pdfDocument.saveAsBase64({ dataUri: true });
}
