import { readAuthToken } from "@/features/auth/auth-storage";

const apiEndpoint = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").replace(/\/$/, "");

type UploadedMedia = {
  id: string;
  url: string;
  mimeType: "image/webp";
  size: number;
  width: number;
  height: number;
};

async function uploadProfileImage(file: File) {
  const token = readAuthToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");

  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${apiEndpoint}/uploads/images?purpose=USER_AVATAR`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const payload = await response.json().catch(() => null) as
    | { media?: UploadedMedia; error?: string }
    | null;
  if (!response.ok || !payload?.media) {
    throw new Error(payload?.error ?? "Não foi possível enviar a imagem.");
  }
  return payload.media;
}

async function deletePendingProfileImage(mediaID: string) {
  const token = readAuthToken();
  if (!token) return;
  await fetch(`${apiEndpoint}/uploads/images/${mediaID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { deletePendingProfileImage, uploadProfileImage };
