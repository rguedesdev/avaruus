"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRegBell } from "react-icons/fa6";
import {
  FiChevronRight,
  FiEdit2,
  FiLogOut,
  FiMapPin,
  FiMail,
  FiShield,
  FiShoppingBag,
} from "react-icons/fi";
import { LuSettings } from "react-icons/lu";
import { LuCalendarRange } from "react-icons/lu";
import { MdFavoriteBorder, MdOutlinePersonOutline } from "react-icons/md";
import { RiShoppingBag4Line } from "react-icons/ri";

import { useAuth } from "@/features/auth/auth-context";
import { ProfileEditor } from "./ProfileEditor";
import { AddressManager } from "./AddressManager";
import { FavoriteProducts } from "./FavoriteProducts";
import styles from "./profile.module.css";

const navigation = [
  { view: "profile", label: "Perfil", description: "Dados pessoais", icon: MdOutlinePersonOutline },
  { view: "favorites", label: "Favoritos", description: "Itens que você salvou", icon: MdFavoriteBorder },
  { view: "purchases", label: "Compras", description: "Pedidos e histórico", icon: RiShoppingBag4Line },
  { view: "addresses", label: "Endereços", description: "Entrega e frete", icon: FiMapPin },
  { view: "notifications", label: "Notificações", description: "Avisos da sua conta", icon: FaRegBell },
  { view: "settings", label: "Configurações", description: "Segurança e preferências", icon: LuSettings },
] as const;

type ProfileView = (typeof navigation)[number]["view"];

const validViews = new Set<ProfileView>(navigation.map((item) => item.view));

const accountTypeLabel = {
  CUSTOMER: "Conta pessoal",
  SELLER: "Conta de vendedor",
  ADMIN: "Conta administrativa",
} as const;

function formatMemberSince(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function EmptySection({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof FiShoppingBag;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className={styles.emptySection}>
      <span><Icon aria-hidden="true" /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <Link href={action.href}>{action.label}</Link> : null}
    </section>
  );
}

function ProfileOverview({
  name,
  username,
  email,
  accountType,
  createdAt,
  cpfMasked,
  onEdit,
}: {
  name: string;
  username: string;
  email: string;
  accountType: keyof typeof accountTypeLabel;
  createdAt: string;
  cpfMasked: string | null;
  onEdit(): void;
}) {
  return (
    <>
      <section className={styles.detailsCard} aria-labelledby="personal-data-title">
        <div className={styles.cardHeading}>
          <div>
            <h2 id="personal-data-title">Dados pessoais</h2>
            <p>Informações usadas para identificar sua conta.</p>
          </div>
          <div className={styles.cardActions}>
            <span className={styles.verifiedBadge}><FiShield aria-hidden="true" /> Conta verificada</span>
            <button type="button" onClick={onEdit}><FiEdit2 aria-hidden="true" /> Editar perfil</button>
          </div>
        </div>

        <dl className={styles.detailsGrid}>
          <div><dt>Nome completo</dt><dd>{name}</dd></div>
          <div><dt>Username</dt><dd>@{username}</dd></div>
          <div><dt>E-mail</dt><dd>{email}</dd></div>
          <div><dt>Tipo de conta</dt><dd>{accountTypeLabel[accountType]}</dd></div>
          <div><dt>CPF</dt><dd>{cpfMasked ?? "Não informado"}</dd></div>
        </dl>
      </section>

      <section className={styles.accountMeta} aria-label="Informações da conta">
        <article>
          <span><FiMail aria-hidden="true" /></span>
          <div><small>E-mail da conta</small><strong>{email}</strong></div>
        </article>
        <article>
          <span><LuCalendarRange aria-hidden="true" /></span>
          <div><small>Membro desde</small><strong>{formatMemberSince(createdAt)}</strong></div>
        </article>
        <article>
          <span><FiShield aria-hidden="true" /></span>
          <div><small>Segurança</small><strong>Senha protegida</strong></div>
        </article>
      </section>

      <section className={styles.quickLinks} aria-labelledby="quick-links-title">
        <div className={styles.sectionHeading}>
          <h2 id="quick-links-title">Acesso rápido</h2>
          <p>Continue de onde parou.</p>
        </div>
        <div>
          <Link href="/profile?view=purchases"><RiShoppingBag4Line aria-hidden="true" /><span><strong>Minhas compras</strong><small>Acompanhe pedidos e entregas</small></span><FiChevronRight aria-hidden="true" /></Link>
          <Link href="/profile?view=favorites"><MdFavoriteBorder aria-hidden="true" /><span><strong>Meus favoritos</strong><small>Veja os produtos que você salvou</small></span><FiChevronRight aria-hidden="true" /></Link>
          <Link href="/profile?view=settings"><LuSettings aria-hidden="true" /><span><strong>Configurações</strong><small>Gerencie segurança e preferências</small></span><FiChevronRight aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}

function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, signOut } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const requestedView = searchParams.get("view") as ProfileView | null;
  const activeView = requestedView && validViews.has(requestedView) ? requestedView : "profile";
  const activeViewLabel = navigation.find((item) => item.view === activeView)?.label ?? "Perfil";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin");
  }, [router, status]);

  if (status === "loading" || !user) {
    return (
      <main className={styles.loadingPage} aria-label="Carregando perfil">
        <div className={styles.loadingSidebar} />
        <div className={styles.loadingContent}><span /><span /><span /></div>
      </main>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function handleSignOut() {
    signOut();
    router.replace("/signin");
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
        <Link href="/">Home</Link><FiChevronRight aria-hidden="true" /><Link href="/profile">Minha conta</Link><FiChevronRight aria-hidden="true" /><span>{activeViewLabel}</span>
      </nav>

      <div className={styles.profileLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <span
              className={`${styles.avatar} ${user.avatarUrl ? styles.avatarWithImage : ""}`}
              style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}
              aria-hidden="true"
            >{user.avatarUrl ? "" : initials}</span>
            <div><strong>{user.name}</strong><span>@{user.username}</span><small>{accountTypeLabel[user.accountType]}</small></div>
          </div>

          <nav className={styles.profileNavigation} aria-label="Navegação da conta">
            {navigation.map(({ view, label, description, icon: Icon }) => (
              <Link
                key={view}
                href={view === "profile" ? "/profile" : `/profile?view=${view}`}
                className={activeView === view ? styles.activeNavigation : undefined}
                aria-current={activeView === view ? "page" : undefined}
              >
                <span><Icon aria-hidden="true" /></span>
                <div><strong>{label}</strong><small>{description}</small></div>
                <FiChevronRight aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <button className={styles.signOut} type="button" onClick={handleSignOut}>
            <FiLogOut aria-hidden="true" /> Sair da conta
          </button>
        </aside>

        <div className={styles.content}>
          {activeView === "profile" ? (
            <ProfileOverview {...user} onEdit={() => setEditorOpen(true)} />
          ) : activeView === "favorites" ? (
            <FavoriteProducts />
          ) : activeView === "purchases" ? (
            <EmptySection icon={RiShoppingBag4Line} title="Suas compras" description="Quando você concluir uma compra, poderá acompanhar o pedido e consultar o histórico por aqui." action={{ href: "/", label: "Continuar comprando" }} />
          ) : activeView === "addresses" ? (
            <AddressManager />
          ) : activeView === "notifications" ? (
            <EmptySection icon={FaRegBell} title="Tudo em dia" description="Você não possui novas notificações. Avisos importantes sobre sua conta e seus pedidos aparecerão aqui." />
          ) : (
            <EmptySection icon={LuSettings} title="Configurações da conta" description="As opções de segurança, privacidade e preferências da sua conta ficarão disponíveis aqui." />
          )}
        </div>
      </div>
      {editorOpen ? <ProfileEditor user={user} onClose={() => setEditorOpen(false)} /> : null}
    </main>
  );
}

export { Profile };
