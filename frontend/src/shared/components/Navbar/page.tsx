"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import logo from "./avaruus.png";
import styles from "./navbar.module.css";
import { FiChevronDown, FiLogOut, FiMapPin, FiSearch, FiShield, FiUser } from "react-icons/fi";
import { FaRegBell } from "react-icons/fa6";
import { LiaShoppingCartSolid } from "react-icons/lia";
import { LuSettings } from "react-icons/lu";
import { MdFavoriteBorder, MdOutlinePersonOutline } from "react-icons/md";
import { RiShoppingBag4Line, RiStore3Line } from "react-icons/ri";

function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { status, user, signOut } = useAuth();
  const isAuthenticated = status === "authenticated" && user;
  const avatarLabel = user?.username.charAt(0).toUpperCase() ?? "";

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  function handleSignOut() {
    signOut();
    setAccountMenuOpen(false);
  }

  return (
    <header className={styles.navContainer}>
      <nav className={`${styles.navbar} ${isAuthPage ? styles.authNavbar : ""}`}>
        <Link className={styles.imageWrapper} href="/" aria-label="Avaruus — página inicial">
          <Image className={styles.imageCover} src={logo} alt="Avaruus" priority />
        </Link>

        {!isAuthPage && <>
          <Link className={styles.deliveryLocation} href={user ? "/profile?view=addresses" : "/signin"} aria-label="Alterar endereço de entrega">
            <FiMapPin aria-hidden="true" />
            <span>
              <small>{user?.defaultAddress ? `Enviar para ${user.defaultAddress.recipientName.split(" ")[0]}` : "Endereço de entrega"}</small>
              <strong>{user?.defaultAddress ? `${user.defaultAddress.street}, ${user.defaultAddress.number}` : "Cadastre seu endereço"}</strong>
            </span>
          </Link>
          <form className={styles.search} action="/books" role="search" autoComplete="off">
            <FiSearch aria-hidden="true" />
            <input name="q" type="search" placeholder="O que você está procurando?" aria-label="Buscar produtos" />
            <button type="submit">Buscar</button>
          </form>
          <div className={styles.actions}>
            {status === "loading" ? (
              <span className={styles.accountLoading} aria-label="Carregando sessão" />
            ) : isAuthenticated ? (
              <div className={styles.accountMenu} ref={accountMenuRef}>
                <button
                  className={styles.accountTrigger}
                  type="button"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                  aria-controls="account-dropdown"
                  onClick={() => setAccountMenuOpen((current) => !current)}
                >
                  <span className={`${styles.userAvatar} ${user.avatarUrl ? styles.avatarWithImage : ""}`} style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined} aria-hidden="true">{user.avatarUrl ? "" : avatarLabel}</span>
                  <span className={styles.accountUsername}>{user.username}</span>
                  <FiChevronDown className={accountMenuOpen ? styles.chevronOpen : undefined} aria-hidden="true" />
                </button>

                {accountMenuOpen ? (
                  <div className={styles.accountDropdown} id="account-dropdown">
                    <div className={styles.accountSummary}>
                      <span className={`${styles.dropdownAvatar} ${user.avatarUrl ? styles.avatarWithImage : ""}`} style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined} aria-hidden="true">{user.avatarUrl ? "" : avatarLabel}</span>
                      <span><strong>{user.username}</strong><small>{user.accountType === "SELLER" ? "Conta de vendedor" : user.accountType === "ADMIN" ? "Conta administrativa" : "Conta pessoal"}</small></span>
                    </div>
                    <nav className={styles.accountNavigation} aria-label="Menu da conta">
                      <Link href="/profile" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><MdOutlinePersonOutline className={styles.profileIcon} aria-hidden="true" /></span><span><strong>Perfil</strong><small>Dados e informações pessoais</small></span></Link>
                      <Link href="/profile?view=favorites" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><MdFavoriteBorder className={styles.favoriteIcon} aria-hidden="true" /></span><span><strong>Favoritos</strong><small>Produtos que você salvou</small></span></Link>
                      <Link href="/profile?view=purchases" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><RiShoppingBag4Line className={styles.purchaseIcon} aria-hidden="true" /></span><span><strong>Compras</strong><small>Pedidos e histórico</small></span></Link>
                      <Link href="/seller" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><RiStore3Line className={styles.sellerIcon} aria-hidden="true" /></span><span><strong>Central do vendedor</strong><small>Loja, anúncios e vendas</small></span></Link>
                      {user.accountType === "ADMIN" ? <Link href="/admin" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><FiShield aria-hidden="true" /></span><span><strong>Administração do catálogo</strong><small>Revisar e gerenciar itens</small></span></Link> : null}
                      <Link href="/profile?view=settings" onClick={() => setAccountMenuOpen(false)}><span className={styles.menuIcon}><LuSettings className={styles.settingsIcon} aria-hidden="true" /></span><span><strong>Configurações</strong><small>Preferências da conta</small></span></Link>
                    </nav>
                    <button className={styles.signOutButton} type="button" onClick={handleSignOut}><FiLogOut aria-hidden="true" />Sair</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link className={`${styles.iconLink} ${styles.loginButton}`} href="/signin" aria-label="Entrar na sua conta">
                <FiUser aria-hidden="true" /><span>Entrar</span>
              </Link>
            )}
            <Link className={styles.iconOnly} href="/profile?view=notifications" aria-label="Notificações"><FaRegBell aria-hidden="true" /></Link>
            <Link className={styles.bagLink} href="/cart" aria-label="Carrinho de compras"><LiaShoppingCartSolid aria-hidden="true" /><span className={styles.bagCount}>2</span></Link>
          </div>
        </>}
      </nav>
      {!isAuthPage && <div className={styles.mobileSearch}><form action="/books" role="search" autoComplete="off"><FiSearch aria-hidden="true" /><input name="q" type="search" placeholder="Buscar na Avaruus" aria-label="Buscar produtos" /></form></div>}
    </header>
  );
}

export { Navbar };
