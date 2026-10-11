"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FiCheck, FiEdit2, FiMapPin, FiPlus, FiTrash2, FiX } from "react-icons/fi";

import { useAuth } from "@/features/auth/auth-context";
import type { Address } from "@/features/auth/auth.types";
import { deleteAddress, listAddresses, saveAddress, setDefaultAddress } from "./address-api";
import { addressFormSchema, type AddressFormData } from "./address.validation";
import styles from "./profile.module.css";

const emptyAddress: AddressFormData = {
  label: "Casa", recipientName: "", postalCode: "", street: "", number: "",
  complement: "", neighborhood: "", city: "", state: "", isDefault: true,
};

function AddressManager() {
  const { refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema), defaultValues: emptyAddress,
  });

  async function load() {
    const result = await listAddresses();
    setAddresses(result);
    setLoading(false);
  }

  useEffect(() => {
    async function initialLoad() {
      await Promise.resolve();
      await load();
    }
    void initialLoad().catch(() => setLoading(false));
  }, []);

  function openNew() {
    setEditingID(null);
    reset({ ...emptyAddress, isDefault: addresses.length === 0 });
    setServerError(null);
    setFormOpen(true);
  }

  function openEdit(address: Address) {
    setEditingID(address.id);
    reset({ ...address, complement: address.complement ?? "" });
    setServerError(null);
    setFormOpen(true);
  }

  const submit: SubmitHandler<AddressFormData> = async (data) => {
    setServerError(null);
    try {
      await saveAddress({ ...data, ...(editingID ? { id: editingID } : {}) });
      await Promise.all([load(), refreshUser()]);
      setFormOpen(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Não foi possível salvar o endereço.");
    }
  };

  async function makeDefault(id: string) {
    await setDefaultAddress(id);
    await Promise.all([load(), refreshUser()]);
  }

  async function remove(id: string) {
    await deleteAddress(id);
    await Promise.all([load(), refreshUser()]);
  }

  return (
    <section className={styles.addressSection}>
      <div className={styles.addressPanel}>
        <header><button type="button" onClick={openNew}><FiPlus aria-hidden="true" /> Adicionar endereço</button></header>
        {loading ? <p className={styles.addressLoading}>Carregando endereços…</p> : addresses.length ? (
          <div className={styles.addressList}>{addresses.map((address) => (
            <article key={address.id} className={address.isDefault ? styles.defaultAddress : undefined}>
              <span><FiMapPin aria-hidden="true" /></span>
              <div><div><strong>{address.label}</strong>{address.isDefault ? <small><FiCheck aria-hidden="true" /> Padrão</small> : null}</div><p>{address.recipientName}</p><p>{address.street}, {address.number}{address.complement ? ` • ${address.complement}` : ""}</p><p>{address.neighborhood} • {address.city} — {address.state} • {address.postalCode.replace(/(\d{5})(\d{3})/, "$1-$2")}</p></div>
              <div className={styles.addressActions}>{!address.isDefault ? <button type="button" onClick={() => void makeDefault(address.id)}>Tornar padrão</button> : null}<button type="button" onClick={() => openEdit(address)} aria-label={`Editar ${address.label}`}><FiEdit2 /></button><button type="button" onClick={() => void remove(address.id)} aria-label={`Excluir ${address.label}`}><FiTrash2 /></button></div>
            </article>
          ))}</div>
        ) : <div className={styles.noAddress}><FiMapPin aria-hidden="true" /><h2>Nenhum endereço cadastrado</h2><p>Adicione um endereço para calcular entregas automaticamente.</p></div>}
      </div>

      {formOpen ? <div className={styles.addressFormBackdrop}><form className={styles.addressForm} onSubmit={handleSubmit(submit)} autoComplete="off" noValidate>
        <header><div><span>Entrega</span><h2>{editingID ? "Editar endereço" : "Novo endereço"}</h2></div><button type="button" onClick={() => setFormOpen(false)}><FiX /></button></header>
        <div className={styles.addressFields}>
          <label><span>Identificação</span><input placeholder="Casa, trabalho…" {...register("label")} />{errors.label ? <small>{errors.label.message}</small> : null}</label>
          <label><span>Destinatário</span><input {...register("recipientName")} />{errors.recipientName ? <small>{errors.recipientName.message}</small> : null}</label>
          <label><span>CEP</span><input inputMode="numeric" placeholder="00000-000" {...register("postalCode")} />{errors.postalCode ? <small>{errors.postalCode.message}</small> : null}</label>
          <label className={styles.addressWide}><span>Rua</span><input {...register("street")} />{errors.street ? <small>{errors.street.message}</small> : null}</label>
          <label><span>Número</span><input {...register("number")} />{errors.number ? <small>{errors.number.message}</small> : null}</label>
          <label><span>Complemento</span><input {...register("complement")} /></label>
          <label><span>Bairro</span><input {...register("neighborhood")} />{errors.neighborhood ? <small>{errors.neighborhood.message}</small> : null}</label>
          <label><span>Cidade</span><input {...register("city")} />{errors.city ? <small>{errors.city.message}</small> : null}</label>
          <label><span>UF</span><input maxLength={2} {...register("state")} />{errors.state ? <small>{errors.state.message}</small> : null}</label>
        </div>
        <label className={styles.defaultCheckbox}><input type="checkbox" {...register("isDefault")} /><span>Usar como endereço padrão</span></label>
        {serverError ? <p className={styles.editorServerError}>{serverError}</p> : null}
        <footer><button type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando…" : "Salvar endereço"}</button></footer>
      </form></div> : null}
    </section>
  );
}

export { AddressManager };
