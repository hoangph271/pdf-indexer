"use client";
import { useRef } from "react";
import { uploadFile } from "./upload-action";

export default function PdfUploadForm() {
  const fileInput = useRef(null);

  return (
    <form action={uploadFile} className="flex flex-col gap-4">
      <label>
        <span>Upload a file</span>
        <input type="file" name="file" accept="application/pdf" ref={fileInput} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
