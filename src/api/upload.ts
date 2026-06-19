/** A local image file ready to upload (shape produced by the image picker). */
export interface PhotoFile {
  uri: string;
  name: string;
  type: string;
}

/** Wrap a picked photo as multipart FormData under the given field name. */
export const photoFormData = (field: string, file: PhotoFile): FormData => {
  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } object for files.
  form.append(field, file as any);
  return form;
};

/** Backend stores photo URLs as a string or an array — normalise to one URL. */
export const firstPhotoUrl = (v: unknown): string | undefined => {
  if (!v) return undefined;
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : undefined;
  return typeof v === 'string' ? v : undefined;
};
