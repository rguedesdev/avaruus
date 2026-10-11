"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FiAtSign, FiCamera, FiLock, FiMail, FiSave, FiTrash2, FiUser, FiX } from "react-icons/fi";

import { useAuth } from "@/features/auth/auth-context";
import type { AuthUser } from "@/features/auth/auth.types";
import { deletePendingProfileImage, uploadProfileImage } from "./profile-api";
import { profileFormSchema, type ProfileFormData } from "./profile.validation";
import styles from "./profile.module.css";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;

function ProfileEditor({ user, onClose }: { user: AuthUser; onClose(): void }) {
  const { updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      email: user.email,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      cpf: "",
    },
  });

  function selectImage(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    if (!allowedImageTypes.has(file.type)) {
      setImageError("Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > maxImageBytes) {
      setImageError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(file);
    setSelectedFile(file);
    setRemoveAvatar(false);
  }

  function clearAvatar() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(Boolean(user.avatarUrl));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const submit: SubmitHandler<ProfileFormData> = async (formData) => {
    setServerError(null);
    let uploadedMediaID: string | null = null;

    try {
      if (selectedFile) {
        const media = await uploadProfileImage(selectedFile);
        uploadedMediaID = media.id;
      }
      await updateProfile({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        ...(uploadedMediaID ? { avatarImageID: uploadedMediaID } : {}),
        ...(removeAvatar ? { removeAvatar: true } : {}),
        ...(formData.cpf ? { cpf: formData.cpf.replace(/\D/g, "") } : {}),
        ...(formData.newPassword ? {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword,
        } : {}),
      });
      onClose();
    } catch (error) {
      if (uploadedMediaID) await deletePendingProfileImage(uploadedMediaID);
      setServerError(error instanceof Error ? error.message : "Não foi possível atualizar o perfil.");
    }
  };

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.editorBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section className={styles.editorDialog} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <header className={styles.editorHeader}>
          <div><span>Minha conta</span><h2 id="edit-profile-title">Editar perfil</h2></div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Fechar edição"><FiX aria-hidden="true" /></button>
        </header>

        <form className={styles.editorForm} onSubmit={handleSubmit(submit)} autoComplete="off" noValidate>
          <div className={styles.avatarEditor}>
            <span className={styles.editorAvatar}>
              {/* Prévia local em data URL; não deve passar pelo otimizador de imagens do Next. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewUrl ? <img src={previewUrl} alt="Prévia da foto de perfil" /> : initials}
            </span>
            <div>
              <strong>Foto de perfil</strong>
              <p>JPG, PNG ou WebP de até 5 MB. A imagem será convertida para WebP.</p>
              <div>
                <label className={styles.imageButton}><FiCamera aria-hidden="true" /> Escolher imagem<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImage(event.target.files?.[0])} /></label>
                {previewUrl ? <button className={styles.removeImageButton} type="button" onClick={clearAvatar}><FiTrash2 aria-hidden="true" /> Remover</button> : null}
              </div>
              {imageError ? <small className={styles.editorError}>{imageError}</small> : null}
            </div>
          </div>

          <div className={styles.editorFields}>
            <label><span>Nome completo</span><div><FiUser aria-hidden="true" /><input type="text" aria-invalid={Boolean(errors.name)} {...register("name")} /></div>{errors.name ? <small>{errors.name.message}</small> : null}</label>
            <label><span>Username</span><div><FiAtSign aria-hidden="true" /><input type="text" autoCapitalize="none" aria-invalid={Boolean(errors.username)} {...register("username")} /></div>{errors.username ? <small>{errors.username.message}</small> : null}</label>
            <label className={styles.fullField}><span>E-mail</span><div><FiMail aria-hidden="true" /><input type="email" aria-invalid={Boolean(errors.email)} {...register("email")} /></div>{errors.email ? <small>{errors.email.message}</small> : null}</label>
            <label className={styles.fullField}><span>CPF {user.cpfMasked ? `(atual: ${user.cpfMasked})` : ""}</span><div><FiUser aria-hidden="true" /><input type="text" inputMode="numeric" placeholder={user.cpfMasked ? "Digite somente para substituir" : "000.000.000-00"} aria-invalid={Boolean(errors.cpf)} {...register("cpf")} /></div>{errors.cpf ? <small>{errors.cpf.message}</small> : null}</label>
          </div>

          <section className={styles.passwordSection} aria-labelledby="password-section-title">
            <div><h3 id="password-section-title">Alterar senha</h3><p>Deixe os campos vazios para manter sua senha atual.</p></div>
            <div className={styles.editorFields}>
              <label className={styles.fullField}><span>Senha atual</span><div><FiLock aria-hidden="true" /><input type="password" aria-invalid={Boolean(errors.currentPassword)} {...register("currentPassword")} /></div>{errors.currentPassword ? <small>{errors.currentPassword.message}</small> : null}</label>
              <label><span>Nova senha</span><div><FiLock aria-hidden="true" /><input type="password" aria-invalid={Boolean(errors.newPassword)} {...register("newPassword")} /></div>{errors.newPassword ? <small>{errors.newPassword.message}</small> : null}</label>
              <label><span>Confirme a nova senha</span><div><FiLock aria-hidden="true" /><input type="password" aria-invalid={Boolean(errors.confirmNewPassword)} {...register("confirmNewPassword")} /></div>{errors.confirmNewPassword ? <small>{errors.confirmNewPassword.message}</small> : null}</label>
            </div>
          </section>

          {serverError ? <p className={styles.editorServerError} role="alert">{serverError}</p> : null}

          <footer className={styles.editorActions}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" disabled={isSubmitting || Boolean(imageError)}><FiSave aria-hidden="true" />{isSubmitting ? "Salvando…" : "Salvar alterações"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export { ProfileEditor };
