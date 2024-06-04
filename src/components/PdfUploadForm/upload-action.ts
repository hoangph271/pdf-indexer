"use server";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  console.info(file)
}
