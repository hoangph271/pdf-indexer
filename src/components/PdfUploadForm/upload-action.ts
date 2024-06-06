'use server';
import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import 'pdfjs-dist/legacy/build/pdf.mjs';

function isTextItem (maybeTextItem: TextItem | TextMarkedContent | undefined): maybeTextItem is TextItem {
  return 'str' in (maybeTextItem ?? {});
}

function isHeaderItem (textItem: TextItem, pageHeight: number) {
  // ? scale X and scale Y (_sx and fontSize below) are often equal, can be used to infer the font size
  const [_sx, _shearY, _shearX, fontSize, _x, y] = textItem.transform;

  // ? we detect headers by check if a text item:
  // ~is the 1st item on the page (at this point, it is)~

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

async function getHeaders (pdfReader: PDFDocumentProxy, pdfDocument: PDFDocument) {
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
      headers.push(`${headerStrings.join(' ')} - ${pageIndex}`);
    }
  }

  return headers;
}

const TOC_FONT_SIZE = 16;
const TOC_LINE_HEIGHT = 20;
const TOC_PAGE_H_PADDING = 20;
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

  const firstPage = pdfDocument.getPage(0);

  const pageContentHeight = firstPage.getHeight() - TOC_PAGE_V_PADDING * 2;
  const headersPerPage = Math.floor(pageContentHeight / TOC_LINE_HEIGHT);

  let tocPageIndex = 0;

  while (headers.length) {
    const headersInPage = headers.splice(0, headersPerPage);
    const tocPage = pdfDocument.insertPage(tocPageIndex);

    tocPage.drawText(headersInPage.join('\n'), {
      x: TOC_PAGE_H_PADDING,
      y: tocPage.getHeight() - TOC_PAGE_V_PADDING,
      size: TOC_FONT_SIZE,
      lineHeight: TOC_LINE_HEIGHT,
      maxWidth: tocPage.getWidth(),
    });

    tocPageIndex += 1;
  }

  return await pdfDocument.saveAsBase64({ dataUri: true });
}
