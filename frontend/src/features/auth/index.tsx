"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from "react-hook-form";
import { FiArrowRight, FiAtSign, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { MdOutlinePersonOutline } from "react-icons/md";

import { useAuth } from "./auth-context";
import styles from "./auth.module.css";
import {
  signInFormSchema,
  signUpFormSchema,
  type SignInFormData,
  type SignUpFormData,
} from "./auth.validation";

type PasswordInputProps = {
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
};

function PasswordInput({ id, label, placeholder, registration, error }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <div><FiLock aria-hidden="true" /><input id={id} type={visible ? "text" : "password"} placeholder={placeholder} aria-invalid={Boolean(error)} {...registration} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button></div>
      {error ? <small className={styles.fieldError}>{error}</small> : null}
    </label>
  );
}

function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { login: "", password: "", remember: true },
  });

  const submit: SubmitHandler<SignInFormData> = async ({ login, password, remember }) => {
    setServerError(null);
    try {
      await signIn({ login, password }, remember);
      router.replace("/");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} autoComplete="off" noValidate>
      <label className={styles.field} htmlFor="login">
        <span>Username ou e-mail</span>
        <div><FiMail aria-hidden="true" /><input id="login" type="text" placeholder="konsamazs ou voce@exemplo.com" aria-invalid={Boolean(errors.login)} {...register("login")} /></div>
        {errors.login ? <small className={styles.fieldError}>{errors.login.message}</small> : null}
      </label>
      <PasswordInput id="password" label="Senha" placeholder="Digite sua senha" registration={register("password")} error={errors.password?.message} />
      <div className={styles.formOptions}><label><input type="checkbox" {...register("remember")} /><span>Lembrar de mim</span></label><Link href="/signin">Esqueci minha senha</Link></div>
      {serverError ? <p className={styles.formError} role="alert">{serverError}</p> : null}
      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "Entrando…" : "Entrar"}<FiArrowRight aria-hidden="true" /></button>
    </form>
  );
}

function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "", terms: false },
  });

  const submit: SubmitHandler<SignUpFormData> = async (formData) => {
    setServerError(null);
    try {
      const input = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
      await signUp(input);
      router.replace("/");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Não foi possível criar sua conta.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} autoComplete="off" noValidate>
      <label className={styles.field} htmlFor="name"><span>Nome completo</span><div><MdOutlinePersonOutline className={styles.nameIcon} aria-hidden="true" /><input id="name" type="text" placeholder="Digite seu nome" aria-invalid={Boolean(errors.name)} {...register("name")} /></div>{errors.name ? <small className={styles.fieldError}>{errors.name.message}</small> : null}</label>
      <label className={styles.field} htmlFor="username"><span>Username</span><div><FiAtSign aria-hidden="true" /><input id="username" type="text" placeholder="Escolha seu username" autoCapitalize="none" aria-invalid={Boolean(errors.username)} {...register("username")} /></div>{errors.username ? <small className={styles.fieldError}>{errors.username.message}</small> : null}</label>
      <label className={styles.field} htmlFor="email"><span>E-mail</span><div><FiMail aria-hidden="true" /><input id="email" type="email" placeholder="voce@exemplo.com" aria-invalid={Boolean(errors.email)} {...register("email")} /></div>{errors.email ? <small className={styles.fieldError}>{errors.email.message}</small> : null}</label>
      <PasswordInput id="password" label="Senha" placeholder="Crie uma senha segura" registration={register("password")} error={errors.password?.message} />
      <PasswordInput id="confirmPassword" label="Confirme sua senha" placeholder="Digite a senha novamente" registration={register("confirmPassword")} error={errors.confirmPassword?.message} />
      <label className={styles.terms}><input type="checkbox" {...register("terms")} /><span>Li e aceito os <a href="#">Termos de uso</a> e a <a href="#">Política de privacidade</a>.</span></label>
      {errors.terms ? <small className={styles.fieldError}>{errors.terms.message}</small> : null}
      {serverError ? <p className={styles.formError} role="alert">{serverError}</p> : null}
      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "Criando conta…" : "Criar conta"}<FiArrowRight aria-hidden="true" /></button>
    </form>
  );
}

function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const isSignIn = mode === "signin";

  return (
    <main className={styles.page} style={{ minHeight: "100vh" }}>
      <div className={styles.authLayout}>
        <section className={styles.formPanel} aria-labelledby="auth-title">
          <div className={styles.formHeader}>
            <span>{isSignIn ? "Bem-vindo de volta" : "Comece agora"}</span>
            <h1 id="auth-title">{isSignIn ? "Entre na sua conta" : "Crie sua conta"}</h1>
            <p>{isSignIn ? "Use seus dados para continuar na Avaruus." : "Preencha seus dados para entrar na Avaruus."}</p>
          </div>
          {isSignIn ? <SignInForm /> : <SignUpForm />}
          <p className={styles.switchMode}>{isSignIn ? "Ainda não possui uma conta?" : "Já possui uma conta?"}<Link href={isSignIn ? "/signup" : "/signin"}>{isSignIn ? "Cadastre-se" : "Entrar"}</Link></p>
        </section>
      </div>
    </main>
  );
}

export function SignIn() { return <AuthPage mode="signin" />; }
export function SignUp() { return <AuthPage mode="signup" />; }
