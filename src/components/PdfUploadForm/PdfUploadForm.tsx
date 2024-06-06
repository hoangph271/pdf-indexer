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
        <iframe src={pdfUrl} width="1200" height="580" />
      ) : (
        null
      )}
      <label className="flex flex-col items-center">
        <p className="flex-col flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          {pdfFilename ? null : (
            <span className="mb-4">Get started by uploading a PDF file...!</span>
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
        className="text-white bg-green-700 hover:bg-green-800 rounded-lg px-5 py-2.5 me-2 mb-2"
      >Submit</button>
    </form>
  );
}
