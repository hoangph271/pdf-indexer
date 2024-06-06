'use client';
import { useRef, useState } from 'react';
import { uploadFile } from './upload-action' ;

export default function PdfUploadForm () {
  const fileInput = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');

  const handleUpload = async (formData: FormData) => {
    setPdfUrl('');

    const pdfFilename = (formData.get('file') as File).name;

    const pdfBase64Url = await uploadFile(formData);

    setPdfUrl(pdfBase64Url);
    setPdfFilename(pdfFilename);
  };

  return (
    <form action={handleUpload} className="flex flex-col gap-4">
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="1200"
          height="580"
          style={{
            maxWidth: 'calc(100vw - 4rem)',
          }}
        />
      ) : (
        null
      )}
      <div className={`flex ${pdfUrl ? 'justify-center' : 'flex-col'} gap-4`}>
        <label className="flex flex-col items-center align-center">
          <p className="flex-col flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 p-4 rounded-2xl backdrop-blur-2xl">
            {pdfFilename ? null : (
              <span className="mb-4 text-center">Get started by uploading a PDF file...!</span>
            )}
            <input
              type="file"
              name="file"
              accept="application/pdf"
              ref={fileInput}
              required
            />
          </p>
        </label>
        <button
          type="submit"
          className={`${pdfUrl ? 'self-center' : ''} text-white bg-green-700 hover:bg-green-800 rounded-lg px-5 py-2.5`}
        >
          Submit
        </button>
      </div>
    </form>
  );
}
