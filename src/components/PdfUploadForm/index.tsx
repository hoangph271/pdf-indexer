"use client";
import { useRef } from "react";
import { uploadFile } from "./upload-action";

export default function PdfUploadForm () {
  const fileInput = useRef(null);

  return (
    <form action={uploadFile} className="flex flex-col gap-4">
      <label className="flex flex-col items-center">
        <span>Upload a file</span>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          ref={fileInput}
          required
        />
      </label>
      <button
        type="submit"
        className="text-white bg-green-700 hover:bg-green-800 rounded-lg px-5 py-2.5 me-2 mb-2"
      >Submit</button>
    </form>
  );
}
